import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";
import {
  BarChart2, Activity, Clock, CheckCircle, Users,
  TrendingUp, RefreshCw, Zap, Target, Cpu, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════════════
   Animated number counter — counts from 0 → target over ~800ms
   ═══════════════════════════════════════════════════════════════════════════ */
function useAnimatedNumber(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) { setDisplay(target); return; }
    const start = performance.now();
    const from = 0;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mini Sparkline — renders an SVG path from a number array
   ═══════════════════════════════════════════════════════════════════════════ */
function Sparkline({ data, width = 100, height = 28, color = "#6366f1" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Productivity Score Gauge — circular SVG gauge 0-100
   ═══════════════════════════════════════════════════════════════════════════ */
function ProductivityGauge({ score }) {
  const animScore = useAnimatedNumber(score, 1200);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animScore / 100) * circumference;
  const color = animScore >= 70 ? "#10b981" : animScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke 0.5s" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-neutral-800">{animScore}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-neutral-500">Productivity Score</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Engine Status Badge — reads from /analytics/health
   ═══════════════════════════════════════════════════════════════════════════ */
function EngineStatus({ workspaceId }) {
  const [status, setStatus] = useState("unknown");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    const check = async () => {
      try {
        const res = await api.get(`/workspaces/${workspaceId}/analytics/health`);
        const eng = res.data?.engine;
        setStatus(eng?.status || "offline");
        if (eng?.uptime_events !== undefined)
          setDetail(`${eng.uptime_events} events processed`);
      } catch {
        setStatus("offline");
      }
    };
    check();
    const iv = setInterval(check, 20_000);
    return () => clearInterval(iv);
  }, [workspaceId]);

  const dot = {
    running: "bg-emerald-500 shadow-emerald-400",
    stopped: "bg-amber-500 shadow-amber-400",
    offline: "bg-red-500 shadow-red-400",
    unknown: "bg-neutral-400",
  }[status] || "bg-neutral-400";

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <Cpu className="h-3.5 w-3.5" />
      <span className={`w-2 h-2 rounded-full shadow-sm ${dot} ${status === "running" ? "animate-pulse" : ""}`} />
      <span className="capitalize">{status}</span>
      {detail && <span className="text-neutral-400">· {detail}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gradient Stat Card
   ═══════════════════════════════════════════════════════════════════════════ */
const GRADIENTS = {
  green:  "from-emerald-500/10 to-emerald-500/0 border-emerald-100",
  blue:   "from-blue-500/10    to-blue-500/0    border-blue-100",
  purple: "from-violet-500/10  to-violet-500/0  border-violet-100",
  amber:  "from-amber-500/10   to-amber-500/0   border-amber-100",
};

function StatCard({ icon: Icon, gradient, label, value, sub, sparkData, sparkColor, trend }) {
  const animValue = useAnimatedNumber(typeof value === "number" ? value : null);
  const showValue = typeof value === "number" ? animValue : value;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${GRADIENTS[gradient] || GRADIENTS.blue} bg-white p-6 transition-shadow hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-neutral-900 tabular-nums leading-none">{showValue}</p>
            {trend !== undefined && trend !== null && (
              <span className={`flex items-center text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Icon className="h-5 w-5 text-neutral-400" />
          {sparkData && <Sparkline data={sparkData} width={72} height={24} color={sparkColor || "#6366f1"} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Skeleton loader
   ═══════════════════════════════════════════════════════════════════════════ */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-100 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Bar Chart Component
   ═══════════════════════════════════════════════════════════════════════════ */
function BarChart({ data, valueKey, barColor, hoverColor, tooltipSuffix, fmtLabel }) {
  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: "11rem" }}>
      {data.map((item, idx) => {
        const val = item[valueKey] || 0;
        const pct = (val / maxVal) * 100;
        return (
          <div key={idx} className="flex flex-col items-center flex-1 h-full group">
            <div className="relative w-full flex-1 flex items-end">
              <div className="absolute inset-0 bg-neutral-50/60 rounded-t-lg" />
              <div
                className={`relative w-full ${barColor} rounded-t-lg transition-all duration-700 group-hover:${hoverColor}`}
                style={{ height: `${Math.max(pct, val > 0 ? 5 : 0)}%` }}
              />
              <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all bg-neutral-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg z-10">
                {val} {tooltipSuffix}
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 mt-2 font-medium">{fmtLabel(item)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Event Breakdown Mini Bars
   ═══════════════════════════════════════════════════════════════════════════ */
function EventBreakdown({ breakdown }) {
  if (!breakdown) return null;
  const items = [
    { label: "Created",   count: breakdown.created,   color: "bg-sky-400" },
    { label: "Updated",   count: breakdown.updated,   color: "bg-amber-400" },
    { label: "Completed", count: breakdown.completed, color: "bg-emerald-400" },
    { label: "Deleted",   count: breakdown.deleted,   color: "bg-red-400" },
  ];
  const total = items.reduce((s, i) => s + i.count, 0) || 1;

  return (
    <div className="space-y-3">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-3 text-sm">
          <span className="w-20 text-neutral-500 text-xs font-medium">{it.label}</span>
          <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${it.color} transition-all duration-1000`}
              style={{ width: `${(it.count / total) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs tabular-nums text-neutral-500 font-semibold">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Avatar Colors
   ═══════════════════════════════════════════════════════════════════════════ */
const AVATAR_BG = [
  "bg-indigo-500", "bg-violet-500", "bg-sky-500",
  "bg-emerald-500", "bg-rose-500", "bg-amber-500",
];

const MEDAL = ["🥇", "🥈", "🥉"];

/* ═══════════════════════════════════════════════════════════════════════════
   Main Dashboard Export
   ═══════════════════════════════════════════════════════════════════════════ */
export function AnalyticsDashboard({ currentWorkspace }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [days, setDays]         = useState(7); // 7 or 30

  const workspaceId = currentWorkspace?._id;

  const fetchAnalytics = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${workspaceId}/analytics?days=${days}`);
      if (res.data?.success) {
        setData(res.data.data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching analytics");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, days]);

  useEffect(() => {
    fetchAnalytics();
    const iv = setInterval(fetchAnalytics, 30_000);
    return () => clearInterval(iv);
  }, [fetchAnalytics]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading && !data) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400 text-sm">
        No analytics data yet — complete some tasks to generate insights.
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const dailyCounts  = data.dailyActivity?.map(d => d.count)   || [];
  const eventCounts  = data.activityTrend?.map(d => d.events)  || [];

  // Week-over-week trend (compare last 3 days vs prior 3 days)
  const recent = dailyCounts.slice(-3).reduce((s, v) => s + v, 0);
  const prior  = dailyCounts.slice(-6, -3).reduce((s, v) => s + v, 0);
  const trend  = prior > 0 ? Math.round(((recent - prior) / prior) * 100) : null;

  const fmtDay = (item) => {
    const d = new Date(item.date + "T00:00:00");
    return days <= 7
      ? d.toLocaleDateString(undefined, { weekday: "short" })
      : `${d.getMonth()+1}/${d.getDate()}`;
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-neutral-50/50">
      <div className="p-8 max-w-6xl mx-auto pb-24">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100">
                <BarChart2 className="h-6 w-6 text-indigo-600" />
              </div>
              Analytics
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5">
              Real-time metrics via Kafka → C++ Engine → Redis
            </p>
            <EngineStatus workspaceId={workspaceId} />
          </div>

          <div className="flex items-center gap-3">
            {/* Day range toggle */}
            <div className="flex text-xs font-medium bg-white border border-neutral-200 rounded-lg overflow-hidden">
              {[7, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 transition-colors ${days === d ? "bg-indigo-600 text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-white border border-neutral-200 hover:bg-indigo-50 disabled:opacity-40 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {lastRefresh ? lastRefresh.toLocaleTimeString() : "Refresh"}
            </button>
          </div>
        </div>

        {/* ── Stat Cards Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={CheckCircle} gradient="green"
            label="Completed" value={data.totalCompleted}
            sub={`of ${data.totalCreated || 0} total tasks`}
            sparkData={dailyCounts} sparkColor="#10b981"
            trend={trend}
          />
          <StatCard
            icon={Clock} gradient="blue"
            label="Avg. Time" value={data.totalCompleted > 0 ? `${data.avgCompletionTimeHours}h` : "—"}
            sub={data.totalCompleted > 0 ? "creation → completion" : "awaiting first completion"}
          />
          <StatCard
            icon={Target} gradient="amber"
            label="Completion Rate" value={data.completionRate > 0 ? `${data.completionRate}%` : "—"}
            sub="completed / created"
          />
          <StatCard
            icon={Users} gradient="purple"
            label="Contributors" value={data.tasksPerUser?.length ?? 0}
            sub="members with completions"
          />
        </div>

        {/* ── Productivity Gauge + Event Breakdown ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col items-center justify-center shadow-sm">
            <ProductivityGauge score={data.productivityScore || 0} />
            <p className="text-xs text-neutral-400 mt-3 text-center max-w-[10rem]">
              Based on completion rate, speed, and recent activity
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Event Pipeline Breakdown
            </h3>
            <EventBreakdown breakdown={data.eventBreakdown} />
          </div>
        </div>

        {/* ── Charts Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-700 mb-5 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Task Completions
              <span className="ml-auto text-xs text-neutral-400 font-normal">Last {days} days</span>
            </h3>
            <BarChart
              data={data.dailyActivity || []}
              valueKey="count"
              barColor="bg-emerald-400"
              hoverColor="bg-emerald-500"
              tooltipSuffix="completed"
              fmtLabel={fmtDay}
            />
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-700 mb-5 flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-500" />
              Total Activity
              <span className="ml-auto text-xs text-neutral-400 font-normal">Last {days} days</span>
            </h3>
            <BarChart
              data={data.activityTrend || []}
              valueKey="events"
              barColor="bg-violet-400"
              hoverColor="bg-violet-500"
              tooltipSuffix="events"
              fmtLabel={fmtDay}
            />
          </div>
        </div>

        {/* ── Top Contributors ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-700 mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Leaderboard
          </h3>

          {data.tasksPerUser?.length > 0 ? (
            <div className="space-y-3">
              {data.tasksPerUser.map((user, idx) => {
                const widthPct = (user.completed / (data.tasksPerUser[0]?.completed || 1)) * 100;
                const bg = AVATAR_BG[idx % AVATAR_BG.length];
                return (
                  <div key={user.userId?.toString() ?? idx} className="flex items-center gap-3 group">
                    <span className="w-6 text-center text-sm shrink-0">
                      {idx < 3 ? MEDAL[idx] : <span className="text-xs text-neutral-400 font-bold">#{idx+1}</span>}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${bg}`}>
                      {user.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-neutral-800 truncate">{user.name}</span>
                        <span className="text-neutral-400 tabular-nums text-xs font-semibold shrink-0 ml-2">{user.completed}</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${bg} transition-all duration-1000 opacity-70`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 italic py-4 text-center">
              No completions yet — assign tasks and mark them done to populate the leaderboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
