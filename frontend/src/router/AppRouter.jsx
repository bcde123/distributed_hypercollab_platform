import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/landing/LandingPage"
import LoginPage from "@/pages/auth/LoginPage"
import SignupPage from "@/pages/auth/SignupPage"
import WorkspacePage from "@/pages/workspace/workspace"
import Onboarding from "@/pages/workspace/Onboarding"
import PrivateRoute from "./PrivateRoute"

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        }/>
        <Route path="/workspaces/:slug" element={
          <PrivateRoute>
            <WorkspacePage />
          </PrivateRoute>
        }/>
      </Routes>
    </BrowserRouter>
  )
}
