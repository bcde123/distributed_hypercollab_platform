import { LayoutGrid, MessageSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BoardCard } from "@/components/workspace/board-card"
import { Sidebar } from "@/components/workspace/sidebar"
import { ChatPanel } from "@/components/workspace/chat-panel"
import { useState } from "react"


const boards = [
  {
    id: "1",
    name: "Product Roadmap",
    description: "Q1 feature planning and development timeline",
    taskCount: 24,
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Marketing Campaign",
    description: "Spring launch campaign assets",
    taskCount: 15,
    lastUpdated: "5 hours ago",
  },
]

export default function WorkspacePage() {
  const userRole = "member" // admin | member | viewer
  const canCreateBoard = userRole !== "viewer"
  const [isChatOpen, setIsChatOpen] = useState(true)


  return (
    <div className="flex h-screen bg-neutral-50">
       <Sidebar onChatToggle={() => setIsChatOpen(!isChatOpen)} />

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Product Team
            </h1>
            <p className="text-sm text-neutral-600">
              Manage workspace boards
            </p>
          </div>

          {canCreateBoard && (
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Board
            </Button>
          )}
        </div>

        {/* Boards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              {...board}
              isReadOnly={userRole === "viewer"}
            />
          ))}
        </div>
      </main>

       {isChatOpen && (
        <aside className="w-80 border-l border-neutral-200 bg-white">
          <ChatPanel />
        </aside>
      )}
    </div>
  )
}
