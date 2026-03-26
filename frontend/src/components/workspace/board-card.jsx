import { Clock, ListTodo } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BoardCard({
  _id,
  title, // Changed from name
  background,
  description,
  taskCount = 0,
  updatedAt,
  workspaceSlug,
  isReadOnly = false,
}) {
  const lastUpdated = updatedAt ? new Date(updatedAt).toLocaleDateString() : "Just now";

  return (
    <Link to={`/workspaces/${workspaceSlug}/boards/${_id}`} className="block">
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-indigo-200 h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg text-neutral-900 group-hover:text-indigo-700">
            {title}
          </CardTitle>
          {isReadOnly && (
            <Badge variant="secondary" className="text-xs">
              View Only
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2 text-neutral-600">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            <span>{taskCount} tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{lastUpdated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}
