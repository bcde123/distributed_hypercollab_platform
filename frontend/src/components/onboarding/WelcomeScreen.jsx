import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Building2, Users } from "lucide-react"

export function WelcomeScreen({ onNavigate }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold">Get started</h1>
          <p className="text-muted-foreground">
            Choose how you'd like to begin your workspace journey
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card onClick={() => onNavigate("create")} className="cursor-pointer">
            <div className="p-8 space-y-4">
              <Building2 />
              <h2>Create a new workspace</h2>
              <Button>Create workspace</Button>
            </div>
          </Card>

          <Card onClick={() => onNavigate("join")} className="cursor-pointer">
            <div className="p-8 space-y-4">
              <Users />
              <h2>Join an existing workspace</h2>
              <Button>Join workspace</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
