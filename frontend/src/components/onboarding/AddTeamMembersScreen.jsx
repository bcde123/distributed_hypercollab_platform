import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail, X } from "lucide-react"

export function AddTeamMembersScreen({ workspaceName }) {
  const [emails, setEmails] = useState([])
  const [currentEmail, setCurrentEmail] = useState("")

  const addEmail = () => {
    if (currentEmail) {
      setEmails([...emails, currentEmail])
      setCurrentEmail("")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <h1>Who else is on {workspaceName}?</h1>

        <div className="flex gap-2">
          <Mail />
          <Input
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
          />
          <Button onClick={addEmail}>Add</Button>
        </div>

        <Button>Finish setup</Button>
      </Card>
    </div>
  )
}
