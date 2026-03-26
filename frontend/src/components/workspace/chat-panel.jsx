import { useState, useRef, useEffect } from "react"
import { Send, Smile, Paperclip, Search, Plus, Hash, User, Users, ArrowLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ── Mock Data ──────────────────────────────────────────────────────────────
const mockConversations = {
  dm: [
    { id: "dm-1", name: "Sarah Chen", avatar: "SC", lastMessage: "I'll review the timeline today.", timestamp: "10:35 AM", unread: 2, online: true },
    { id: "dm-2", name: "Mike Johnson", avatar: "MJ", lastMessage: "How about tomorrow at 2 PM?", timestamp: "10:42 AM", unread: 0, online: true },
    { id: "dm-3", name: "Emily Davis", avatar: "ED", lastMessage: "Sounds good, thanks!", timestamp: "Yesterday", unread: 0, online: false },
    { id: "dm-4", name: "Alex Kim", avatar: "AK", lastMessage: "Check the latest PRs please.", timestamp: "Monday", unread: 1, online: false },
  ],
  group: [
    { id: "grp-1", name: "General", icon: "#", lastMessage: "Sarah: Meeting notes uploaded.", timestamp: "11:00 AM", unread: 5, memberCount: 12 },
    { id: "grp-2", name: "Engineering", icon: "#", lastMessage: "Mike: Build is passing ✓", timestamp: "10:50 AM", unread: 0, memberCount: 6 },
    { id: "grp-3", name: "Design", icon: "#", lastMessage: "Emily: New mockups in Figma.", timestamp: "9:30 AM", unread: 3, memberCount: 4 },
    { id: "grp-4", name: "Random", icon: "#", lastMessage: "Alex: Check this out!", timestamp: "Yesterday", unread: 0, memberCount: 12 },
  ],
}

const mockMessagesByConvo = {
  "dm-1": [
    { id: "1", sender: "Sarah Chen", avatar: "SC", content: "Hey! I've updated the Product Roadmap board with Q2 goals.", timestamp: "10:32 AM", isCurrentUser: false },
    { id: "2", sender: "You", avatar: "JD", content: "Thanks Sarah! I'll review the timeline today.", timestamp: "10:35 AM", isCurrentUser: true },
    { id: "3", sender: "Sarah Chen", avatar: "SC", content: "Also, can you check the sprint velocity data?", timestamp: "10:36 AM", isCurrentUser: false },
    { id: "4", sender: "Sarah Chen", avatar: "SC", content: "I think we might need to adjust the Q2 capacity.", timestamp: "10:36 AM", isCurrentUser: false },
  ],
  "dm-2": [
    { id: "1", sender: "Mike Johnson", avatar: "MJ", content: "Should we schedule a quick sync to discuss the marketing campaign board?", timestamp: "10:42 AM", isCurrentUser: false },
    { id: "2", sender: "You", avatar: "JD", content: "Good idea. How about tomorrow at 2 PM?", timestamp: "10:45 AM", isCurrentUser: true },
  ],
  "grp-1": [
    { id: "1", sender: "Sarah Chen", avatar: "SC", content: "Hey everyone, the sprint retro notes are uploaded to the board.", timestamp: "10:55 AM", isCurrentUser: false },
    { id: "2", sender: "Mike Johnson", avatar: "MJ", content: "Thanks! I'll add my comments later today.", timestamp: "10:58 AM", isCurrentUser: false },
    { id: "3", sender: "You", avatar: "JD", content: "Great work on the demo yesterday, team!", timestamp: "11:00 AM", isCurrentUser: true },
    { id: "4", sender: "Emily Davis", avatar: "ED", content: "🎉 Agreed! Let's keep the momentum going.", timestamp: "11:02 AM", isCurrentUser: false },
  ],
  "grp-2": [
    { id: "1", sender: "Mike Johnson", avatar: "MJ", content: "The CI pipeline build is passing now ✓", timestamp: "10:48 AM", isCurrentUser: false },
    { id: "2", sender: "You", avatar: "JD", content: "Nice, I'll merge the PR then.", timestamp: "10:50 AM", isCurrentUser: true },
  ],
}

// ── Sub-components ────────────────────────────────────────────────────────

function ConversationList({ conversations, activeConvoId, onSelect, type }) {
  return (
    <div className="space-y-1">
      {conversations.map((convo) => (
        <button
          key={convo.id}
          onClick={() => onSelect(convo)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
            activeConvoId === convo.id
              ? "bg-indigo-50 border border-indigo-200"
              : "hover:bg-neutral-100"
          )}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {type === "dm" ? (
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                activeConvoId === convo.id ? "bg-indigo-600" : "bg-neutral-400"
              )}>
                {convo.avatar}
              </div>
            ) : (
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold",
                activeConvoId === convo.id ? "bg-indigo-100 text-indigo-600" : "bg-neutral-100 text-neutral-500"
              )}>
                #
              </div>
            )}
            {type === "dm" && convo.online && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={cn("text-sm font-medium truncate", convo.unread > 0 ? "text-neutral-900" : "text-neutral-700")}>
                {convo.name}
              </span>
              <span className="text-[10px] text-neutral-400 ml-2 flex-shrink-0">{convo.timestamp}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-neutral-500 truncate">{convo.lastMessage}</p>
              {convo.unread > 0 && (
                <span className="ml-2 flex-shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                  {convo.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}


function MessageBubble({ msg, prevMsg }) {
  const showAvatar = !prevMsg || prevMsg.sender !== msg.sender

  return (
    <div className={cn("flex gap-3", msg.isCurrentUser && "flex-row-reverse")}>
      {showAvatar ? (
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0",
          msg.isCurrentUser ? "bg-indigo-600" : "bg-neutral-400"
        )}>
          {msg.avatar}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("max-w-[65%]", msg.isCurrentUser && "text-right")}>
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-neutral-700">{msg.sender}</span>
            <span className="text-[10px] text-neutral-400">{msg.timestamp}</span>
          </div>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          msg.isCurrentUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
        )}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}


// ── Main ChatPanel ───────────────────────────────────────────────────────
export function ChatPanel() {
  const [chatMode, setChatMode] = useState("dm") // "dm" | "group"
  const [activeConvo, setActiveConvo] = useState(null)
  const [message, setMessage] = useState("")
  const [allMessages, setAllMessages] = useState(mockMessagesByConvo)
  const [searchQuery, setSearchQuery] = useState("")
  const bottomRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages, activeConvo])

  const conversations = mockConversations[chatMode] || []
  const filteredConvos = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const currentMessages = activeConvo ? (allMessages[activeConvo.id] || []) : []

  const handleSendMessage = () => {
    if (!message.trim() || !activeConvo) return

    const newMsg = {
      id: Date.now().toString(),
      sender: "You",
      avatar: "JD",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCurrentUser: true,
    }

    setAllMessages((prev) => ({
      ...prev,
      [activeConvo.id]: [...(prev[activeConvo.id] || []), newMsg],
    }))
    setMessage("")
  }

  return (
    <div className="flex h-full bg-neutral-50">
      {/* ── LEFT: Conversation List ── */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Messages</h2>
          
          {/* DM / Group Tabs */}
          <div className="flex bg-neutral-100 rounded-lg p-1 mb-3">
            <button
              onClick={() => { setChatMode("dm"); setActiveConvo(null) }}
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
              onClick={() => { setChatMode("group"); setActiveConvo(null) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                chatMode === "group"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Groups
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder={`Search ${chatMode === "dm" ? "people" : "groups"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-neutral-50 border-neutral-200"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2">
          <ConversationList
            conversations={filteredConvos}
            activeConvoId={activeConvo?.id}
            onSelect={setActiveConvo}
            type={chatMode}
          />
        </div>

        {/* New Conversation Button */}
        <div className="p-3 border-t border-neutral-100">
          <Button variant="outline" className="w-full justify-center gap-2 text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Plus className="h-4 w-4" />
            {chatMode === "dm" ? "New Message" : "New Group"}
          </Button>
        </div>
      </div>

      {/* ── RIGHT: Message Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConvo ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
              {chatMode === "dm" ? <User className="h-8 w-8" /> : <Hash className="h-8 w-8" />}
            </div>
            <p className="text-lg font-medium text-neutral-500">
              {chatMode === "dm" ? "Select a conversation" : "Select a group"}
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
                {chatMode === "dm" ? (
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                      {activeConvo.avatar}
                    </div>
                    {activeConvo.online && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                    #
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">{activeConvo.name}</h3>
                  <p className="text-xs text-neutral-500">
                    {chatMode === "dm"
                      ? (activeConvo.online ? "Online" : "Offline")
                      : `${activeConvo.memberCount || 0} members`
                    }
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
              <div className="text-center">
                <span className="inline-block text-[10px] text-neutral-400 bg-neutral-100 rounded-full px-3 py-1">Today</span>
              </div>

              {currentMessages.map((msg, idx) => (
                <MessageBubble key={msg.id} msg={msg} prevMsg={currentMessages[idx - 1]} />
              ))}

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
                    placeholder={`Message ${activeConvo.name}...`}
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
    </div>
  )
}