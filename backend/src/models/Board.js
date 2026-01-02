const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListSchema = new Schema({
    title: {
        type: String,
        required: [true, 'List title is required'],
        trim: true
    },
    // we will add the Lexo rank field later for ordering
    rank: {
        type: String,
        required: true,
    },
    isArchived: {
        type: Boolean,
        default: false
    },
  }, {
    timestamps: true
});

const BoardSchema = new Schema({
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'workspace',
        required: [true, 'Associated workspace is required'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Board title is required'],
        trim: true
    },
    // Embedding lists reduce the number of quesries needed to fetch a board with its lists
    lists: [ListSchema],
    background: {
        type: String,
        default: 'default-blue'
    },
    isClosed: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

// Ensure compound index for workspace and title to be unique
BoardSchema.index({ workspace: 1, updatedAt: -1 });
module.exports = mongoose.model('Board', BoardSchema);