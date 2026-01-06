import { LayoutGrid, MessageSquare, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navigation = [
  { name: "Boards", icon: LayoutGrid, id: "boards" },
  { name: "Chat", icon: MessageSquare, id: "chat" },
  { name: "Analytics", icon: BarChart3, id: "analytics" },
]

export function Sidebar( {onChatToggle} ) {
  const [activeTab, setActiveTab] = useState("boards")

  return (
    <aside className="w-64 border-r border-neutral-200 bg-white">
      <div className="flex h-full flex-col">

        {/* Brand */}
        <div className="border-b border-neutral-200 p-6">
          <h2 className="text-xl font-bold text-indigo-600">HyperCollab</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Workspace collaboration
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {setActiveTab(item.id)
                     if (item.id === "chat" && onChatToggle) {
                    onChatToggle()
                  }}}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
              JD
            </div>
            <div className="text-sm">
              <p className="font-medium text-neutral-900">John Doe</p>
              <p className="text-xs text-neutral-500">Member</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
