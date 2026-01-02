import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle2,
  MessageSquare,
  Layers,
  BarChart3,
} from "lucide-react"

export default function WhyHyperCollab() {
  return (
    <section className="px-6 py-24 bg-background">
      <div className="max-w-6xl mx-auto text-center">

        {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Instead of juggling 4 tools —
        </h2>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          HyperCollab unites everything.
        </h2>

        {/* Subheading */}
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-14">
          Stop context-switching between Trello, Slack, Notion, and your analytics dashboard.
          <br />
          One login. One workspace. Infinite focus.
        </p>

        {/* Tool Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StrikeCard icon={<CheckCircle2 />} label="Task Tool" />
          <StrikeCard icon={<MessageSquare />} label="Chat App" />
          <StrikeCard icon={<Layers />} label="Workspace" />
          <StrikeCard icon={<BarChart3 />} label="Analytics" />
        </div>

        {/* Final Unified Card */}
        <Card className="border-2 border-primary/60 shadow-lg">
          <CardContent className="p-10 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">
              <Layers className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-xl font-semibold">HyperCollab</p>
            <p className="text-sm text-muted-foreground">
              All-in-one workspace
            </p>
          </CardContent>
        </Card>

      </div>
    </section>
  )
}

function StrikeCard({ icon, label }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 bg-muted rounded-xl mx-auto mb-4 flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground line-through">
          {label}
        </p>
      </CardContent>
    </Card>
  )
}
