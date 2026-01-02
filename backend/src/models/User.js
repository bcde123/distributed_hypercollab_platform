const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {Schema, model} = mongoose;

const userSchema = new Schema({
    username:{
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        index: true // if you want to index usernames for faster search
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        index: true // if you want to index email for faster search
    },
    password:{
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    // denormalized field for quick access to user workspaces
    workspaces: [{
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'workspace',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member', 'viewer'],
            default: 'viewer'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    profile: {
        avatarUrl: {
            type: String,
            trim: true
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        themePreferences: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
 });

//  pre-save hook to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// indexes for faster search on username and email
userSchema.index({username: 1,isActive: 1});

const User = model('User', userSchema);

module.exports = User;