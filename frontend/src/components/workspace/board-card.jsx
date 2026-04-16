import { Clock, ListTodo, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

// Maps background slug → gradient classes
const GRADIENTS = {
  "default-blue":   "from-indigo-500 to-blue-600",
  "purple":         "from-violet-500 to-purple-600",
  "green":          "from-emerald-500 to-teal-600",
  "orange":         "from-orange-400 to-amber-500",
  "red":            "from-rose-500 to-red-600",
  "pink":           "from-pink-500 to-fuchsia-600",
  "cyan":           "from-cyan-500 to-sky-600",
}

function getGradient(background = "") {
  return GRADIENTS[background] || GRADIENTS["default-blue"]
}

export function BoardCard({
  _id,
  title,
  background,
  description,
  taskCount = 0,
  updatedAt,
  workspaceSlug,
  isReadOnly = false,
}) {
  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })
    : "Just now"

  const gradient = getGradient(background)

  return (
    <Link to={`/workspaces/${workspaceSlug}/boards/${_id}`} className="block group">
      <div className="relative bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 h-full flex flex-col">

        {/* Gradient accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient} flex-shrink-0`} />

        <div className="p-5 flex flex-col flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-semibold text-neutral-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2 flex-1 mr-2">
              {title}
            </h3>
            {isReadOnly && (
              <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                View Only
              </Badge>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-100 mt-3">
            <div className="flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5" />
              <span>{taskCount} {taskCount === 1 ? "task" : "tasks"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Hover arrow overlay */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <ArrowRight className="h-4 w-4 text-indigo-400" />
        </div>
      </div>
    </Link>
  )
}
