import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TechStackSection() {
  return (
    <section id="tech" className="px-6 py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto text-center">

        <Badge variant="secondary" className="mb-4">
          Enterprise-Grade Technology
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Built for performance and scale
        </h2>

        <p className="text-muted-foreground mb-12">
          Modern tech stack powering real-time collaboration for teams of all sizes.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <TechCard title="MERN Stack" label="JS">
            MongoDB, Express, React, Node.js for robust backend architecture
          </TechCard>

          <TechCard title="WebSocket Engine" label="C++">
            High-performance C++ for millisecond-level real-time updates
          </TechCard>

          <TechCard title="Event-Driven">
            Scalable event-driven architecture for distributed systems
          </TechCard>
        </div>

      </div>
    </section>
  )
}

function TechCard({ title, label, children }) {
  return (
    <Card className="border hover:border-primary/50 transition-colors">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="font-semibold text-primary">{label}</span>
        </div>
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  )
}
