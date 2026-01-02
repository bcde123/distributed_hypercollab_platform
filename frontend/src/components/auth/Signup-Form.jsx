import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignUpForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (!name || !email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      console.log("[Signup attempt]", { name, email })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 text-sm text-destructive bg-red-50 border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">UserName</Label>
        <Input
          id="username"
          type="text"
          placeholder="Alex Johnson"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoComplete="name"
          autoFocus
          className="h-11 bg-card border border-border focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          className="h-11 bg-card border border-border focus:ring-2 focus:ring-primary"

        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          className="h-11 bg-card border border-border focus:ring-2 focus:ring-primary"

        />
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters
        </p>
      </div>

      <div className="pt-2">
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Your workspace will be created with you as the{" "}
          <span className="font-medium text-foreground">Admin</span>. You can
          invite team members as Members or Viewers later.
        </p>

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? "Creating workspace..." : "Create workspace"}
        </Button>
      </div>
    </form>
  )
}
