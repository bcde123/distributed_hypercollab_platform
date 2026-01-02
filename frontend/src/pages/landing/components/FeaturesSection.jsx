import { Card, CardContent } from "@/components/ui/card"
import { Zap, BarChart3, Layers } from "lucide-react"

export default function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need. Nothing you don’t.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for teams who value speed, clarity, and seamless collaboration.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="Real-time Collaboration"
            description="See changes instantly. Chat, update tasks, and track progress together."
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6 text-accent" />}
            title="Built-in Analytics"
            description="Track productivity, completion rates, and time spent in one dashboard."
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6 text-primary" />}
            title="Zero Context Switching"
            description="Tasks, chat, and analytics unified in a single workspace."
          />
        </div>

      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardContent className="p-8">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
