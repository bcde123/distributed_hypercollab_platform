import React, { useEffect, useState } from "react"
import { useWs } from "@/context/WebSocketProvider"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ArrowLeft, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Settings, CheckSquare } from "lucide-react"
import { getFullBoard, createList, deleteList, createTask, updateTask, deleteTask, updateBoard, deleteBoard as deleteBoardAction } from "@/features/board/boardThunks"
import { getWorkspaceBySlug } from "@/features/workspace/workspaceThunks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Skeleton for loading state ────────────────────────────────────────────
function BoardSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-neutral-100">
      {/* Header skeleton */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 shadow-sm">
        <div className="skeleton h-8 w-8 rounded-md" />
        <div className="skeleton h-6 w-48 rounded" />
      </div>

      {/* Board canvas skeleton */}
      <div className="flex-1 p-6 flex items-start gap-6 overflow-x-auto">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex-shrink-0 w-80 bg-neutral-200/60 rounded-xl p-3 space-y-3">
            <div className="skeleton h-5 w-32 rounded" />
            {[1, 2, 3].map((card) => (
              <div key={card} className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                <div className={cn("skeleton h-4 rounded", card === 2 ? "w-3/4" : "w-full")} />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state for a list with no tasks ─────────────────────────────────
function EmptyTaskState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
      <CheckSquare className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-xs font-medium">No cards yet</p>
      <button
        onClick={onAdd}
        className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
      >
        + Add the first card
      </button>
    </div>
  )
}

export default function BoardPage() {
  const { slug, boardId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { fullBoard, loading } = useSelector((state) => state.board)

  // Subscribe to workspace room for live task updates
  const { joinWorkspace, leaveWorkspace } = useWs()

  const [newListTitle, setNewListTitle] = useState("")
  const [addingTaskToList, setAddingTaskToList] = useState(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const [isEditingBoard, setIsEditingBoard] = useState(false)
  const [editBoardTitle, setEditBoardTitle] = useState("")

  // Load Workspace if not loaded
  useEffect(() => {
    if (!currentWorkspace || currentWorkspace.slug !== slug) {
      dispatch(getWorkspaceBySlug(slug))
    }
  }, [slug, currentWorkspace, dispatch])

  // Load Board
  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(getFullBoard({ workspaceId: currentWorkspace._id, boardId }))
    }
  }, [currentWorkspace?._id, boardId, dispatch])

  // Join workspace WS room for live updates
  useEffect(() => {
    if (currentWorkspace?._id) {
      joinWorkspace(currentWorkspace._id)
      return () => leaveWorkspace(currentWorkspace._id)
    }
  }, [currentWorkspace?._id, joinWorkspace, leaveWorkspace])

  if (loading || !fullBoard) {
    return <BoardSkeleton />
  }

  const { board, tasksByList } = fullBoard
  const lists = board.lists || []

  // Handlers
  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListTitle.trim()) return
    try {
      await dispatch(createList({ workspaceId: currentWorkspace._id, boardId, title: newListTitle })).unwrap()
      setNewListTitle("")
      toast.success("List created")
    } catch (err) {
      toast.error("Failed to create list")
    }
  }

  const handleDeleteList = (listId, listTitle) => {
    toast.custom(
      (t) => (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xl p-4 w-80">
          <p className="text-sm font-semibold text-neutral-900 mb-1">Delete "{listTitle}"?</p>
          <p className="text-xs text-neutral-500 mb-4">All cards in this list will be permanently removed.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t)} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
            <button
              onClick={async () => {
                toast.dismiss(t)
                try {
                  await dispatch(deleteList({ workspaceId: currentWorkspace._id, boardId, listId })).unwrap()
                  toast.success("List deleted")
                } catch { toast.error("Failed to delete list") }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >Delete</button>
          </div>
        </div>
      ),
      { duration: Infinity }
    )
  }

  const handleCreateTask = async (e, listId) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      await dispatch(createTask({ workspaceId: currentWorkspace._id, boardId, listId, title: newTaskTitle })).unwrap()
      setNewTaskTitle("")
      setAddingTaskToList(null)
      toast.success("Task added")
    } catch (err) {
      toast.error("Failed to add task")
    }
  }

  const handleDeleteTask = async (listId, taskId) => {
    try {
      await dispatch(deleteTask({ workspaceId: currentWorkspace._id, boardId, listId, taskId })).unwrap()
    } catch (err) {
      toast.error("Failed to delete task")
    }
  }

  const handleMoveTask = async (task, currentListIndex, direction) => {
    const targetListIndex = currentListIndex + direction
    if (targetListIndex < 0 || targetListIndex >= lists.length) return

    const targetListId = lists[targetListIndex]._id
    try {
      await dispatch(updateTask({ 
        workspaceId: currentWorkspace._id, 
        boardId, 
        taskId: task._id, 
        title: task.title,
        listId: targetListId, 
        rank: task.rank, 
        status: task.status 
      })).unwrap()
    } catch (err) {
      toast.error("Failed to move task")
    }
  }

  const handleUpdateBoard = async () => {
    if (!editBoardTitle.trim() || editBoardTitle === board.title) {
      setIsEditingBoard(false)
      return
    }
    try {
      await dispatch(updateBoard({ workspaceId: currentWorkspace._id, boardId, title: editBoardTitle })).unwrap()
      setIsEditingBoard(false)
      toast.success("Board renamed")
    } catch (err) {
      toast.error("Failed to rename board")
    }
  }

  const handleDeleteBoard = () => {
    toast.custom(
      (t) => (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xl p-4 w-80">
          <p className="text-sm font-semibold text-neutral-900 mb-1">Delete "{board.title}"?</p>
          <p className="text-xs text-neutral-500 mb-4">This board and all its lists and cards will be permanently deleted. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t)} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
            <button
              onClick={async () => {
                toast.dismiss(t)
                try {
                  await dispatch(deleteBoardAction({ workspaceId: currentWorkspace._id, boardId })).unwrap()
                  toast.success("Board deleted")
                  navigate(`/workspaces/${slug}`)
                } catch { toast.error("Failed to delete board") }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >Delete Board</button>
          </div>
        </div>
      ),
      { duration: Infinity }
    )
  }

  const openBoardEditor = () => {
    setEditBoardTitle(board.title)
    setIsEditingBoard(true)
  }

  // Total task count across all lists
  const totalTasks = lists.reduce((acc, list) => acc + (tasksByList[list._id]?.length || 0), 0)

  return (
    <div className="flex h-screen flex-col bg-neutral-100 text-neutral-900 overflow-hidden page-enter">
      {/* HEADER */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm z-10 w-full relative">
        <div className="flex items-center gap-4">
          <Link 
            to={`/workspaces/${slug}`} 
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
            title="Back to workspace"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          {isEditingBoard ? (
            <Input 
              value={editBoardTitle} 
              onChange={(e) => setEditBoardTitle(e.target.value)} 
              className="h-8 w-64 text-lg font-semibold"
              autoFocus
              onBlur={handleUpdateBoard}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateBoard()
                if (e.key === "Escape") setIsEditingBoard(false)
              }}
            />
          ) : (
            <div className="flex items-center gap-3">
              <h1 
                className="text-lg font-bold cursor-pointer hover:bg-neutral-100 px-2 py-1 rounded transition-colors"
                onClick={openBoardEditor}
                title="Click to rename"
              >
                {board.title}
              </h1>
              {/* Task count pill */}
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-0.5 font-medium">
                <CheckSquare className="h-3 w-3" />
                {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Board Settings Menu */}
          <div className="group relative">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-600" title="Board settings">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="absolute right-0 top-10 hidden group-hover:block w-48 rounded-lg bg-white shadow-lg ring-1 ring-black/5 py-1 z-20">
              <button 
                className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                onClick={openBoardEditor}
              >
                <Edit2 className="mr-2 h-4 w-4 text-neutral-400" /> Rename Board
              </button>
              <button 
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={handleDeleteBoard}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Board
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* BOARD CANVAS (Kanban) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 w-full flex items-start gap-5">
        
        {/* LISTS */}
        {lists.map((list, listIndex) => {
          const tasks = tasksByList[list._id] || []
          
          return (
            <div key={list._id} className="flex-shrink-0 w-72 max-h-full flex flex-col bg-neutral-200/60 rounded-xl overflow-hidden shadow-sm">
              {/* List Header */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-200/80">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-neutral-800">{list.title}</h3>
                  {tasks.length > 0 && (
                    <span className="text-[10px] bg-neutral-300/80 text-neutral-600 font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {tasks.length}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-neutral-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleDeleteList(list._id, list.title)}
                  title="Delete list"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {tasks.length === 0 && addingTaskToList !== list._id && (
                  <EmptyTaskState onAdd={() => { setAddingTaskToList(list._id); setNewTaskTitle("") }} />
                )}

                {tasks.map(task => (
                  <div
                    key={task._id}
                    className="group bg-white p-3 rounded-lg shadow-sm border border-neutral-200/80 hover:border-indigo-300 hover:shadow-md hover:ring-1 hover:ring-indigo-100 transition-all duration-150 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm text-neutral-800 break-words leading-snug pr-1">{task.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0 -mt-0.5 -mr-1 transition-all"
                        onClick={() => handleDeleteTask(list._id, task._id)}
                        title="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Quick Move Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2.5 pt-2 border-t border-neutral-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30"
                        disabled={listIndex === 0}
                        onClick={() => handleMoveTask(task, listIndex, -1)}
                        title="Move left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-[10px] text-neutral-400 font-medium px-1 flex-1 text-center">Move</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30"
                        disabled={listIndex === lists.length - 1}
                        onClick={() => handleMoveTask(task, listIndex, 1)}
                        title="Move right"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Adding Task Form */}
                {addingTaskToList === list._id ? (
                  <form onSubmit={(e) => handleCreateTask(e, list._id)} className="bg-white p-2 rounded-lg shadow-sm border border-indigo-300">
                    <Input 
                      placeholder="What needs to be done?" 
                      value={newTaskTitle} 
                      onChange={e => setNewTaskTitle(e.target.value)}
                      className="h-8 text-sm mb-2 border-none shadow-none focus-visible:ring-0 px-1"
                      autoFocus
                      onKeyDown={(e) => e.key === "Escape" && (setAddingTaskToList(null), setNewTaskTitle(""))}
                    />
                    <div className="flex items-center gap-1.5">
                      <Button type="submit" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 px-3">Add</Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-neutral-500"
                        onClick={() => { setAddingTaskToList(null); setNewTaskTitle("") }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : tasks.length > 0 && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-300/40 h-8"
                    onClick={() => { setAddingTaskToList(list._id); setNewTaskTitle("") }}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add a card
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {/* Add List Form */}
        <div className="flex-shrink-0 w-64">
          <form
            onSubmit={handleCreateList}
            className="bg-white/60 backdrop-blur-sm border border-neutral-300/60 border-dashed rounded-xl p-3 flex items-center gap-2 transition-all hover:bg-white/90 hover:border-indigo-300 hover:shadow-sm group"
          >
            <Plus className="h-4 w-4 text-indigo-400 flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Add another list…" 
              value={newListTitle} 
              onChange={e => setNewListTitle(e.target.value)}
              className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-neutral-400 font-medium p-0 text-sm"
              onKeyDown={(e) => e.key === "Escape" && setNewListTitle("")}
            />
            {newListTitle && (
              <Button type="submit" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 ml-auto flex-shrink-0 px-2.5">Add</Button>
            )}
          </form>
        </div>

      </main>
    </div>
  )
}
