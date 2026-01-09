import React, { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser } from "@/features/auth/authThunks"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export function SignUpForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // ✅ use Redux state (single source of truth)
  const { isLoading, error } = useSelector((state) => state.auth)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username || !email || !password) return
    if (!email.includes("@")) return
    if (password.length < 8) return

    try {
      await dispatch(
        registerUser({
          username,
          email,
          password,
        })
      ).unwrap() // ✅ critical fix

      toast.success("Signup successful")
      navigate("/login")
    } catch (err) {
      toast.error(err || "Signup failed")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>UserName</Label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating workspace..." : "Create workspace"}
      </Button>
    </form>
  )
}