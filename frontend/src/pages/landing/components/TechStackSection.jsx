import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"

export default function TechStackSection() {
  return (
    <section id="tech" className="px-6 py-20">
      <div className="max-w-5xl mx-auto text-center">

        <Badge variant="secondary" className="mb-4">
          Enterprise-Grade Technology
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Built for performance and scale
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <TechCard title="MERN Stack" desc="MongoDB, Express, React, Node.js" />
          <TechCard title="C++ WebSockets" desc="Low-latency real-time updates" />
          <TechCard title="Event-Driven" desc="Scalable distributed architecture" />
        </div>

      </div>
    </section>
  )
}

function TechCard({ title, desc }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <Zap className="w-6 h-6 text-primary mx-auto mb-3" />
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}
