const Board = require('../models/Board');

// Delete board controller
const deleteBoard = async (req, res) => {
    try {
        const { boardId, workspaceId } = req.params;

        // Delete the board ensuring it belongs to the workspace context
        const result = await Board.findOneAndDelete({ 
            _id: boardId, 
            workspace: workspaceId 
        });

        if (!result) {
            return res.status(404).json({ message: "Board not found" });
        }

        res.json({ message: "Board deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error during deletion" });
    }
};

module.exports = {
    deleteBoard
};
