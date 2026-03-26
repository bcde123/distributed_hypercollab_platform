import React, { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Edit2, ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { getFullBoard, createList, deleteList, createTask, updateTask, deleteTask, updateBoard, deleteBoard as deleteBoardAction } from "@/features/board/boardThunks"
import { getWorkspaceBySlug } from "@/features/workspace/workspaceThunks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function BoardPage() {
  const { slug, boardId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { fullBoard, loading } = useSelector((state) => state.board)

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

  if (loading || !fullBoard) {
    return <div className="flex h-screen items-center justify-center bg-neutral-50">Loading board...</div>
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

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this list?")) return
    try {
      await dispatch(deleteList({ workspaceId: currentWorkspace._id, boardId, listId })).unwrap()
      toast.success("List deleted")
    } catch (err) {
      toast.error("Failed to delete list")
    }
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
        title: task.title, // Include required fields
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

  const handleDeleteBoard = async () => {
    if (!window.confirm(`Are you sure you want to delete the board "${board.title}"? This cannot be undone.`)) return
    try {
      await dispatch(deleteBoardAction({ workspaceId: currentWorkspace._id, boardId })).unwrap()
      toast.success("Board deleted")
      navigate(`/workspaces/${slug}`)
    } catch (err) {
      toast.error("Failed to delete board")
    }
  }

  const openBoardEditor = () => {
    setEditBoardTitle(board.title)
    setIsEditingBoard(true)
  }

  return (
    <div className={`flex h-screen flex-col bg-neutral-100 text-neutral-900 overflow-hidden`}>
      {/* HEADER */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm z-10 w-full relative">
        <div className="flex items-center gap-4">
          <Link 
            to={`/workspaces/${slug}`} 
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          {isEditingBoard ? (
            <div className="flex items-center gap-2">
              <Input 
                value={editBoardTitle} 
                onChange={(e) => setEditBoardTitle(e.target.value)} 
                className="h-8 w-64 text-lg font-semibold"
                autoFocus
                onBlur={handleUpdateBoard}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateBoard()}
              />
            </div>
          ) : (
            <h1 
              className="text-xl font-bold cursor-pointer hover:bg-neutral-100 px-2 py-1 rounded"
              onClick={openBoardEditor}
            >
              {board.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Board Settings Menu */}
          <div className="group relative">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-600">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="absolute right-0 top-10 hidden group-hover:block w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1">
              <button 
                className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                onClick={openBoardEditor}
              >
                <Edit2 className="mr-2 h-4 w-4" /> Rename Board
              </button>
              <button 
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleDeleteBoard}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Board
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* BOARD CANVAS (Kanban) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 w-full flex items-start gap-6">
        
        {/* LISTS */}
        {lists.map((list, listIndex) => {
          const tasks = tasksByList[list._id] || []
          
          return (
            <div key={list._id} className="flex-shrink-0 w-80 max-h-full flex flex-col bg-neutral-200/50 rounded-xl p-3">
              {/* List Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-neutral-700">{list.title}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteList(list._id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {tasks.map(task => (
                  <div key={task._id} className="group bg-white p-3 rounded-lg shadow-sm border border-neutral-200 hover:border-indigo-300 hover:ring-1 hover:ring-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm text-neutral-800 break-words">{task.title}</p>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 -mt-1 -mr-1" onClick={() => handleDeleteTask(list._id, task._id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Quick Move Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-3 border-t border-neutral-100 pt-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={listIndex === 0} onClick={() => handleMoveTask(task, listIndex, -1)}>
                        <ChevronLeft className="h-4 w-4 text-neutral-500" />
                      </Button>
                      <span className="text-xs text-neutral-400 font-medium px-1 flex-1 text-center">Move</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={listIndex === lists.length - 1} onClick={() => handleMoveTask(task, listIndex, 1)}>
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Adding Task Form */}
                {addingTaskToList === list._id ? (
                  <form onSubmit={(e) => handleCreateTask(e, list._id)} className="bg-white p-2 rounded-lg shadow-sm border border-indigo-200 mt-2">
                    <Input 
                      placeholder="What needs to be done?" 
                      value={newTaskTitle} 
                      onChange={e => setNewTaskTitle(e.target.value)}
                      className="h-8 text-sm mb-2 border-none shadow-none focus-visible:ring-0 px-1"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">Add</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAddingTaskToList(null); setNewTaskTitle(""); }}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-neutral-500 hover:text-neutral-700 hover:bg-neutral-300/50 mt-2"
                    onClick={() => { setAddingTaskToList(list._id); setNewTaskTitle(""); }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add a card
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {/* Add List Button */}
        <div className="flex-shrink-0 w-72">
          <form onSubmit={handleCreateList} className="bg-white/50 backdrop-blur-sm border border-neutral-300 border-dashed rounded-xl p-4 flex items-center gap-2 transition-colors hover:bg-white/80 hover:border-indigo-300">
             <Plus className="h-5 w-5 text-indigo-500" />
             <Input 
               placeholder="Add another list" 
               value={newListTitle} 
               onChange={e => setNewListTitle(e.target.value)}
               className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-neutral-500 font-medium p-0"
             />
             {newListTitle && (
               <Button type="submit" size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 ml-auto">Add</Button>
             )}
          </form>
        </div>

      </main>
    </div>
  )
}
