import React, { useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser } from "@/features/auth/authThunks"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Password strength helper ──────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: "Weak",      color: "bg-red-500" }
  if (score <= 2) return { score, label: "Fair",      color: "bg-amber-500" }
  if (score <= 3) return { score, label: "Good",      color: "bg-yellow-400" }
  if (score <= 4) return { score, label: "Strong",    color: "bg-emerald-500" }
  return              { score, label: "Very Strong", color: "bg-emerald-600" }
}

export function SignUpForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isLoading, error } = useSelector((state) => state.auth)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !email || !password) return
    if (!email.includes("@")) { toast.error("Enter a valid email address"); return }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return }

    try {
      await dispatch(registerUser({ username, email, password })).unwrap()
      toast.success("Account created! Please sign in.")
      navigate("/login")
    } catch (err) {
      toast.error(err || "Signup failed. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-username" className="text-sm font-medium text-foreground">
          Username
        </Label>
        <Input
          id="signup-username"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoFocus
          autoComplete="username"
          className="h-11"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          className="h-11"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength meter */}
        {password.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    strength.score >= seg ? strength.color : "bg-neutral-200"
                  )}
                />
              ))}
            </div>
            <p className={cn(
              "text-[11px] font-medium transition-colors",
              strength.score <= 1 ? "text-red-500" :
              strength.score <= 2 ? "text-amber-500" :
              strength.score <= 3 ? "text-yellow-600" : "text-emerald-600"
            )}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 shadow-sm mt-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  )
}