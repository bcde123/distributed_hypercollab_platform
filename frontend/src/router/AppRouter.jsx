import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/landing/LandingPage"
import LoginPage from "@/pages/auth/LoginPage"
import SignupPage from "@/pages/auth/SignupPage"
import WorkspacePage from "@/pages/workspace/workspace"


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path='/workspace' element={<WorkspacePage/>}/>
      </Routes>
    </BrowserRouter>
  )
}
