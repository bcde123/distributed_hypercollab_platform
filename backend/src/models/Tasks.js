const mongoose = require('mongoose');
const workspace = require('./workSpace');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: [true, 'Associated workspace is required'],
        index: true
    },
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        required: [true, 'Associated board is required'],
        index: true
    },
    listId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Associated list is required'],
    },
    // Ordering rank within the list
    rank: {
        type: String,
        required: true,
    },
    // Assignment
    assignees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    // For Filtering and organization
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Active','Completed','Archived'],
        default: 'Active'
    },
    dueDate: {
        type: Date,
        index: true
    },
    completedAt: {
        type: Date
    },

    attachments: [{
        filename: {
            type: String,
            required: true
        },
        url: {
            type: String
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Real-time collaboration locks
    lockedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lockExpiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index to ensure unique rank within a list
// 1. Kanban-Board view
TaskSchema.index({ board: 1,listId: 1, rank: 1 });

// 2. User dashboard view - quickly find tasks by user and status
TaskSchema.index({ assignees: 1, workspace: 1, status: 1 });

// 3. Analytics Engine Polling:
// Allows the C++ service to find tasks modified in the last X minutes.
TaskSchema.index({ workspace: 1, updatedAt: -1 });

module.exports = mongoose.model('Task', TaskSchema);

