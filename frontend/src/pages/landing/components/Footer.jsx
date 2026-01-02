import { Layers } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 px-6 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">HyperCollab</span>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>

        <p className="text-sm text-muted-foreground">
          © 2025 HyperCollab
        </p>

      </div>
    </footer>
  )
}
