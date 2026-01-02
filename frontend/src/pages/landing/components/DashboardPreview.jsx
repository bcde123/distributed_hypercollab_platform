import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Activity,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react"

export default function DashboardPreview() {
  return (
    <div className="relative max-w-6xl mx-auto">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-3xl -z-10" />

      <Card className="overflow-hidden border-2 shadow-2xl">
        <CardContent className="p-6 space-y-4">

          {/* Task Board */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-semibold">Task Board</h3>
              <Badge variant="secondary">Live</Badge>
            </div>

            <div className="space-y-2">
              <TaskItem
                icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
                title="Design system update"
                subtitle="Due in 2 days"
              />
              <TaskItem
                icon={<Activity className="w-4 h-4 text-accent" />}
                title="API integration"
                subtitle="In progress"
              />
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-muted/30 rounded-lg p-4 flex gap-6">
            <Stat icon={<TrendingUp />} label="Productivity" value="+23%" />
            <Stat icon={<Clock />} label="Active Time" value="4.2h" />
            <Stat icon={<Users />} label="Team" value="8 online" />
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

/* Small reusable pieces */
function TaskItem({ icon, title, subtitle }) {
  return (
    <div className="bg-card p-3 rounded-md border flex gap-2">
      {icon}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}
