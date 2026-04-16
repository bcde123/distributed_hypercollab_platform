const redisClient = require('../config/redis');
const User = require('../models/User');

// ── In-memory cache to avoid hammering Redis on every poll ─────────────────
// TTL: 5 seconds — the dashboard polls every 30 s so this is generous
const CACHE_TTL_MS = 5_000;
const responseCache = new Map(); // workspaceId → { data, cachedAt }

function getCached(workspaceId) {
    const entry = responseCache.get(workspaceId);
    if (entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) return entry.data;
    return null;
}

function setCache(workspaceId, data) {
    responseCache.set(workspaceId, { data, cachedAt: Date.now() });
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/analytics
// ────────────────────────────────────────────────────────────────────────────
const getWorkspaceAnalytics = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const range = parseInt(req.query.days, 10) || 7; // support ?days=30
        const days  = Math.min(Math.max(range, 1), 30);  // clamp 1–30

        // Check short-lived response cache
        const cacheKey = `${workspaceId}:${days}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json({ success: true, data: cached, cached: true });

        // ── Date array ────────────────────────────────────────────────────────
        const dates = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - (days - 1 - i));
            return d.toISOString().split('T')[0];
        });

        // ── Redis keys ────────────────────────────────────────────────────────
        const prefix = `analytics:workspace:${workspaceId}`;

        const scalarKeys = [
            `${prefix}:total_completed`,
            `${prefix}:total_duration_ms`,
            `${prefix}:total_created`,
            `${prefix}:event_count:task_created`,
            `${prefix}:event_count:task_updated`,
            `${prefix}:event_count:task_completed`,
            `${prefix}:event_count:task_deleted`,
        ];

        const dailyKeys    = dates.map(d => `${prefix}:daily:${d}`);
        const activityKeys = dates.map(d => `${prefix}:activity_events:${d}`);

        // Single round-trip for all scalar + time-series keys
        const allKeys = [...scalarKeys, ...dailyKeys, ...activityKeys];
        const vals    = await redisClient.mget(allKeys);

        const p = (idx) => parseInt(vals[idx] || '0', 10); // shorthand parser

        const totalCompleted = p(0);
        const totalDurationMs = parseInt(vals[1] || '0', 10); // keep as full int
        const totalCreated    = p(2);
        const evtCreated      = p(3);
        const evtUpdated      = p(4);
        const evtCompleted    = p(5);
        const evtDeleted      = p(6);

        const sOff = scalarKeys.length; // offset into vals for daily
        const aOff = sOff + dailyKeys.length;

        // Avg completion time
        const avgCompletionTimeHours = totalCompleted > 0
            ? parseFloat((totalDurationMs / totalCompleted / 3_600_000).toFixed(2))
            : 0;

        // Completion rate: completed / created
        const completionRate = totalCreated > 0
            ? parseFloat(((totalCompleted / totalCreated) * 100).toFixed(1))
            : 0;

        // Daily completions
        const dailyActivity = dates.map((date, i) => ({
            date,
            count: parseInt(vals[sOff + i] || '0', 10),
        }));

        // Daily total events (created + updated + deleted + completed)
        const activityTrend = dates.map((date, i) => ({
            date,
            events: parseInt(vals[aOff + i] || '0', 10),
        }));

        // ── Productivity score (0-100) ────────────────────────────────────────
        // Simple heuristic: weighted blend of completion rate, avg speed, and activity trend
        const recentActivity = activityTrend.slice(-3).reduce((s, d) => s + d.events, 0);
        const activityScore  = Math.min(recentActivity / 15, 1) * 30;
        const rateScore      = Math.min(completionRate / 100, 1) * 40;
        const speedScore     = avgCompletionTimeHours > 0
            ? Math.min(48 / avgCompletionTimeHours, 1) * 30 // faster = higher
            : 0;
        const productivityScore = Math.round(activityScore + rateScore + speedScore);

        // ── User breakdown ────────────────────────────────────────────────────
        const rawHash = await redisClient.hgetall(`${prefix}:user_completed`);
        const hash = rawHash || {};
        const userIds = Object.keys(hash);
        let tasksPerUser = [];

        if (userIds.length > 0) {
            const users = await User.find({ _id: { $in: userIds } }, 'name email').lean();
            tasksPerUser = users
                .map(u => ({
                    userId: u._id,
                    name: u.name,
                    email: u.email,
                    completed: parseInt(hash[u._id.toString()] || '0', 10),
                }))
                .sort((a, b) => b.completed - a.completed);
        }

        // ── Build response ────────────────────────────────────────────────────
        const data = {
            totalCompleted,
            totalCreated,
            avgCompletionTimeHours,
            completionRate,
            productivityScore,
            eventBreakdown: {
                created:   evtCreated,
                updated:   evtUpdated,
                completed: evtCompleted,
                deleted:   evtDeleted,
            },
            tasksPerUser,
            dailyActivity,
            activityTrend,
        };

        setCache(cacheKey, data);
        res.json({ success: true, data });

    } catch (error) {
        console.error('Analytics Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/analytics/health
// ────────────────────────────────────────────────────────────────────────────
const getEngineHealth = async (req, res) => {
    try {
        const raw = await redisClient.get('analytics:engine:health');
        if (!raw) {
            return res.json({
                success: true,
                engine: { status: 'offline', message: 'No heartbeat detected' },
            });
        }
        const health = JSON.parse(raw);
        res.json({ success: true, engine: health });
    } catch (error) {
        console.error('Engine Health Error:', error);
        res.status(500).json({ success: false, message: 'Could not read engine health' });
    }
};

module.exports = { getWorkspaceAnalytics, getEngineHealth };
