const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WorkSpace = require('../models/workSpace');
const { verifyAccessToken } = require('../middleware/auth');

// Create a new WorkSpace

router.post('/workspaces',verifyAccessToken, async (req,res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, slug, description } = req.body;
        const ownerId = req.user.id; // Extracted from JWT by auth middleware
        
        // 1.Check if slug already exists
        const existingWorkSpace = await WorkSpace.findOne({ slug }).session(session);
        if (existingWorkSpace) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'WorkSpace slug already exists' });
        }

        // 2.Create new WorkSpace
        const newWorkSpace = new WorkSpace({
            name,
            slug,
            owner: ownerId,
            description,
            members: [{ 
                user: ownerId,
                role: 'Admin',
                status: 'Active'
            }]
        });

        await newWorkSpace.save({ session });
        // 3.Update the User document to include this WorkSpace
        await User.findByIdAndUpdate(ownerId, 
            {
              $push: { 
                workspaces: {
                    workSpace: newWorkSpace._id,
                    role: 'Admin'
                }
              }
            },
            {session}
        );

        // 4.Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        res.status(201).json({ message: 'WorkSpace created successfully', workSpace: newWorkSpace });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all WorkSpaces for the authenticated user
router.get('/', verifyAccessToken, async (req, res) => {
    try {
        // Because we denormalized usage in the User model, we technically 
        // don't even need to query the Workspace collection for the list! [cite: 31]
        // But to get full details (like descriptions), we query based on the member index.
        const userId = req.user.id;
        const workSpaces = await WorkSpace.find({ 'members.user': userId, deletedAt: null });
        res.status(200).json({ workSpaces });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;