const Task = require('../models/Tasks');
const Board = require('../models/Board');
const { broadcastToRoom } = require('../utils/wsBroadcast');
const { emitTaskEvent } = require('../utils/eventEmitter');

// Create a new task
const createTask = async (req, res) => {
  try {
    const { boardId, workspaceId, listId } = req.params;
    const { title, description } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    // Verify board and list exist
    const board = await Board.findOne({ _id: boardId, workspace: workspaceId });
    if (!board) return res.status(404).json({ message: "Board not found" });
    
    const list = board.lists.id(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    // Generate simple rank (timestamp-based for appending)
    const rank = Date.now().toString();

    const task = await Task.create({
      workspace: workspaceId,
      board: boardId,
      listId: listId,
      title: title.trim(),
      description: description || '',
      rank,
      reporter: req.user.userId,
    });

    res.status(201).json({ task, message: "Task created successfully" });

    // Broadcast to all workspace clients in real-time
    broadcastToRoom(workspaceId, {
      type: 'TASK_CREATED',
      payload: { task, boardId, listId },
    });

    // Fire-and-forget Kafka event (never await after res is sent)
    emitTaskEvent('task_created', {
      taskId: task._id,
      workspaceId,
      boardId,
      listId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task (title, description, or moving between lists)
const updateTask = async (req, res) => {
  try {
    const { boardId, workspaceId, taskId } = req.params;
    const { title, description, listId, rank, status } = req.body;

    // Capture old task state before update (needed for list-move detection on client)
    const oldTask = await Task.findOne({ _id: taskId, board: boardId, workspace: workspaceId }).lean();

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (listId !== undefined) updateData.listId = listId;
    if (rank !== undefined) updateData.rank = rank;
    if (status !== undefined) updateData.status = status;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, board: boardId, workspace: workspaceId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task, message: "Task updated successfully" });

    // Broadcast to all workspace clients in real-time
    broadcastToRoom(workspaceId, {
      type: 'TASK_UPDATED',
      payload: {
        task,
        boardId,
        listId: task.listId,
        oldListId: oldTask?.listId || null,
      },
    });

    // Fire-and-forget Kafka events (never await after res is sent)
    emitTaskEvent('task_updated', {
      taskId: task._id,
      workspaceId,
      boardId,
      listId: task.listId,
    });

    // Dedicated completion event for analytics (status transition → Completed)
    if (task.status === 'Completed' && oldTask?.status !== 'Completed') {
      emitTaskEvent('task_completed', {
        taskId: task._id,
        workspaceId,
        boardId,
        assignees: task.assignees,
        createdAt: new Date(task.createdAt || oldTask?.createdAt || Date.now()).getTime(),
        completedAt: Date.now(),
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete (archive) task
const deleteTask = async (req, res) => {
  try {
    const { boardId, workspaceId, taskId } = req.params;

    // We can either hard delete or soft delete. Let's hard delete for simplicity.
    const task = await Task.findOneAndDelete({ _id: taskId, board: boardId, workspace: workspaceId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });

    // Broadcast to all workspace clients in real-time
    broadcastToRoom(workspaceId, {
      type: 'TASK_DELETED',
      payload: {
        taskId,
        boardId,
        listId: task.listId,
      },
    });

    // Fire-and-forget Kafka event (never await after res is sent)
    emitTaskEvent('task_deleted', {
      taskId,
      workspaceId,
      boardId,
      listId: task.listId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask
};
