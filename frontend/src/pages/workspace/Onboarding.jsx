import { useState } from "react"
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen"
import { CreateWorkspaceScreen } from "@/components/onboarding/CreateWorkspaceScreen"
import { JoinWorkspaceScreen } from "@/components/onboarding/JoinWorkspaceScreen"
import { AddTeamMembersScreen } from "@/components/onboarding/AddTeamMembersScreen"

export default function Onboarding() {
  const [step, setStep] = useState("welcome")
  const [workspaceName, setWorkspaceName] = useState("")

  return (
    <>
      {step === "welcome" && <WelcomeScreen onNavigate={setStep} />}
      {step === "create" && (
        <CreateWorkspaceScreen
          onNavigate={setStep}
          onWorkspaceCreated={(name) => {
            setWorkspaceName(name)
            setStep("add-members")
          }}
        />
      )}
      {step === "join" && <JoinWorkspaceScreen onNavigate={setStep} />}
      {step === "add-members" && (
        <AddTeamMembersScreen workspaceName={workspaceName} />
      )}
    </>
  )
}
