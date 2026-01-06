import { useState, useRef, useEffect } from "react"
import { Send, Smile, Paperclip, MoreVertical, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const mockMessages = [
  {
    id: "1",
    sender: "Sarah Chen",
    avatar: "SC",
    content: "Hey team! I've updated the Product Roadmap board with Q2 goals.",
    timestamp: "10:32 AM",
    isCurrentUser: false,
  },
  {
    id: "2",
    sender: "You",
    avatar: "JD",
    content: "Thanks Sarah! I'll review the timeline today.",
    timestamp: "10:35 AM",
    isCurrentUser: true,
  },
  {
    id: "3",
    sender: "Mike Johnson",
    avatar: "MJ",
    content: "Should we schedule a quick sync to discuss the marketing campaign board?",
    timestamp: "10:42 AM",
    isCurrentUser: false,
  },
  {
    id: "4",
    sender: "You",
    avatar: "JD",
    content: "Good idea. How about tomorrow at 2 PM?",
    timestamp: "10:45 AM",
    isCurrentUser: true,
  },
  {
    id: "5",
    sender: "Sarah Chen",
    avatar: "SC",
    content: "Works for me! I'll send out a calendar invite.",
    timestamp: "10:47 AM",
    isCurrentUser: false,
  },
]


export function ChatPanel() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [isTyping, setIsTyping] = useState(false)

  const bottomRef = useRef(null)

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return

    setIsTyping(false)

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        avatar: "JD",
        content: message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCurrentUser: true,
      },
    ])

    setMessage("")
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Team Chat</h3>
          <p className="text-xs text-neutral-500">5 members online</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="mx-auto text-xs text-neutral-400">Today</div>

        {messages.map((msg, idx) => {
          const prev = messages[idx - 1]
          const showAvatar = !prev || prev.sender !== msg.sender

          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.isCurrentUser && "flex-row-reverse"
              )}
            >
              {showAvatar ? (
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white",
                    msg.isCurrentUser ? "bg-indigo-600" : "bg-neutral-400"
                  )}
                >
                  {msg.avatar}
                </div>
              ) : (
                <div className="w-8" />
              )}

              <div className={cn("max-w-[70%]", msg.isCurrentUser && "text-right")}>
                {showAvatar && (
                  <div className="text-xs font-medium mb-1">
                    {msg.sender}
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm leading-relaxed",
                    msg.isCurrentUser
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-neutral-100 rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="text-xs text-neutral-400">Someone is typing…</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setIsTyping(true)
            }}
            placeholder="Type a message…"
            rows={1}
            className="resize-none"
          />

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}