import React, { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { UserPlus, MoreVertical, Shield, ShieldAlert, ShieldCheck, UserX } from "lucide-react"
import { updateMemberRole, removeMember, generateInviteLink } from "@/features/workspace/workspaceThunks"
import { toast } from "sonner"

export function MembersList() {
  const dispatch = useDispatch()
  const workspace = useSelector((state) => state.workspace.currentWorkspace)
  const currentUser = useSelector((state) => state.auth.user)
  const isGeneratingInvite = useSelector((state) => state.workspace.isLoading)

  const [activeMenuId, setActiveMenuId] = useState(null)

  if (!workspace) return <div className="p-4 text-neutral-500">Loading members...</div>

  // Find current user's role to determine permissions
  const currentUserMember = workspace.members.find(m => m.user._id === currentUser?._id)
  const currentUserRole = currentUserMember?.role
  const isWorkspaceOwner = workspace.owner?._id === currentUser?._id
  const canManageMembers = isWorkspaceOwner || currentUserRole === "admin"

  const handleInvite = async () => {
    try {
      const res = await dispatch(
        generateInviteLink({ workspaceId: workspace._id, expiryHours: 168 })
      ).unwrap()
      navigator.clipboard.writeText(res.inviteLink)
      toast.success("Invite link copied to clipboard!")
    } catch (err) {
      toast.error("Failed to generate invite link", { description: err })
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    setActiveMenuId(null)
    try {
      await dispatch(
        updateMemberRole({ workspaceId: workspace._id, userId, role: newRole })
      ).unwrap()
      toast.success("Role updated successfully")
    } catch (err) {
      toast.error("Failed to update role", { description: err })
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return
    setActiveMenuId(null)
    try {
      await dispatch(
        removeMember({ workspaceId: workspace._id, userId })
      ).unwrap()
      toast.success("Member removed")
    } catch (err) {
      toast.error("Failed to remove member", { description: err })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Team Members</h2>
          <p className="text-sm text-neutral-500">Manage who has access to this workspace.</p>
        </div>
        
        {canManageMembers && (
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700" 
            onClick={handleInvite}
            disabled={isGeneratingInvite}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isGeneratingInvite ? "Generating..." : "Invite Link"}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <ul className="divide-y divide-neutral-200">
          {workspace.members.map((member) => {
            const isOwner = member.user._id === workspace.owner?._id
            const isSelf = member.user._id === currentUser?._id
            
            return (
              <li key={member.user._id} className="flex items-center justify-between p-4 hover:bg-neutral-50 relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700">
                    {member.user.username ? member.user.username.slice(0, 2).toUpperCase() : member.user.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 group flex items-center gap-2">
                      {member.user.username || "Unknown"}
                      {isSelf && <span className="text-xs bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full font-semibold">You</span>}
                    </p>
                    <p className="text-sm text-neutral-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative">
                  
                  {isOwner && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Owner
                    </span>
                  )}
                  {!isOwner && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 capitalize">
                      {member.role}
                    </span>
                  )}

                  {canManageMembers && !isSelf && !isOwner && (
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setActiveMenuId(activeMenuId === member.user._id ? null : member.user._id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {/* Simple Dropdown Menu */}
                      {activeMenuId === member.user._id && (
                        <div className="absolute right-0 top-10 z-10 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          <button
                            onClick={() => handleRoleChange(member.user._id, "admin")}
                            className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          >
                            <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" /> Make Admin
                          </button>
                          <button
                            onClick={() => handleRoleChange(member.user._id, "member")}
                            className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" /> Make Member
                          </button>
                          <button
                            onClick={() => handleRoleChange(member.user._id, "viewer")}
                            className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          >
                            <Shield className="mr-2 h-4 w-4 text-blue-500" /> Make Viewer
                          </button>
                          <hr className="my-1 border-neutral-200" />
                          <button
                            onClick={() => handleRemoveMember(member.user._id)}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <UserX className="mr-2 h-4 w-4 text-red-600" /> Remove Member
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Even if not admin, users can remove themselves unless they are owner */}
                  {!canManageMembers && isSelf && !isOwner && (
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveMember(member.user._id)}
                      >
                       Leave Workspace
                     </Button>
                  )}

                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
