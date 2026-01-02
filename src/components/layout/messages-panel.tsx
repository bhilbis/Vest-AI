'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Bot,
  X,
  Send,
  Plus,
  ChevronDown,
  Sparkles,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

/* ===================== TYPES ===================== */

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
  context?: string[]
}

interface MessagesPanelProps {
  isOpen: boolean
  onClose: () => void
  position: 'left' | 'right'
}

interface ChatHistoryItem {
  id: string
  title: string
  lastMessage: Date
}

interface AIResponse {
  content?: string
}

/* ===================== CONSTANTS ===================== */

const AI_MODELS = [
  {
    id: 'deepseek/deepseek-r1-0528',
    name: 'DeepSeek R1',
    description: 'Analisis cepat, biaya hemat',
  },
  {
    id: 'deepseek/deepseek-v3',
    name: 'DeepSeek V3',
    description: 'Reasoning lebih dalam',
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    description: 'Tanggapan singkat & efisien',
  },
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct',
    name: 'Mistral Small 24B',
    description: 'Model ringan untuk pertanyaan umum',
  },
] as const

const CONTEXT_OPTIONS = [
  {
    id: 'all',
    label: 'Semua Portfolio',
    description: 'Akses ke semua data asset',
  },
  {
    id: 'stock',
    label: 'Saham Saja',
    description: 'Fokus pada portfolio saham',
  },
  {
    id: 'crypto',
    label: 'Crypto Saja',
    description: 'Fokus pada portfolio crypto',
  },
  {
    id: 'performance',
    label: 'Performa Portfolio',
    description: 'Profit, loss, dan metrics',
  },
] as const

/* ===================== COMPONENT ===================== */

export function MessagesPanel({
  isOpen,
  onClose,
  position,
}: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'Hi! Saya AI assistant untuk membantu analisis portfolio Anda. Apa yang ingin Anda ketahui hari ini?',
      timestamp: new Date(),
      context: ['all'],
    },
  ])

  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id)
  const [selectedContext, setSelectedContext] = useState<string[]>(['all'])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const saved = localStorage.getItem('chatHistory')
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as {
        id: string
        title: string
        lastMessage: string
      }[]

      setChatHistory(
        parsed.map((item) => ({
          ...item,
          lastMessage: new Date(item.lastMessage),
        })),
      )
    } catch {
      /* ignore */
    }
  }, [])

  /* ===================== HANDLERS ===================== */

  async function handleSend() {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      context: selectedContext,
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
          context: selectedContext,
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
          context: selectedContext,
        },
      ])
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungi AI.'

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  function startNewChat() {
    const firstUserMessage = messages.find((m) => m.role === 'user')

    if (firstUserMessage) {
      const newItem: ChatHistoryItem = {
        id: crypto.randomUUID(),
        title: firstUserMessage.content.slice(0, 50) + '…',
        lastMessage: new Date(),
      }

      const updated = [newItem, ...chatHistory].slice(0, 10)
      setChatHistory(updated)
      localStorage.setItem('chatHistory', JSON.stringify(updated))
    }

    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Mulai percakapan baru. Ada yang bisa saya bantu?',
        timestamp: new Date(),
        context: selectedContext,
      },
    ])
  }

  if (!isOpen) return null

  /* ===================== RENDER ===================== */

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: position === 'left' ? 300 : -300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: position === 'left' ? 300 : -300 }}
        className={`
          fixed ${position === 'left' ? 'right-2' : 'left-2'}
          top-2 bottom-2
          w-[calc(100vw-1rem)] sm:w-96
          z-40
        `}
      >
        <div className="flex h-full flex-col rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-linear-to-r from-blue-500 to-purple-500 text-white">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">AI Assistant</p>
                <p className="text-xs text-muted-foreground">
                  Portfolio Advisor
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={startNewChat}>
                <Plus size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  } gap-2`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-linear-to-r from-blue-500 to-purple-500 text-white">
                        <Bot size={12} />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {msg.role === 'user' && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        <User size={12} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-linear-to-r from-blue-500 to-purple-500 text-white">
                      <Bot size={12} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 rounded-lg bg-accent px-3 py-2">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3 space-y-2">
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-1">
                        <Sparkles size={12} />
                        {m.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Context <ChevronDown size={12} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    {CONTEXT_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <Checkbox
                          checked={selectedContext.includes(opt.id)}
                          onCheckedChange={(checked) => {
                            setSelectedContext((prev) =>
                              checked
                                ? [...prev, opt.id]
                                : prev.filter((id) => id !== opt.id),
                            )
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya tentang portfolio Anda…"
                rows={2}
                className="resize-none"
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
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}