import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Link2 } from "lucide-react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { joinWorkspaceByInvite } from "@/features/workspace/workspaceThunks"





export function JoinWorkspaceScreen({ onNavigate }) {
  const [inviteCode, setInviteCode] = useState("")
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const extractInviteToken = (value) => {
    if (!value) return null

    // If full URL pasted
    if (value.includes("/join/")) {
      return value.split("/join/").pop()
    }

    if (value.includes("/invite/")) {
      return value.split("/invite/").pop()
    }

    // Otherwise assume it's already a token
    return value.trim()
  }
  const handleSubmit = async (e) => {
    e.preventDefault()

    const inviteToken = extractInviteToken(inviteCode)

    if (!inviteToken) {
      toast.error("Invalid invite link or code")
      return
    }

    const result = await dispatch(
      joinWorkspaceByInvite(inviteToken)
    )

    if (joinWorkspaceByInvite.fulfilled.match(result)) {
      toast.success("Joined workspace 🎉")
      navigate(`/workspaces/${result.payload.slug}`)
    } else {
      toast.error(result.payload)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <Button variant="ghost" onClick={() => onNavigate("welcome")}>
          <ArrowLeft /> Back
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Label>Invite link or code</Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-3" />
            <Input
              className="pl-10"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Paste invite link or code"
            />
          </div>

          <Button type="submit" className="w-full">
            Join workspace
          </Button>
        </form>
      </Card>
    </div>
  )
}