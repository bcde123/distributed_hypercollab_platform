import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MessageSquare, BarChart3 } from "lucide-react"

export default function ProductSection() {
  return (
    <section id="product" className="px-6 py-20">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* Left */}
        <div>
          <Badge variant="secondary" className="mb-4">
            Unified Dashboard
          </Badge>

          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Your command center for modern teamwork
          </h2>

          <Feature
            icon={<CheckCircle2 />}
            title="Kanban-style task boards"
            desc="Organize work visually with drag-and-drop simplicity."
          />
          <Feature
            icon={<MessageSquare />}
            title="Contextual team chat"
            desc="Discuss tasks without switching apps."
          />
          <Feature
            icon={<BarChart3 />}
            title="Live productivity insights"
            desc="Understand team velocity and optimize workflows."
          />
        </div>

        {/* Right */}
        <Card className="border-2 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="bg-muted/50 rounded-lg p-6">
              <h4 className="text-sm font-semibold mb-2">Sprint Overview</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks Completed</span>
                <span className="font-semibold">24 / 30</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full w-[80%]" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
