import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BoardCard } from "@/components/workspace/board-card"
import { Sidebar } from "@/components/workspace/sidebar"
import { ChatPanel } from "@/components/workspace/chat-panel"
import { MembersList } from "@/components/workspace/members-list"
import { CreateBoardModal } from "@/components/workspace/create-board-modal"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "react-router-dom"

import { getBoardsByWorkspace, createBoard } from "@/features/board/boardThunks"
import { getWorkspaceBySlug } from "@/features/workspace/workspaceThunks"

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
  const [isChatOpen, setIsChatOpen] = useState(true)
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
        onChatToggle={() => setIsChatOpen(!isChatOpen)} 
      />

      <main className="flex-1 overflow-auto p-8">
        {activeTab === "boards" && (
          <>
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

            {loading && <div>Loading boards...</div>}
            {error && <div className="text-red-500">{error}</div>}

            {!loading && boards.length === 0 && (
              <div className="text-neutral-500">
                No boards yet. Create your first board.
              </div>
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
          </>
        )}

        {activeTab === "members" && (
          <MembersList />
        )}
        
        {activeTab === "analytics" && (
          <div className="text-neutral-500 flex h-full items-center justify-center">
            Analytics coming soon...
          </div>
        )}
      </main>

      {isChatOpen && (
        <aside className="w-80 border-l border-neutral-200 bg-white">
          <ChatPanel />
        </aside>
      )}
    </div>
  )
}
