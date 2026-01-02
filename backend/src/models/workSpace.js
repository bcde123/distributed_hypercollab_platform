const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workSpaceSchema = new Schema({
    name: {
        type: String,
        required: [true, 'WorkSpace name is required'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'WorkSpace slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'WorkSpace owner is required']
    },
    members: [{
        user : {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['Admin', 'Member', 'Viewer'],
            default: 'Viewer'
        },
        AddedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['Active','Inactive'],
            default: 'Active'
        }
    }],
    description: {
        type: String,
        trim: true,
        default: ''
    },
    settings: {
        allowPublicAccess: {
            type: Boolean,
            default: false
        },
        defaultBoardVisibility: {
            type: String,
            enum: ['Private', 'Workspace', 'Public'],
            default: 'Workspace'
        }
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true
});

// Optimizing queries for members
// help in member lookups within workspaces
workSpaceSchema.index({ 'members.user': 1 });

const WorkSpace = mongoose.model('WorkSpace', workSpaceSchema);
module.exports = WorkSpace;