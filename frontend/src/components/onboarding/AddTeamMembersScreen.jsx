import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { generateInviteLink } from "@/features/workspace/workspaceThunks"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

export function AddTeamMembersScreen({ workspaceName }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentWorkspace, invite, isLoading } = useSelector(
    (state) => state.workspace
  )

  const [emails, setEmails] = useState([])
  const [currentEmail, setCurrentEmail] = useState("")

  const addEmail = () => {
    if (!currentEmail.trim()) return
    setEmails((prev) => [...prev, currentEmail.trim()])
    setCurrentEmail("")
  }

  /* ================= Generate Invite ================= */
  const handleGenerateInvite = async () => {
    if (!currentWorkspace?._id) {
      toast.error("Workspace not ready")
      return
    }

    const result = await dispatch(
      generateInviteLink({
        workspaceId: currentWorkspace._id,
        emails, // 👈 MULTIPLE EMAILS
      })
    )

    if (generateInviteLink.fulfilled.match(result)) {
      toast.success(
        invite.emailsSent > 0
          ? `Invite sent to ${invite.emailsSent} email(s) 📧`
          : "Invite link generated 🔗"
      )
    }

    if (generateInviteLink.rejected.match(result)) {
      toast.error(result.payload)
    }
  }

  /* ================= Copy Link ================= */
  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(invite.link)
    toast.success("Invite link copied")
  }

  /* ================= Finish Setup ================= */
  const handleFinishSetup = () => {
    if (!currentWorkspace?.slug) {
      toast.error("Workspace not ready yet")
      return
    }
    navigate(`/workspaces/${currentWorkspace.slug}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <h1 className="text-xl font-semibold">
          Who else is on {workspaceName}?
        </h1>

        {/* ================= Email Invites ================= */}
        <div className="space-y-2">
          <Label>Invite via email</Label>
          <div className="flex gap-2">
            <Mail className="mt-2" />
            <Input
              placeholder="Enter email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
            />
            <Button onClick={addEmail}>Add</Button>
          </div>

          {emails.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Will send invite to: {emails.join(", ")}
            </p>
          )}
        </div>

        {/* ================= Invite Link ================= */}
        <div className="space-y-2">
          <Label>Invite via link</Label>

          {invite.link ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={invite.link} readOnly />
                <Button variant="outline" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Expires on {new Date(invite.expiresAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleGenerateInvite}
                disabled={isLoading}
              >
                {isLoading ? "Sending invites..." : "Send invites"}
              </Button>

              <p className="text-xs text-muted-foreground">
                This will send email invites and generate a shareable link
              </p>
            </>
          )}
        </div>


        <Button className="w-full" onClick={handleFinishSetup}>
          Finish setup
        </Button>
      </Card>
    </div>
  )
}
