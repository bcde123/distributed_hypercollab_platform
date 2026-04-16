import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { joinWorkspaceByInvite } from "@/features/workspace/workspaceThunks"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function JoinPage() {
  const { token } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const isLoading = useSelector((state) => state.auth.isLoading)
  const [status, setStatus] = useState("loading") // loading | success | error
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    // Wait for auth to finish loading before attempting join
    if (isLoading) return

    if (!isAuthenticated) {
      // Redirect to login with return URL
      toast.info("Please log in first to join the workspace")
      navigate(`/login?redirect=/join/${token}`)
      return
    }

    const joinWorkspace = async () => {
      setStatus("loading")
      const result = await dispatch(joinWorkspaceByInvite(token))

      if (joinWorkspaceByInvite.fulfilled.match(result)) {
        setStatus("success")
        toast.success("Joined workspace! 🎉")
        setTimeout(() => {
          navigate(`/workspaces/${result.payload.slug}`)
        }, 1500)
      } else {
        setStatus("error")
        setErrorMsg(result.payload || "Failed to join workspace")
        toast.error(result.payload || "Failed to join workspace")
      }
    }

    joinWorkspace()
  }, [token, isAuthenticated, isLoading, dispatch, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
            <h2 className="text-xl font-semibold text-neutral-900">Joining workspace...</h2>
            <p className="text-neutral-500">Please wait while we set things up</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-semibold text-neutral-900">You're in!</h2>
            <p className="text-neutral-500">Redirecting to workspace...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-neutral-900">Couldn't join</h2>
            <p className="text-neutral-500">{errorMsg}</p>
            <button
              onClick={() => navigate("/onboarding")}
              className="mt-4 text-indigo-600 underline text-sm"
            >
              Go to onboarding
            </button>
          </>
        )}
      </div>
    </div>
  )
}
