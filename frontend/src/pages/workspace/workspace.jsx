import { Plus, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BoardCard } from "@/components/workspace/board-card"
import { Sidebar } from "@/components/workspace/sidebar"
import { ChatPanel } from "@/components/workspace/chat-panel"
import { MembersList } from "@/components/workspace/members-list"
import { CreateBoardModal } from "@/components/workspace/create-board-modal"
import { AnalyticsDashboard } from "@/components/workspace/AnalyticsDashboard"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "react-router-dom"
import { useWs } from "@/context/WebSocketProvider"

import { getBoardsByWorkspace, createBoard } from "@/features/board/boardThunks"
import { getWorkspaceBySlug } from "@/features/workspace/workspaceThunks"

// ── Skeleton loader for board cards ──────────────────────────────────────
function BoardCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3 shadow-sm">
      <div className="skeleton h-5 w-3/5 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-4/5 rounded" />
      <div className="flex justify-between mt-4">
        <div className="skeleton h-3.5 w-16 rounded" />
        <div className="skeleton h-3.5 w-20 rounded" />
      </div>
    </div>
  )
}

// ── Empty state when no boards exist ─────────────────────────────────────
function EmptyBoardsState({ onCreateBoard }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 shadow-sm">
        <LayoutGrid className="h-10 w-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-800 mb-2">No boards yet</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">
        Boards help you organise tasks and track progress across your team. Create your first one to get started.
      </p>
      <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={onCreateBoard}>
        <Plus className="mr-2 h-4 w-4" /> Create your first board
      </Button>
    </div>
  )
}

export default function WorkspacePage() {
  const dispatch = useDispatch()
  const { slug } = useParams()

  const boards = useSelector((state) => state.board.boards)
  const loading = useSelector((state) => state.board.loading)
  const error = useSelector((state) => state.board.error)

  const currentWorkspace = useSelector(
    (state) => state.workspace.currentWorkspace
  )

  const userRole = "member" // later from backend
  const canCreateBoard = userRole !== "viewer"
  const [activeTab, setActiveTab] = useState("boards")
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)

  /* ================= FETCH WORKSPACE BY SLUG ================= */
  useEffect(() => {
    if (slug) {
      dispatch(getWorkspaceBySlug(slug))
    }
  }, [dispatch, slug])

  /* ================= FETCH BOARDS USING WORKSPACE _id ================= */
  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(getBoardsByWorkspace(currentWorkspace._id))
    }
  }, [dispatch, currentWorkspace])

  /* ================= JOIN WORKSPACE WS ROOM (live updates) ================= */
  const { joinWorkspace, leaveWorkspace } = useWs()
  useEffect(() => {
    if (currentWorkspace?._id) {
      joinWorkspace(currentWorkspace._id)
      return () => leaveWorkspace(currentWorkspace._id)
    }
  }, [currentWorkspace?._id, joinWorkspace, leaveWorkspace])

  /* ================= CREATE BOARD ================= */
  const handleCreateBoard = async ({ title }) => {
    if (!currentWorkspace?._id) return

    await dispatch(
      createBoard({
        workspaceId: currentWorkspace._id,
        title: title || "New Board",
        background: "default-blue",
      })
    )

    dispatch(getBoardsByWorkspace(currentWorkspace._id))
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 overflow-auto">
        {activeTab === "boards" && (
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-neutral-900">
                  {currentWorkspace?.name || "Workspace"}
                </h1>
                <p className="text-sm text-neutral-600">
                  Manage workspace boards
                </p>
              </div>

              {canCreateBoard && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setIsBoardModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Board
                </Button>
              )}
            </div>

            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1,2,3,4,5,6].map((i) => <BoardCardSkeleton key={i} />)}
              </div>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {!loading && boards.length === 0 && (
              <EmptyBoardsState onCreateBoard={() => setIsBoardModalOpen(true)} />
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
                <BoardCard
                  key={board._id}
                  {...board}
                  workspaceSlug={currentWorkspace?.slug}
                  isReadOnly={userRole === "viewer"}
                />
              ))}
            </div>

            <CreateBoardModal 
              isOpen={isBoardModalOpen} 
              onClose={() => setIsBoardModalOpen(false)} 
              onSubmit={handleCreateBoard} 
            />
          </div>
        )}

        {activeTab === "members" && (
          <div className="p-8">
            <MembersList />
          </div>
        )}

        {activeTab === "chat" && (
          <ChatPanel />
        )}
        
        {activeTab === "analytics" && (
          <AnalyticsDashboard currentWorkspace={currentWorkspace} />
        )}
      </main>
    </div>
  )
}
