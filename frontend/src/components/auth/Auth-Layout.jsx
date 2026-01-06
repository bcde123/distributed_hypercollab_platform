import React from "react"
import { Link } from "react-router-dom"

export function AuthLayout({ children, title, description }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Product Context */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/3 to-background relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          {/* Blurred Dashboard Preview */}
          <div className="w-full max-w-2xl space-y-6">
            {/* Mock Dashboard Elements */}
            <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-muted/40 rounded-md" />
                <div className="h-20 bg-muted/40 rounded-md" />
                <div className="h-20 bg-muted/40 rounded-md" />
              </div>
            </div>

            <div className="bg-card/60 backdrop-blur-md rounded-lg border border-border shadow-lg p-6 space-y-3">
              <div className="h-3 w-full bg-muted/40 rounded" />
              <div className="h-3 w-5/6 bg-muted/40 rounded" />
              <div className="h-3 w-4/6 bg-muted/40 rounded" />
            </div>
          </div>
        </div>

        {/* Branding */}
        <Link to="/" className="flex items-center gap-2">
         <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-foreground">HyperCollab</span>
        </div>
        </Link>
       
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
        

        
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-foreground">HyperCollab</span>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
            <p className="text-sm text-muted-foreground text-balance">{description}</p>
          </div>

          {/* Form */}
          {children}
        </div>
      </div>
    </div>
  )
}