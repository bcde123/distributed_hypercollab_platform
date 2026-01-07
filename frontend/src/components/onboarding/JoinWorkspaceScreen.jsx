import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Link2 } from "lucide-react"

export function JoinWorkspaceScreen({ onNavigate }) {
  const [inviteCode, setInviteCode] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Joining workspace:", inviteCode)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <Button variant="ghost" onClick={() => onNavigate("welcome")}>
          <ArrowLeft /> Back
        </Button>

        <form onSubmit={handleSubmit}>
          <Label>Invite link or code</Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-3" />
            <Input
              className="pl-10"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>

          <Button type="submit">Join workspace</Button>
        </form>
      </Card>
    </div>
  )
}
