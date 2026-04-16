import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Building2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { createWorkspace } from "@/features/workspace/workspaceThunks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function CreateWorkspaceScreen({ onNavigate, onWorkspaceCreated }) {
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.workspace)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const generateSlug = (name) =>
    name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const slug = generateSlug(name)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(createWorkspace({ name, slug, description }))

    if (createWorkspace.fulfilled.match(result)) {
      toast.success("Workspace created! 🎉")
      onWorkspaceCreated(result.payload.workspace.name)
    }
    if (createWorkspace.rejected.match(result)) {
      toast.error(result.payload || "Failed to create workspace")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-neutral-50 page-enter">
      <div className="w-full max-w-lg space-y-6">

        {/* Back button */}
        <button
          onClick={() => onNavigate("welcome")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Create a workspace</h1>
              <p className="text-sm text-neutral-500">Set up your team's collaboration hub</p>
            </div>
          </div>
        </div>

        <Card className="p-6 shadow-sm border-neutral-200">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Workspace name */}
            <div className="space-y-1.5">
              <Label htmlFor="ws-name" className="text-sm font-medium text-neutral-700">
                Workspace name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="ws-name"
                placeholder="e.g. Acme Engineering, Design Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-10"
              />
              {/* Slug preview */}
              {slug && (
                <p className="text-[11px] text-neutral-400 font-mono">
                  URL: <span className="text-indigo-500">hypercollab.app/</span>{slug}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="ws-desc" className="text-sm font-medium text-neutral-700">
                Description <span className="text-neutral-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="ws-desc"
                placeholder="Briefly describe what this workspace is for…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none text-sm"
                rows={3}
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 shadow-sm"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                "Create workspace"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}