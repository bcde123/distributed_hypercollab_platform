import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

export function CreateWorkspaceScreen({ onNavigate, onWorkspaceCreated }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) onWorkspaceCreated(name)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        <Button variant="ghost" onClick={() => onNavigate("welcome")}>
          <ArrowLeft /> Back
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Label>Workspace name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />

          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button type="submit" disabled={!name.trim()}>
            Create workspace
          </Button>
        </form>
      </Card>
    </div>
  )
}
