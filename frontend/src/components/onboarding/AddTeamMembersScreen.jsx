import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail, X, Loader2, CheckCircle2, ArrowRight, Link2, PartyPopper } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { generateInviteLink } from "@/features/workspace/workspaceThunks"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

export function AddTeamMembersScreen({ workspaceName }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentWorkspace, invite, isLoading } = useSelector(
    (state) => state.workspace
  )

  const [emails, setEmails] = useState([])
  const [currentEmail, setCurrentEmail] = useState("")

  const addEmail = () => {
    const email = currentEmail.trim()
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address")
      return
    }
    if (emails.includes(email)) {
      toast.error("Email already added")
      return
    }
    setEmails((prev) => [...prev, email])
    setCurrentEmail("")
  }

  const removeEmail = (emailToRemove) => {
    setEmails((prev) => prev.filter((e) => e !== emailToRemove))
  }

  const handleGenerateInvite = async () => {
    if (!currentWorkspace?._id) {
      toast.error("Workspace not ready")
      return
    }
    const result = await dispatch(
      generateInviteLink({ workspaceId: currentWorkspace._id, emails })
    )
    if (generateInviteLink.fulfilled.match(result)) {
      toast.success(
        invite.emailsSent > 0
          ? `Invite sent to ${invite.emailsSent} email(s) 📧`
          : "Invite link generated 🔗"
      )
    }
    if (generateInviteLink.rejected.match(result)) {
      toast.error(result.payload || "Failed to generate invite")
    }
  }

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(invite.link)
    toast.success("Invite link copied to clipboard!")
  }

  const handleFinishSetup = () => {
    if (!currentWorkspace?.slug) {
      toast.error("Workspace not ready yet")
      return
    }
    navigate(`/workspaces/${currentWorkspace.slug}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-neutral-50 page-enter">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm mx-auto mb-2">
            <PartyPopper className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Who else is on {workspaceName}?
          </h1>
          <p className="text-sm text-neutral-500">
            Invite your team via email or share a link — you can always do this later
          </p>
        </div>

        <Card className="p-6 shadow-sm border-neutral-200 space-y-6">

          {/* ── Email invites ── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">
              <Mail className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-neutral-400" />
              Invite via email
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="teammate@company.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                className="h-9 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addEmail}
                className="h-9 text-sm px-4 flex-shrink-0"
                disabled={!currentEmail.trim()}
              >
                Add
              </Button>
            </div>

            {/* Email chips */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {emails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Invite link ── */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <Label className="text-sm font-medium text-neutral-700">
              <Link2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-neutral-400" />
              Invite via link
            </Label>

            {invite.link ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={invite.link}
                    readOnly
                    className="h-9 text-xs font-mono bg-neutral-50 text-neutral-600"
                  />
                  <Button
                    variant="outline"
                    onClick={copyInviteLink}
                    className="h-9 px-3 flex-shrink-0"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Link generated · expires {new Date(invite.expiresAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  onClick={handleGenerateInvite}
                  disabled={isLoading}
                  className="h-9 text-sm w-full"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Sending invites…</>
                  ) : (
                    <>{emails.length > 0 ? "Send invites & generate link" : "Generate invite link"}</>
                  )}
                </Button>
                <p className="text-[11px] text-neutral-400 text-center">
                  {emails.length > 0
                    ? "This will email invites and create a shareable link"
                    : "Create a link anyone can use to join this workspace"
                  }
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Finish ── */}
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 shadow-sm"
          onClick={handleFinishSetup}
        >
          Go to workspace <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <button
          onClick={handleFinishSetup}
          className="block mx-auto text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
