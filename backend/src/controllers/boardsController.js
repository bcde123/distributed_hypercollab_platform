const Board = require('../models/Board');
const Task = require('../models/Tasks');

// Create a new board
const createBoard = async (req, res) => {
  try {
    const { title, background } = req.body;
    const { workspaceId } = req.params;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Board title is required" });
    }

    const board = await Board.create({
      workspace: workspaceId,
      title: title.trim(),
      background: background || "default-blue",
      createdBy: req.user.id,
      lists: []
    });

    res.status(201).json(board);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Get all boards in a workspace
const getBoardsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const boards = await Board.find({
      workspace: workspaceId,
      isClosed: false
    }).select("title background updatedAt");

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




// Get a single board (lists included)
const getBoardById = async (req, res) => {
  try {
    const { boardId, workspaceId } = req.params;

    const board = await Board.findOne({
      _id: boardId,
      workspace: workspaceId
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




// Get FULL board (board + lists + tasks)
const getFullBoard = async (req, res) => {
  try {
    const { boardId, workspaceId } = req.params;

    const board = await Board.findOne({
      _id: boardId,
      workspace: workspaceId,
      isClosed: false
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const tasks = await Task.find({
      board: boardId,
      isArchived: false
    }).populate("assignees", "name email");

    // Group tasks by listId
    const tasksByList = {};
    tasks.forEach(task => {
      const listId = task.listId.toString();
      if (!tasksByList[listId]) {
        tasksByList[listId] = [];
      }
      tasksByList[listId].push(task);
    });

    res.json({
      board,
      tasksByList
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Delete board controller
const deleteBoard = async (req, res) => {
  try {
    const { boardId, workspaceId } = req.params;

    const board = await Board.findOneAndUpdate(
      { _id: boardId, workspace: workspaceId },
      { isClosed: true },
      { new: true }
    );

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json({ message: "Board closed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error during deletion" });
  }
};


module.exports = {
    createBoard,
    getBoardsByWorkspace,
    getBoardById,
    getFullBoard,
    deleteBoard
};
