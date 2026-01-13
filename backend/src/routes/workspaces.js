const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Workspace = require('../models/workSpace');
const User = require('../models/User');
const { verifyAccessToken } = require('../middleware/auth');

// Create a new workspace

router.post('/workspaces',verifyAccessToken, async (req,res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, slug, description } = req.body;
        const ownerId = req.user.userId; // Extracted from JWT by auth middleware
        
        // 1.Check if slug already exists
        const existingworkspace = await Workspace.findOne({ slug }).session(session);
        if (existingworkspace) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'workspace slug already exists' });
        }

        // 2.Create new workspace
        const newworkspace = new Workspace({
            name,
            slug,
            owner: ownerId,
            description,
            members: [{ 
                user: ownerId,
                role: 'admin',
                status: 'Active'
            }]
        });

        await newworkspace.save({ session });
        // 3.Update the User document to include this workspace
        await User.findByIdAndUpdate(ownerId, 
            {
              $push: { 
                workspaces: {
                    workspaceId: newworkspace._id,
                    role: 'admin'
                }
              }
            },
            {session}
        );

        // 4.Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        res.status(201).json({ message: 'workspace created successfully', workspace: newworkspace });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all workspaces for the authenticated user
router.get('/workspaces', verifyAccessToken, async (req, res) => {
    try {
        // Because we denormalized usage in the User model, we technically 
        // don't even need to query the workspace collection for the list! [cite: 31]
        // But to get full details (like descriptions), we query based on the member index.
        const userId = req.user.userId;
        const workspaces = await Workspace.find({ 'members.user': userId, deletedAt: null });
        res.status(200).json({ workspaces });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Generate invite link for a workspace
router.post('/workspaces/:workspaceId/invite', verifyAccessToken, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.userId;
        const { expiryHours = 168 } = req.body; // Default 7 days (168 hours)
        console.log('Generating invite link for workspace:', req);
        // Find workspace and check if user is admin or owner
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Check if user is admin or owner
        const member = workspace.members.find(m => m.user.toString() === userId);
        if (!member || (member.role !== 'admin' && workspace.owner.toString() !== userId)) {
            return res.status(403).json({ message: 'Only admins can generate invite links' });
        }

        // Generate unique invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        // Update workspace with invite token
        workspace.inviteToken = inviteToken;
        workspace.inviteTokenExpiry = inviteTokenExpiry;
        await workspace.save();

        res.status(200).json({
            message: 'Invite link generated successfully',
            inviteToken,
            inviteLink: `${req.protocol}://${req.get('host')}/api/workspaces/join/${inviteToken}`,
            expiresAt: inviteTokenExpiry
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Join workspace via invite link
router.post('/workspaces/join/:inviteToken', verifyAccessToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { inviteToken } = req.params;
        const userId = req.user.userId;
        // Find workspace by invite token
        const workspace = await Workspace.findOne({ 
            inviteToken,
            deletedAt: null 
        }).session(session);

        if (!workspace) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Invalid invite link' });
        }

        // Check if invite token has expired
        if (workspace.inviteTokenExpiry && workspace.inviteTokenExpiry < new Date()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invite link has expired' });
        }

        // Check if user is already a member
        const existingMember = workspace.members.find(m => m.user.toString() === userId);
        if (existingMember) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'You are already a member of this workspace' });
        }

        // Add user to workspace members
        workspace.members.push({
            user: userId,
            role: 'member',
            status: 'Active'
        });
        await workspace.save({ session });

        // Update user's workspaces array
        await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    workspaces: {
                        workspaceId: workspace._id,
                        role: 'member'
                    }
                }
            },
            { session }
        );

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Successfully joined workspace',
            workspace: {
                _id: workspace._id,
                name: workspace.name,
                slug: workspace.slug,
                description: workspace.description
            }
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get invite link details (without authentication - for preview)
router.get('/workspaces/invite/:inviteToken', async (req, res) => {
    try {
        const { inviteToken } = req.params;

        const workspace = await Workspace.findOne({ 
            inviteToken,
            deletedAt: null 
        }).select('name description inviteTokenExpiry');

        if (!workspace) {
            return res.status(404).json({ message: 'Invalid invite link' });
        }

        // Check if invite token has expired
        if (workspace.inviteTokenExpiry && workspace.inviteTokenExpiry < new Date()) {
            return res.status(400).json({ message: 'Invite link has expired' });
        }

        res.status(200).json({
            workspace: {
                name: workspace.name,
                description: workspace.description
            },
            expiresAt: workspace.inviteTokenExpiry
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;