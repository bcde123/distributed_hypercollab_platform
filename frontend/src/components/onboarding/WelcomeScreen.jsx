import { Button } from "@/components/ui/button"
import { Building2, Users, ArrowRight, Zap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const options = [
  {
    id: "create",
    icon: Building2,
    title: "Create a workspace",
    description: "Start fresh and invite your team to collaborate in real-time.",
    cta: "Create workspace",
    gradient: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200 hover:border-indigo-300",
  },
  {
    id: "join",
    icon: Users,
    title: "Join an existing workspace",
    description: "You have an invite link? Jump right in and get collaborating.",
    cta: "Join workspace",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 hover:border-emerald-300",
  },
]

const features = [
  { icon: Zap,    label: "Real-time sync" },
  { icon: Shield, label: "E2E encrypted chat" },
  { icon: Users,  label: "Team collaboration" },
]

export function WelcomeScreen({ onNavigate }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-neutral-50 page-enter">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
            <Zap className="h-3 w-3" /> Distributed HyperCollab
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">
            Welcome aboard 👋
          </h1>
          <p className="text-neutral-500 text-base">
            Choose how you'd like to begin your collaboration journey
          </p>
        </div>

        {/* Option cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onNavigate(opt.id)}
              className={cn(
                "group text-left p-6 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                opt.bg
              )}
            >
              <div className={cn(
                "h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-sm",
                opt.gradient
              )}>
                <opt.icon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1.5">{opt.title}</h2>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">{opt.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:gap-2.5 transition-all">
                {opt.cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {features.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-xs text-neutral-400 bg-white border border-neutral-200 rounded-full px-3 py-1.5 shadow-sm">
              <Icon className="h-3 w-3 text-indigo-400" /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
