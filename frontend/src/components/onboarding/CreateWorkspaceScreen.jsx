import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { createWorkspace } from "@/features/workspace/workspaceThunks"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

export function CreateWorkspaceScreen({ onNavigate }) {
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.workspace)
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

  const handleSubmit = async (e) => {
  e.preventDefault()

  const result = await dispatch(
    createWorkspace({
      name,
      slug: generateSlug(name),
      description,
    })
  )

  if (createWorkspace.fulfilled.match(result)) {
    toast.success("Workspace created successfully 🎉")
    console.log(result.payload.workspace.slug)
    navigate(`/workspaces/${result.payload.workspace.slug}`)
  }

  if (createWorkspace.rejected.match(result)) {
    toast.error(result.payload || "Failed to create workspace")
  }
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={!name.trim() || isLoading}>
            {isLoading ? "Creating..." : "Create workspace"}
          </Button>
        </form>
      </Card>
    </div>
  )
}