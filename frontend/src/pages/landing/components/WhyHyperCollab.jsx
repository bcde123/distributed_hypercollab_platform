import { Card, CardContent } from "@/components/ui/card"
import { Layers, CheckCircle2, MessageSquare, BarChart3 } from "lucide-react"

export default function WhyHyperCollab() {
  return (
    <section className="px-6 py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto text-center">

        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Instead of juggling 4 tools — HyperCollab unifies everything.
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          <StrikeCard icon={<CheckCircle2 />} label="Task Tool" />
          <StrikeCard icon={<MessageSquare />} label="Chat App" />
          <StrikeCard icon={<Layers />} label="Workspace" />
          <StrikeCard icon={<BarChart3 />} label="Analytics" />
        </div>

        <Card className="border-2 border-primary shadow-lg inline-block">
          <CardContent className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HyperCollab</span>
          </CardContent>
        </Card>

      </div>
    </section>
  )
}

function StrikeCard({ icon, label }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="w-10 h-10 bg-muted mx-auto rounded-lg flex items-center justify-center mb-3">
          {icon}
        </div>
        <p className="line-through text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
