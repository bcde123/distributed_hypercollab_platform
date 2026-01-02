const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workspaceSchema = new Schema({
    name: {
        type: String,
        required: [true, 'workspace name is required'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'workspace slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'workspace owner is required']
    },
    members: [{
        user : {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member', 'viewer'],
            default: 'viewer'
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
            enum: ['Private', 'workspace', 'Public'],
            default: 'workspace'
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
workspaceSchema.index({ 'members.user': 1 });

const workspace = mongoose.model('workspace', workspaceSchema);
module.exports = workspace;