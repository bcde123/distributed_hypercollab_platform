import React from "react"
import { Link } from "react-router-dom"
import { Zap, Lock, Cpu, MessageSquare, LayoutGrid, BarChart3 } from "lucide-react"

const features = [
  { icon: LayoutGrid, title: "Kanban Boards",     desc: "Real-time task management across your team" },
  { icon: MessageSquare, title: "E2E Encrypted Chat", desc: "Kyber-768 post-quantum secured messaging" },
  { icon: BarChart3, title: "Analytics Engine",  desc: "C++ powered metrics streamed via Kafka" },
  { icon: Lock,      title: "Zero Trust Auth",   desc: "JWT + refresh token stateless security" },
]

export function AuthLayout({ children, title, description }) {
  return (
    <div className="min-h-screen flex font-['Inter',system-ui,sans-serif]">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDM2djM2aC0xOFYxOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-40" />

        {/* Floating orbs */}
        <div className="absolute top-[-80px] right-[-80px] h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">HyperCollab</span>
          </Link>

          {/* Main copy */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-3 py-1">
                <Zap className="h-3 w-3" /> Distributed · Real-time · Secure
              </span>
              <h2 className="text-3xl font-bold text-white leading-tight">
                The collaboration platform<br />
                <span className="text-indigo-300">built for distributed teams</span>
              </h2>
              <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
                Plan tasks on Kanban boards, chat with end-to-end encryption, and monitor real-time analytics — all in one place.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 group">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-white/15 transition-colors">
                    <Icon className="h-4 w-4 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-indigo-300/80">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-indigo-400/60">
            © {new Date().getFullYear()} HyperCollab · Distributed Systems Platform
          </p>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-neutral-900">HyperCollab</span>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
            <p className="text-sm text-neutral-500">{description}</p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>
    </div>
  )
}