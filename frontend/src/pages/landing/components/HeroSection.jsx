import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardPreview from "./DashboardPreview"

export default function HeroSection() {
  return (
    <section className="relative px-6 py-20 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Text */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            Real-time Unified Workspace
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            One Workspace. Tasks, Chat & Insights — Live.
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Plan, collaborate, and track productivity in real time without switching apps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="px-8 bg-transparent">
              View Demo
            </Button>
          </div>
        </div>

        {/* Preview */}
        <DashboardPreview />

      </div>
    </section>
  )
}
