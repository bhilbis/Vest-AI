'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Bot,
  X,
  Send,
  Plus,
  User,
  Minimize2,
  Maximize2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { AI_MODELS } from '@/app/api/data'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
}

interface MessagesPanelProps {
  isOpen: boolean
  onClose: () => void
  position: 'left' | 'right'
}

interface AIResponse {
  content?: string
}

export function MessagesPanel({ isOpen, onClose, position }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Halo! Saya asisten keuangan Anda. Saya bisa membantu analisis pengeluaran, saran budget, atau ringkasan keuangan. Apa yang ingin Anda ketahui?',
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(Object.keys(AI_MODELS)[0])
  const [isExpanded, setIsExpanded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  async function handleSend() {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Gagal memuat respon AI')
      }

      const data = (await res.json()) as AIResponse

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content ?? 'Tidak ada respon dari AI.',
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Terjadi kesalahan.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  function startNewChat() {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Chat baru dimulai. Ada yang bisa saya bantu?',
        timestamp: new Date(),
      },
    ])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: position === 'left' ? -400 : 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: position === 'left' ? -400 : 400 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden",
            "border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40",
            // Scoped container: fixed height, no double scrollbar
            "top-4 bottom-4",
            position === 'left' ? 'left-4' : 'right-4',
            isExpanded
              ? 'w-[calc(100vw-2rem)] md:w-[600px] max-h-[calc(100vh-2rem)]'
              : 'w-[calc(100vw-2rem)] md:w-[380px] max-h-[80vh]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Bot size={16} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Financial Assistant</p>
                <p className="text-[10px] text-zinc-500">AI-powered · Read-only</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={startNewChat}
                className="h-7 w-7 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages — scoped scroll container */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx === messages.length - 1 ? 0.05 : 0 }}
                className={cn("flex gap-2.5", msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                      <Bot size={12} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[80%] space-y-0.5", msg.role === 'user' ? 'items-end flex flex-col' : '')}>
                  <div
                    className={cn(
                      "px-3 py-2 text-[13px] leading-relaxed rounded-xl",
                      msg.role === 'user'
                        ? 'bg-zinc-700 text-foreground rounded-tr-sm'
                        : 'bg-zinc-800/80 text-zinc-300 rounded-tl-sm'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  <span className="text-[9px] text-zinc-600 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                      <User size={12} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-zinc-800 text-zinc-400">
                    <Bot size={12} />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-zinc-800/80 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-800 shrink-0">
            <div className="flex gap-2 mb-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-7 text-[11px] w-auto bg-zinc-800 border-zinc-700 text-zinc-400 min-h-[28px] min-w-[28px]">
                  <SelectValue>
                    {selectedModel.split('/')[1]?.split('-').slice(0, 2).join('-') || selectedModel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(AI_MODELS).map((key) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {key.split('/')[1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative rounded-xl border border-zinc-700 bg-zinc-800/50 focus-within:border-zinc-600 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya tentang keuangan Anda..."
                className="min-h-[44px] max-h-[100px] w-full resize-none border-0 bg-transparent py-2.5 px-3 pr-10 text-[13px] focus-visible:ring-0 placeholder:text-zinc-600"
                disabled={isTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className={cn(
                  "absolute right-1.5 bottom-1.5 h-7 w-7 rounded-lg min-h-[28px] min-w-[28px] transition-colors",
                  input.trim()
                    ? "bg-foreground text-background hover:bg-zinc-300"
                    : "bg-zinc-700 text-zinc-500"
                )}
              >
                <Send size={12} />
              </Button>
            </div>
            <p className="text-[9px] text-zinc-600 text-center mt-1.5">
              AI bisa salah. Verifikasi informasi penting.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
