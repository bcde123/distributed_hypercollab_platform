import { LayoutGrid, MessageSquare, BarChart3, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSelector } from "react-redux"

const navigation = [
  { name: "Boards",    icon: LayoutGrid,    id: "boards" },
  { name: "Members",   icon: Users,         id: "members" },
  { name: "Analytics", icon: BarChart3,     id: "analytics" },
  { name: "Chat",      icon: MessageSquare, id: "chat" },
]

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"
}

export function Sidebar({ activeTab, onTabChange }) {
  const currentUser = useSelector((state) => state.auth.user)

  const displayName = currentUser?.username || currentUser?.email || "Unknown"
  const role = currentUser?.role || "member"
  const initials = getInitials(displayName)

  return (
    <aside className="w-64 border-r border-neutral-200 bg-white flex-shrink-0">
      <div className="flex h-full flex-col">

        {/* ── Brand ── */}
        <div className="border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 leading-none">HyperCollab</h2>
              <p className="text-[10px] text-neutral-400 mt-0.5">Distributed workspace</p>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navigation.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                title={item.name}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600" />
                )}
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 transition-colors",
                    isActive ? "text-indigo-600" : "text-neutral-400 group-hover:text-neutral-700"
                  )}
                  style={{ width: "18px", height: "18px" }}
                />
                <span className="flex-1 text-left">{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* ── User footer ── */}
        <div className="border-t border-neutral-100 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-sm">
                {initials}
              </div>
              {/* Online dot */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900 leading-none">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-neutral-400 capitalize">{role}</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
