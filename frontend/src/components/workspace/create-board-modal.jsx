import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const BACKGROUNDS = [
  { id: "default-blue", label: "Blue",    gradient: "from-indigo-500 to-blue-600" },
  { id: "purple",       label: "Purple",  gradient: "from-violet-500 to-purple-600" },
  { id: "green",        label: "Green",   gradient: "from-emerald-500 to-teal-600" },
  { id: "orange",       label: "Orange",  gradient: "from-orange-400 to-amber-500" },
  { id: "red",          label: "Red",     gradient: "from-rose-500 to-red-600" },
  { id: "pink",         label: "Pink",    gradient: "from-pink-500 to-fuchsia-600" },
  { id: "cyan",         label: "Cyan",    gradient: "from-cyan-500 to-sky-600" },
]

export function CreateBoardModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("")
  const [selectedBg, setSelectedBg] = useState("default-blue")

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title, background: selectedBg })
    setTitle("")
    setSelectedBg("default-blue")
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Preview bar */}
        <div className={cn(
          "h-2 w-full bg-gradient-to-r transition-all duration-300",
          BACKGROUNDS.find(b => b.id === selectedBg)?.gradient
        )} />

        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Create New Board</h2>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="board-title" className="text-sm font-medium text-neutral-700">
                Board Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="board-title"
                placeholder="e.g. Marketing Campaign Q3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="h-10"
              />
            </div>

            {/* Background picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Accent Colour</Label>
              <div className="flex gap-2 flex-wrap">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    title={bg.label}
                    onClick={() => setSelectedBg(bg.id)}
                    className={cn(
                      "h-8 w-8 rounded-lg bg-gradient-to-br transition-all duration-150 flex items-center justify-center ring-offset-2",
                      bg.gradient,
                      selectedBg === bg.id
                        ? "ring-2 ring-indigo-500 scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    )}
                  >
                    {selectedBg === bg.id && (
                      <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={onClose} className="h-9">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 h-9 shadow-sm"
                disabled={!title.trim()}
              >
                Create Board
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
