import { Clock, ListTodo } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BoardCard({
  name,
  description,
  taskCount,
  lastUpdated,
  isReadOnly = false,
}) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-indigo-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg text-neutral-900 group-hover:text-indigo-700">
            {name}
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
  )
}
