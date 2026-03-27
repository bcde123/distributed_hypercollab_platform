import { useState, useRef, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Send, Smile, Paperclip, Search, Plus, Hash, User, Users, MoreVertical, Loader2, Lock, LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { fetchWorkspaceChats, fetchMessages, sendMessage, createChat, deriveSharedSecret } from "@/features/chat/chatThunk"
import { setActiveConversation } from "@/features/chat/chatSlice"
import { hasSharedSecret } from "@/crypto/keyStore"

// ── Sub-components ────────────────────────────────────────────────────────

function ConversationList({ conversations, activeConvoId, onSelect, type, currentUserId }) {
  const getDisplayName = (convo) => {
    if (type === "channel") return convo.name || "Unnamed Channel"
    const other = convo.members?.find((m) => {
      const memberId = typeof m === "object" ? m._id : m
      return memberId !== currentUserId
    })
    if (other && typeof other === "object") return other.username || other.email || "Unknown"
    return "Direct Message"
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-1">
      {conversations.map((convo) => {
        const displayName = getDisplayName(convo)
        const initials = getInitials(displayName)

        return (
          <button
            key={convo._id}
            onClick={() => onSelect(convo)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
              activeConvoId === convo._id
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-neutral-100"
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {type === "dm" ? (
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                  activeConvoId === convo._id ? "bg-indigo-600" : "bg-neutral-400"
                )}>
                  {initials}
                </div>
              ) : (
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold",
                  activeConvoId === convo._id ? "bg-indigo-100 text-indigo-600" : "bg-neutral-100 text-neutral-500"
                )}>
                  #
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate text-neutral-700">
                  {displayName}
                </span>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {convo.isEncrypted && (
                    <Lock className="h-3 w-3 text-emerald-500" />
                  )}
                  <span className="text-[10px] text-neutral-400">
                    {convo.updatedAt
                      ? new Date(convo.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 truncate">
                {convo.isEncrypted ? "🔒 Encrypted" : `${convo.members?.length || 0} member${convo.members?.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}


function MessageBubble({ msg, prevMsg, currentUserId }) {
  const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender
  const isCurrentUser = senderId === currentUserId
  const senderName = typeof msg.sender === "object" ? (msg.sender.username || msg.sender.email || "Unknown") : "Unknown"
  const initials = senderName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  const prevSenderId = prevMsg ? (typeof prevMsg.sender === "object" ? prevMsg.sender._id : prevMsg.sender) : null
  const showAvatar = !prevMsg || prevSenderId !== senderId

  return (
    <div className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}>
      {showAvatar ? (
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0",
          isCurrentUser ? "bg-indigo-600" : "bg-neutral-400"
        )}>
          {initials}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("max-w-[65%]", isCurrentUser && "text-right")}>
        {showAvatar && (
          <div className={cn("flex items-center gap-2 mb-1", isCurrentUser && "flex-row-reverse")}>
            <span className="text-xs font-semibold text-neutral-700">{isCurrentUser ? "You" : senderName}</span>
            <span className="text-[10px] text-neutral-400">
              {msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : ""}
            </span>
          </div>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isCurrentUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
        )}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}


// ── Create Chat Modal ─────────────────────────────────────────────────────
function CreateChatModal({ isOpen, onClose, onSubmit, type, workspaceMembers, currentUserId }) {
  const [selectedMembers, setSelectedMembers] = useState([])
  const [channelName, setChannelName] = useState("")

  if (!isOpen) return null

  const otherMembers = workspaceMembers.filter((m) => {
    const id = typeof m.user === "object" ? m.user._id : m.user
    return id !== currentUserId
  })

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : type === "dm"
          ? [memberId]
          : [...prev, memberId]
    )
  }

  const handleSubmit = () => {
    if (selectedMembers.length === 0) return
    onSubmit({ members: selectedMembers, name: channelName })
    setSelectedMembers([])
    setChannelName("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">
            {type === "dm" ? "New Direct Message" : "New Channel"}
          </h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            {type === "dm"
              ? "Select a member — messages will be end-to-end encrypted 🔒"
              : "Create a group channel"}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {type === "channel" && (
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1 block">Channel Name</label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. General, Design, Engineering..."
                className="h-10"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              {type === "dm" ? "Select Member" : "Add Members"}
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg p-2">
              {otherMembers.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">No other members in this workspace</p>
              )}
              {otherMembers.map((member) => {
                const user = typeof member.user === "object" ? member.user : { _id: member.user }
                const name = user.username || user.email || "Unknown"
                const initials = name.slice(0, 2).toUpperCase()
                const isSelected = selectedMembers.includes(user._id)

                return (
                  <button
                    key={user._id}
                    onClick={() => toggleMember(user._id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all",
                      isSelected ? "bg-indigo-50 border border-indigo-200" : "hover:bg-neutral-50"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                      isSelected ? "bg-indigo-600" : "bg-neutral-400"
                    )}>
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{name}</span>
                    {isSelected && (
                      <span className="ml-auto text-indigo-600 text-xs font-semibold">Selected</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={selectedMembers.length === 0 || (type === "channel" && !channelName.trim())}
            onClick={handleSubmit}
          >
            {type === "dm" ? "Start Encrypted Chat 🔒" : "Create Channel"}
          </Button>
        </div>
      </div>
    </div>
  )
}


// ── Main ChatPanel ───────────────────────────────────────────────────────
export function ChatPanel() {
  const dispatch = useDispatch()
  const [chatMode, setChatMode] = useState("dm")
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [keyDeriving, setKeyDeriving] = useState(false)
  const bottomRef = useRef(null)

  // Redux state
  const currentUser = useSelector((state) => state.auth.user)
  const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace)
  const { conversations, activeConversation, messagesByChat, isLoading, messagesLoading, sendingMessage } =
    useSelector((state) => state.chat)

  const currentUserId = currentUser?._id

  // ── Fetch chats when workspace changes ──────────────────────────────
  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(fetchWorkspaceChats(currentWorkspace._id))
    }
  }, [dispatch, currentWorkspace?._id])

  // ── Derive shared secret + fetch messages when conversation changes ──
  useEffect(() => {
    if (!activeConversation?._id) return

    const loadChat = async () => {
      // For encrypted DMs: derive shared secret if not cached
      if (activeConversation.isEncrypted && !hasSharedSecret(activeConversation._id)) {
        setKeyDeriving(true)
        await deriveSharedSecret(activeConversation, currentUserId)
        setKeyDeriving(false)
      }

      // Fetch messages (thunk handles decryption)
      dispatch(fetchMessages({
        chatId: activeConversation._id,
        isEncrypted: activeConversation.isEncrypted || false,
      }))
    }

    loadChat()
  }, [dispatch, activeConversation?._id, currentUserId])

  // ── Auto-scroll ─────────────────────────────────────────────────────
  const currentMessages = activeConversation ? (messagesByChat[activeConversation._id] || []) : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages.length])

  // ── Filter conversations ────────────────────────────────────────────
  const chatType = chatMode === "dm" ? "dm" : "channel"
  const filteredConvos = conversations
    .filter((c) => c.type === chatType)
    .filter((c) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      if (c.type === "channel") return (c.name || "").toLowerCase().includes(query)
      const otherMember = c.members?.find((m) => {
        const id = typeof m === "object" ? m._id : m
        return id !== currentUserId
      })
      const name = otherMember && typeof otherMember === "object" ? (otherMember.username || otherMember.email || "") : ""
      return name.toLowerCase().includes(query)
    })

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSelectConvo = (convo) => {
    dispatch(setActiveConversation(convo))
  }

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation?._id || sendingMessage) return
    dispatch(sendMessage({
      chatId: activeConversation._id,
      content: message.trim(),
      isEncrypted: activeConversation.isEncrypted || false,
    }))
    setMessage("")
  }

  const handleCreateChat = ({ members, name }) => {
    if (!currentWorkspace?._id) return
    dispatch(
      createChat({
        type: chatType,
        workspaceId: currentWorkspace._id,
        members,
        name,
      })
    )
  }

  // ── Display name helpers ────────────────────────────────────────────
  const getConvoDisplayName = (convo) => {
    if (!convo) return ""
    if (convo.type === "channel") return convo.name || "Unnamed Channel"
    const other = convo.members?.find((m) => {
      const id = typeof m === "object" ? m._id : m
      return id !== currentUserId
    })
    return other && typeof other === "object" ? (other.username || other.email || "Unknown") : "Direct Message"
  }

  const getConvoInitials = (convo) => {
    const name = getConvoDisplayName(convo)
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex h-full bg-neutral-50">
      {/* ── LEFT: Conversation List ── */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Messages</h2>

          <div className="flex bg-neutral-100 rounded-lg p-1 mb-3">
            <button
              onClick={() => { setChatMode("dm"); dispatch(setActiveConversation(null)) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                chatMode === "dm"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <User className="h-3.5 w-3.5" />
              Direct
            </button>
            <button
              onClick={() => { setChatMode("channel"); dispatch(setActiveConversation(null)) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                chatMode === "channel"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Channels
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder={`Search ${chatMode === "dm" ? "people" : "channels"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-neutral-50 border-neutral-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-400">
                {searchQuery
                  ? "No results found"
                  : chatMode === "dm"
                    ? "No conversations yet"
                    : "No channels yet"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Click the button below to get started
              </p>
            </div>
          ) : (
            <ConversationList
              conversations={filteredConvos}
              activeConvoId={activeConversation?._id}
              onSelect={handleSelectConvo}
              type={chatMode}
              currentUserId={currentUserId}
            />
          )}
        </div>

        <div className="p-3 border-t border-neutral-100">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {chatMode === "dm" ? "New Message" : "New Channel"}
          </Button>
        </div>
      </div>

      {/* ── RIGHT: Message Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
              {chatMode === "dm" ? <User className="h-8 w-8" /> : <Hash className="h-8 w-8" />}
            </div>
            <p className="text-lg font-medium text-neutral-500">
              {chatMode === "dm" ? "Select a conversation" : "Select a channel"}
            </p>
            <p className="text-sm text-neutral-400">
              Choose from the left panel to start chatting
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white">
              <div className="flex items-center gap-3">
                {activeConversation.type === "dm" ? (
                  <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                    {getConvoInitials(activeConversation)}
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                    #
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-1.5">
                    {getConvoDisplayName(activeConversation)}
                    {activeConversation.isEncrypted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <Lock className="h-2.5 w-2.5" />
                        E2E
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {activeConversation.members?.length || 0} member{activeConversation.members?.length !== 1 ? "s" : ""}
                    {activeConversation.isEncrypted && " · Kyber768 + AES-GCM"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {keyDeriving ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  <p className="text-sm text-neutral-500">Deriving encryption key...</p>
                </div>
              ) : messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-400">
                    {activeConversation.isEncrypted
                      ? "🔒 This conversation is end-to-end encrypted. Say hello!"
                      : "No messages yet. Say hello! 👋"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="inline-block text-[10px] text-neutral-400 bg-neutral-100 rounded-full px-3 py-1">
                      {activeConversation.isEncrypted
                        ? "🔒 Messages are end-to-end encrypted"
                        : "Beginning of conversation"}
                    </span>
                  </div>

                  {currentMessages.map((msg, idx) => (
                    <MessageBubble
                      key={msg._id}
                      msg={msg}
                      prevMsg={currentMessages[idx - 1]}
                      currentUserId={currentUserId}
                    />
                  ))}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-neutral-200 bg-white px-6 py-3">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:text-neutral-700 flex-shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder={`${activeConversation.isEncrypted ? "🔒 " : ""}Message ${getConvoDisplayName(activeConversation)}...`}
                    className="pr-10 h-10 text-sm"
                    disabled={sendingMessage}
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <Smile className="h-5 w-5" />
                  </button>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendingMessage}
                  className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 flex-shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Chat Modal */}
      <CreateChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChat}
        type={chatMode}
        workspaceMembers={currentWorkspace?.members || []}
        currentUserId={currentUserId}
      />
    </div>
  )
}