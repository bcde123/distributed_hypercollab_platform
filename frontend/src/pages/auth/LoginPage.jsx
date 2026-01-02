import React from "react"
import { LoginForm } from "@/components/auth/login-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Link } from "react-router-dom"

export const metadata = {
  title: "Sign In - HyperCollab",
  description: "Sign in to your HyperCollab workspace",
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in to continue collaborating"
      description="Access your workspace and pick up where you left off."
    >
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create your workspace
        </Link>
      </p>
    </AuthLayout>
  )
}