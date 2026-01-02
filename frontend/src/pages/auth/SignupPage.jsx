import React from "react"
import { Link } from "react-router-dom"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/Signup-Form"

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your workspace in minutes"
      description="Join thousands of teams collaborating on HyperCollab."
    >
      <SignUpForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
