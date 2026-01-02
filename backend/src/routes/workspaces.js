const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Workspace = require('../models/workSpace');
const User = require('../models/User');
const { verifyAccessToken } = require('../middleware/auth');

// Create a new workspace

router.post('/workspaces',verifyAccessToken, async (req,res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, slug, description } = req.body;
        const ownerId = req.user.id; // Extracted from JWT by auth middleware
        
        // 1.Check if slug already exists
        const existingworkspace = await workspace.findOne({ slug }).session(session);
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
        const userId = req.user.id;
        const workspaces = await workspace.find({ 'members.user': userId, deletedAt: null });
        res.status(200).json({ workspaces });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;