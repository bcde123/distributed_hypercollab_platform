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

  const { currentWorkspace, inviteLink, isLoading } = useSelector(
    (state) => state.workspace
  )

  const [emails, setEmails] = useState([])
  const [currentEmail, setCurrentEmail] = useState("")

  const addEmail = () => {
    if (!currentEmail.trim()) return
    setEmails([...emails, currentEmail])
    setCurrentEmail("")
  }

  const handleGenerateInvite = async () => {
    const result = await dispatch(
      generateInviteLink(currentWorkspace._id)
    )

    if (generateInviteLink.fulfilled.match(result)) {
      toast.success("Invite link generated 🔗")
    }

    if (generateInviteLink.rejected.match(result)) {
      toast.error(result.payload)
    }
  }


    const handleFinishSetup = () => {
    if (!currentWorkspace?.slug) {
      toast.error("Workspace not ready yet")
      return
    }

    navigate(`/workspaces/${currentWorkspace.slug}`)
  }

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    toast.success("Invite link copied")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <h1 className="text-xl font-semibold">
          Who else is on {workspaceName}?
        </h1>

        {/* Email invite */}
        <div className="flex gap-2">
          <Mail className="mt-2" />
          <Input
            placeholder="Enter email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
          />
          <Button onClick={addEmail}>Add</Button>
        </div>

        {/* Invite link */}
        <div className="space-y-2">
          <Label>Invite via link</Label>

          {inviteLink ? (
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly />
              <Button variant="outline" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleGenerateInvite}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate invite link"}
            </Button>
          )}
        </div>

        <Button className="w-full" onClick={handleFinishSetup}>
        Finish setup
      </Button>
      </Card>
    </div>
  )
}