const mongoose = require('mongoose');
const crypto = require('crypto');
const Workspace = require('../models/workSpace');
const User = require('../models/User');
const sendEmail = require("../utils/sendEmail");

// Create workspace controller
const createWorkspace = async (req, res) => {
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
            { session }
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
};




// Get all workspaces controller
const getAllWorkspaces = async (req, res) => {
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
};






const getWorkspaceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const workspace = await Workspace.findOne({ slug })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Generate invite link controller
const generateInviteLink = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.userId;
        const { expiryHours = 168, email } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const member = workspace.members.find(m => m.user.toString() === userId);
        if (!member || (member.role !== 'admin' && workspace.owner.toString() !== userId)) {
            return res.status(403).json({ message: 'Only admins can generate invite links' });
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        workspace.inviteToken = inviteToken;
        workspace.inviteTokenExpiry = inviteTokenExpiry;
        await workspace.save();

        const inviteLink = `${req.protocol}://${req.get('host')}/api/workspaces/join/${inviteToken}`;

        // ✅ Optional email sending
        if (email) {
            await sendEmail({
                to: email,
                subject: "You're invited to join a workspace",
                html: `
                  <p>You’ve been invited to join a workspace.</p>
                  <p><a href="${inviteLink}">Accept Invite</a></p>
                  <p>This link expires on ${inviteTokenExpiry.toLocaleString()}.</p>
                `
            });
        }

        res.status(200).json({
            message: 'Invite link generated successfully',
            inviteToken,
            inviteLink,
            expiresAt: inviteTokenExpiry,
            emailSent: !!email
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};








// Join workspace via invite link controller
const joinWorkspace = async (req, res) => {
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
};

// Get invite link details controller (without authentication - for preview)
const getInviteLinkDetails = async (req, res) => {
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
};

// Update member role
const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const { role } = req.body;
        const requesterId = req.user.userId;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        // Check permissions: only admin or owner can change roles
        const requesterMember = workspace.members.find(m => m.user.toString() === requesterId);
        if (!requesterMember || (requesterMember.role !== 'admin' && workspace.owner.toString() !== requesterId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Prevent changing owner's role
        if (workspace.owner.toString() === userId) {
            return res.status(400).json({ message: 'Cannot change owner role' });
        }

        const targetMember = workspace.members.find(m => m.user.toString() === userId);
        if (!targetMember) return res.status(404).json({ message: 'User not in workspace' });

        if (!['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        targetMember.role = role;
        await workspace.save();

        // Also update the nested role in the User document
        await User.updateOne(
            { _id: userId, 'workspaces.workspaceId': workspaceId },
            { $set: { 'workspaces.$.role': role } }
        );

        res.status(200).json({ message: 'Role updated successfully', workspace });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Remove member
const removeMember = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { workspaceId, userId } = req.params;
        const requesterId = req.user.userId;

        const workspace = await Workspace.findById(workspaceId).session(session);
        if (!workspace) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Check permissions: admin/owner can remove others. Users can remove themselves.
        const requesterMember = workspace.members.find(m => m.user.toString() === requesterId);
        const isAdmin = requesterMember && (requesterMember.role === 'admin' || workspace.owner.toString() === requesterId);
        
        if (requesterId !== userId && !isAdmin) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Prevent removing the owner
        if (workspace.owner.toString() === userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Cannot remove the workspace owner' });
        }

        // Remove from workspace
        workspace.members = workspace.members.filter(m => m.user.toString() !== userId);
        await workspace.save({ session });

        // Remove workspace from user's workspaces array
        await User.findByIdAndUpdate(userId, {
            $pull: { workspaces: { workspaceId } }
        }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    createWorkspace,
    getAllWorkspaces,
    generateInviteLink,
    getWorkspaceBySlug,
    joinWorkspace,
    getInviteLinkDetails,
    updateMemberRole,
    removeMember
};
