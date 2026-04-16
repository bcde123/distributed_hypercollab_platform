import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Link2, Loader2, Users } from "lucide-react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { joinWorkspaceByInvite } from "@/features/workspace/workspaceThunks"

export function JoinWorkspaceScreen({ onNavigate }) {
  const [inviteCode, setInviteCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const extractInviteToken = (value) => {
    if (!value) return null
    if (value.includes("/join/"))   return value.split("/join/").pop()
    if (value.includes("/invite/")) return value.split("/invite/").pop()
    return value.trim()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const inviteToken = extractInviteToken(inviteCode)

    if (!inviteToken) {
      toast.error("Invalid invite link or code")
      return
    }

    setIsJoining(true)
    const result = await dispatch(joinWorkspaceByInvite(inviteToken))
    setIsJoining(false)

    if (joinWorkspaceByInvite.fulfilled.match(result)) {
      toast.success("Joined workspace! 🎉")
      navigate(`/workspaces/${result.payload.slug}`)
    } else {
      toast.error(result.payload || "Failed to join workspace")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-neutral-50 page-enter">
      <div className="w-full max-w-lg space-y-6">

        {/* Back */}
        <button
          onClick={() => onNavigate("welcome")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Join a workspace</h1>
            <p className="text-sm text-neutral-500">Paste an invite link or code to get started</p>
          </div>
        </div>

        <Card className="p-6 shadow-sm border-neutral-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="invite-code" className="text-sm font-medium text-neutral-700">
                Invite link or code
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="invite-code"
                  className="pl-10 h-10"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="https://hypercollab.app/join/… or paste code"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Tip: you can paste the full URL or just the invite token
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 shadow-sm"
              disabled={!inviteCode.trim() || isJoining}
            >
              {isJoining ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</>
              ) : (
                "Join workspace"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}