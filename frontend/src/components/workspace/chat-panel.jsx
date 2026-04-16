import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Send,
  Smile,
  Paperclip,
  Search,
  Plus,
  Hash,
  User,
  Users,
  MoreVertical,
  Loader2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDispatch, useSelector } from "react-redux"
import { useWs } from "@/context/WebSocketProvider"
import {
  fetchMyChats,
  createChat,
  fetchMessages,
} from "@/features/chat/chatThunks"
import {
  setActiveChat,
  clearActiveChat,
} from "@/features/chat/chatSlice"

// ── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "long" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function getChatDisplayName(chat, currentUserId) {
  if (chat.type === "channel") {
    return chat.name || "Unnamed Channel"
  }
  // DM — show the other person's name
  const other = chat.members?.find((m) => {
    const id = typeof m === "object" ? m._id : m
    return id !== currentUserId
  })
  if (typeof other === "object") return other.username || "Unknown"
  return "Direct Message"
}

function getChatAvatar(chat, currentUserId) {
  if (chat.type === "channel") return "#"
  const name = getChatDisplayName(chat, currentUserId)
  return getInitials(name)
}

function getLastMessagePreview(chat) {
  if (!chat.lastMessage) return "No messages yet"
  const sender =
    typeof chat.lastMessage.sender === "object"
      ? chat.lastMessage.sender.username
      : ""
  return sender
    ? `${sender}: ${chat.lastMessage.content}`
    : chat.lastMessage.content
}

// ── Sub-components ────────────────────────────────────────────────────────

function ConversationList({ conversations, activeConvoId, onSelect, type, currentUserId, onlineUserIds }) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
        <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
          {type === "dm" ? <User className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
        </div>
        <p className="text-sm font-medium text-neutral-500">
          {type === "dm" ? "No conversations yet" : "No channels yet"}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Click the button below to start
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((convo) => {
        const displayName = getChatDisplayName(convo, currentUserId)
        const avatar = getChatAvatar(convo, currentUserId)
        const lastMsg = getLastMessagePreview(convo)
        const timestamp = formatTime(convo.updatedAt)

        // Check if the other DM member is online
        let isOnline = false
        if (type === "dm") {
          const other = convo.members?.find((m) => {
            const id = typeof m === "object" ? m._id : m
            return id !== currentUserId
          })
          const otherId = typeof other === "object" ? other._id : other
          isOnline = onlineUserIds.has(otherId)
        }

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
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                    activeConvoId === convo._id
                      ? "bg-indigo-600"
                      : "bg-neutral-400"
                  )}
                >
                  {avatar}
                </div>
              ) : (
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold",
                    activeConvoId === convo._id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-neutral-100 text-neutral-500"
                  )}
                >
                  #
                </div>
              )}
              {type === "dm" && isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    "text-neutral-700"
                  )}
                >
                  {displayName}
                </span>
                <span className="text-[10px] text-neutral-400 ml-2 flex-shrink-0">
                  {timestamp}
                </span>
              </div>
              <p className="text-xs text-neutral-500 truncate mt-0.5">
                {lastMsg}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MessageBubble({ msg, prevMsg, currentUserId }) {
  const isCurrentUser =
    (typeof msg.sender === "object" ? msg.sender._id : msg.sender) ===
    currentUserId
  const senderName =
    typeof msg.sender === "object" ? msg.sender.username : "You"
  const avatar = getInitials(senderName)
  const showAvatar =
    !prevMsg ||
    (typeof prevMsg.sender === "object" ? prevMsg.sender._id : prevMsg.sender) !==
      (typeof msg.sender === "object" ? msg.sender._id : msg.sender)

  return (
    <div className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}>
      {showAvatar ? (
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0",
            isCurrentUser ? "bg-indigo-600" : "bg-neutral-400"
          )}
        >
          {avatar}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("max-w-[65%]", isCurrentUser && "text-right")}>
        {showAvatar && (
          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              isCurrentUser && "justify-end"
            )}
          >
            <span className="text-xs font-semibold text-neutral-700">
              {isCurrentUser ? "You" : senderName}
            </span>
            <span className="text-[10px] text-neutral-400">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isCurrentUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
          )}
        >
          {msg.content}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator({ typingUsers, currentUserId }) {
  const others = typingUsers.filter((u) => u.userId !== currentUserId)
  if (others.length === 0) return null

  const names = others.map((u) => u.username).join(", ")
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-neutral-500 italic">
        {names} {others.length === 1 ? "is" : "are"} typing…
      </span>
    </div>
  )
}

// ── New Chat Modal ───────────────────────────────────────────────────────

function NewChatModal({ isOpen, onClose, chatMode, workspaceMembers, onSubmit }) {
  const [selectedMembers, setSelectedMembers] = useState([])
  const [channelName, setChannelName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  if (!isOpen) return null

  const filteredMembers = workspaceMembers.filter((m) =>
    m.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleMember = (memberId) => {
    if (chatMode === "dm") {
      // DMs: only one member
      setSelectedMembers([memberId])
    } else {
      setSelectedMembers((prev) =>
        prev.includes(memberId)
          ? prev.filter((id) => id !== memberId)
          : [...prev, memberId]
      )
    }
  }

  const handleSubmit = () => {
    if (selectedMembers.length === 0) return
    if (chatMode === "channel" && !channelName.trim()) return
    onSubmit({
      type: chatMode === "dm" ? "dm" : "channel",
      name: channelName.trim(),
      members: selectedMembers,
    })
    setSelectedMembers([])
    setChannelName("")
    setSearchQuery("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">
            {chatMode === "dm" ? "New Direct Message" : "New Channel"}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channel name */}
        {chatMode === "channel" && (
          <div className="px-5 pt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Channel Name
            </label>
            <Input
              placeholder="e.g. general, engineering"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        )}

        {/* Member search */}
        <div className="px-5 pt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {chatMode === "dm" ? "Select a member" : "Add members"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1 min-h-0 max-h-[300px]">
          {filteredMembers.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              No members found
            </p>
          ) : (
            filteredMembers.map((member) => {
              const isSelected = selectedMembers.includes(member._id)
              return (
                <button
                  key={member._id}
                  onClick={() => handleToggleMember(member._id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                    isSelected
                      ? "bg-indigo-50 border border-indigo-200"
                      : "hover:bg-neutral-100"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                      isSelected ? "bg-indigo-600" : "bg-neutral-400"
                    )}
                  >
                    {getInitials(member.username)}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-neutral-700">
                      {member.username}
                    </span>
                    {member.email && (
                      <p className="text-xs text-neutral-400">{member.email}</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedMembers.length === 0 ||
              (chatMode === "channel" && !channelName.trim())
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-sm"
          >
            {chatMode === "dm" ? "Start Chat" : "Create Channel"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main ChatPanel ───────────────────────────────────────────────────────

export function ChatPanel() {
  const dispatch = useDispatch()
  const ws = useWs()

  // Redux state
  const currentUser = useSelector((state) => state.auth.user)
  const currentWorkspace = useSelector(
    (state) => state.workspace.currentWorkspace
  )
  const {
    chats,
    chatsLoading,
    activeChat,
    messagesByChat,
    messagesLoading,
    onlineUsers,
    typingUsers,
  } = useSelector((state) => state.chat)

  const currentUserId = currentUser?._id || currentUser?.userId

  // Local state
  const [chatMode, setChatMode] = useState("dm") // "dm" | "channel"
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const bottomRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const prevChatIdRef = useRef(null)

  // Derived
  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.map((u) => u.userId)),
    [onlineUsers]
  )

  const filteredChats = useMemo(() => {
    const byType = chats.filter((c) =>
      chatMode === "dm" ? c.type === "dm" : c.type === "channel"
    )
    if (!searchQuery.trim()) return byType
    return byType.filter((c) => {
      const name = getChatDisplayName(c, currentUserId)
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [chats, chatMode, searchQuery, currentUserId])

  const currentMessages = activeChat
    ? messagesByChat[activeChat._id] || []
    : []

  const currentTypingUsers = activeChat
    ? typingUsers[activeChat._id] || []
    : []

  // Workspace members (for new chat modal)
  const workspaceMembers = useMemo(() => {
    if (!currentWorkspace?.members) return []
    return currentWorkspace.members
      .map((m) => (typeof m.user === "object" ? m.user : { _id: m.user }))
      .filter((m) => m._id !== currentUserId)
  }, [currentWorkspace, currentUserId])

  // ── Effects ────────────────────────────────────────────────────────────

  // Fetch chats on mount / workspace change
  useEffect(() => {
    dispatch(
      fetchMyChats({
        workspaceId: currentWorkspace?._id,
      })
    )
  }, [dispatch, currentWorkspace])

  // When active chat changes: fetch messages + join/leave rooms
  useEffect(() => {
    if (activeChat?._id) {
      dispatch(fetchMessages({ chatId: activeChat._id }))

      // Leave previous room
      if (prevChatIdRef.current && prevChatIdRef.current !== activeChat._id) {
        ws.leaveRoom(prevChatIdRef.current)
      }
      // Join new room
      ws.joinRoom(activeChat._id)
      prevChatIdRef.current = activeChat._id
    }

    return () => {
      // Don't leave on unmount — we might re-mount
    }
  }, [activeChat?._id, dispatch, ws])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages.length])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSelectConvo = useCallback(
    (chat) => {
      dispatch(setActiveChat(chat))
    },
    [dispatch]
  )

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !activeChat) return

    // Send via WebSocket for real-time delivery
    ws.sendChatMessage(activeChat._id, message.trim())

    // Stop typing indicator
    ws.stopTyping(activeChat._id)
    clearTimeout(typingTimeoutRef.current)

    setMessage("")
  }, [message, activeChat, ws])

  const handleInputChange = useCallback(
    (e) => {
      setMessage(e.target.value)

      if (!activeChat) return

      // Send typing indicator (debounced)
      ws.sendTyping(activeChat._id)

      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        ws.stopTyping(activeChat._id)
      }, 2000)
    },
    [activeChat, ws]
  )

  const handleCreateChat = useCallback(
    async ({ type, name, members }) => {
      dispatch(
        createChat({
          type,
          name,
          members,
          workspaceId: currentWorkspace?._id,
        })
      )
    },
    [dispatch, currentWorkspace]
  )

  const handleSwitchMode = useCallback(
    (mode) => {
      setChatMode(mode)
      dispatch(clearActiveChat())
    },
    [dispatch]
  )

  // ── Render ─────────────────────────────────────────────────────────────

  const displayName = activeChat
    ? getChatDisplayName(activeChat, currentUserId)
    : ""
  const displayAvatar = activeChat
    ? getChatAvatar(activeChat, currentUserId)
    : ""

  // Online status for active DM
  let activeChatOnline = false
  if (activeChat?.type === "dm") {
    const other = activeChat.members?.find((m) => {
      const id = typeof m === "object" ? m._id : m
      return id !== currentUserId
    })
    const otherId = typeof other === "object" ? other._id : other
    activeChatOnline = onlineUserIds.has(otherId)
  }

  return (
    <div className="flex h-full bg-neutral-50">
      {/* ── LEFT: Conversation List ── */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900">Messages</h2>
            {/* Connection indicator */}
            <div className="flex items-center gap-1.5">
              {ws.isConnected?.current ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-red-400" />
              )}
              <span className="text-[10px] text-neutral-400">
                {ws.isConnected?.current ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          {/* DM / Group Tabs */}
          <div className="flex bg-neutral-100 rounded-lg p-1 mb-3">
            <button
              onClick={() => handleSwitchMode("dm")}
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
              onClick={() => handleSwitchMode("channel")}
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

          {/* Search */}
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2">
          {chatsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <ConversationList
              conversations={filteredChats}
              activeConvoId={activeChat?._id}
              onSelect={handleSelectConvo}
              type={chatMode}
              currentUserId={currentUserId}
              onlineUserIds={onlineUserIds}
            />
          )}
        </div>

        {/* New Conversation Button */}
        <div className="p-3 border-t border-neutral-100">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={() => setShowNewChatModal(true)}
          >
            <Plus className="h-4 w-4" />
            {chatMode === "dm" ? "New Message" : "New Channel"}
          </Button>
        </div>
      </div>

      {/* ── RIGHT: Message Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeChat ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
              {chatMode === "dm" ? (
                <User className="h-8 w-8" />
              ) : (
                <Hash className="h-8 w-8" />
              )}
            </div>
            <p className="text-lg font-medium text-neutral-500">
              {chatMode === "dm"
                ? "Select a conversation"
                : "Select a channel"}
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
                {activeChat.type === "dm" ? (
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                      {displayAvatar}
                    </div>
                    {activeChatOnline && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                    #
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    {displayName}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {activeChat.type === "dm"
                      ? activeChatOnline
                        ? "Online"
                        : "Offline"
                      : `${activeChat.members?.length || 0} members`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-500"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-500"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <p className="text-sm">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="inline-block text-[10px] text-neutral-400 bg-neutral-100 rounded-full px-3 py-1">
                      Start of conversation
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

              {/* Typing indicator */}
              <TypingIndicator
                typingUsers={currentTypingUsers}
                currentUserId={currentUserId}
              />

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-neutral-200 bg-white px-6 py-3">
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-neutral-500 hover:text-neutral-700 flex-shrink-0"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSendMessage())
                    }
                    placeholder={`Message ${displayName}...`}
                    className="pr-10 h-10 text-sm"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <Smile className="h-5 w-5" />
                  </button>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New Chat Modal ── */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        chatMode={chatMode === "dm" ? "dm" : "channel"}
        workspaceMembers={workspaceMembers}
        onSubmit={handleCreateChat}
      />
    </div>
  )
}