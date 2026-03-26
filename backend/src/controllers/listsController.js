const Board = require('../models/Board');

// Create a new list
const createList = async (req, res) => {
  try {
    const { boardId, workspaceId } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "List title is required" });
    }

    const board = await Board.findOne({ _id: boardId, workspace: workspaceId });
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Generate a simple rank by finding the highest current rank and adding 1000, 
    // or stringifying the length. For simplicity, we use stringified epoch for append.
    const rank = Date.now().toString();

    const newList = { title: title.trim(), rank };
    board.lists.push(newList);
    await board.save();

    res.status(201).json({ list: board.lists[board.lists.length - 1], message: "List created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update list title
const updateList = async (req, res) => {
  try {
    const { boardId, workspaceId, listId } = req.params;
    const { title } = req.body;

    const board = await Board.findOne({ _id: boardId, workspace: workspaceId });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const list = board.lists.id(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (title !== undefined) list.title = title.trim();
    
    await board.save();
    res.json({ list, message: "List updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete (archive) list
const deleteList = async (req, res) => {
  try {
    const { boardId, workspaceId, listId } = req.params;

    const board = await Board.findOne({ _id: boardId, workspace: workspaceId });
    if (!board) return res.status(404).json({ message: "Board not found" });

    const list = board.lists.id(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    // Actually remove it instead of archiving for simplicity of this demo,
    // or just mark isArchived based on schema
    list.isArchived = true;
    await board.save();

    res.json({ message: "List archived successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createList,
  updateList,
  deleteList
};
