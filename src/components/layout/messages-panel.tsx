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
  Paperclip,
  Maximize2,
  Minimize2,
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
import { cn } from '@/lib/utils'
import { AI_MODELS } from '@/app/api/data'

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
  // Default to first model key
  const [selectedModel, setSelectedModel] = useState<string>(Object.keys(AI_MODELS)[0])
  const [selectedContext, setSelectedContext] = useState<string[]>(['all'])
  const [isExpanded, setIsExpanded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
  
  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

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

  /* ===================== RENDER ===================== */

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: position === 'left' ? -320 : 320, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: position === 'left' ? -320 : 320, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed top-4 bottom-4 z-40 flex flex-col shadow-2xl rounded-2xl border border-border bg-background/95 backdrop-blur-xl overflow-hidden",
            position === 'left' ? 'left-4' : 'right-4',
            isExpanded ? 'w-[calc(100vw-2rem)] md:w-[800px]' : 'w-[calc(100vw-2rem)] md:w-[450px]'
          )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={20} className="text-primary" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-chart-1 rounded-full border-2 border-background ring-1 ring-background" />
                </div>
                <div>
                  <p className="text-sm font-semibold">VestAI Assistant</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Portfolio Advisor
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={startNewChat}>
                  <Plus size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx === messages.length - 1 ? 0.1 : 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-8 w-8 mt-1 border border-border">
                        <AvatarFallback className="bg-primary/5 text-primary">
                          <Bot size={14} />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn(
                      "max-w-[85%] space-y-1",
                      msg.role === 'user' ? 'items-end flex flex-col' : 'items-start'
                    )}>
                      <div
                        className={cn(
                          "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                            : 'bg-muted/80 text-foreground border border-border/50 rounded-2xl rounded-tl-sm'
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.role === 'user' && (
                      <Avatar className="h-8 w-8 mt-1 border border-border">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <User size={14} />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <Bot size={14} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 h-10">
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-border">
              {/* Controls */}
              <div className="flex gap-2 mb-3">
                 <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger className="h-8 text-xs w-[140px] bg-muted/50 border-border/60 focus:ring-1 focus:ring-primary/20">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary" />
                      <span className="truncate">
                        {selectedModel.split('/')[1] || selectedModel}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(AI_MODELS).map((key) => (
                      <SelectItem key={key} value={key} className="text-xs">
                          {key.split('/')[1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-muted/50 border-border/60 gap-1.5">
                      Context <ChevronDown size={12} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Data Context</h4>
                        <p className="text-[10px] text-muted-foreground">Select what data the AI can access</p>
                      </div>
                      <div className="space-y-2">
                        {CONTEXT_OPTIONS.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-start gap-2"
                          >
                            <Checkbox
                              id={opt.id}
                              checked={selectedContext.includes(opt.id)}
                              onCheckedChange={(checked) => {
                                setSelectedContext((prev) =>
                                  checked
                                    ? [...prev, opt.id]
                                    : prev.filter((id) => id !== opt.id),
                                )
                              }}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label
                                htmlFor={opt.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {opt.label}
                              </label>
                              <p className="text-[10px] text-muted-foreground">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Input Box */}
              <div className="relative rounded-2xl border border-border bg-muted/30 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your portfolio performance, insights, or advice..."
                  className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent py-3 px-4 pr-12 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  disabled={isTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <div className="absolute right-1.5 bottom-1.5 flex gap-1">
                   <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    disabled={isTyping}
                   >
                     <Paperclip size={16} />
                   </Button>
                   <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-xl transition-all duration-200",
                      input.trim() 
                        ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Send size={14} className={input.trim() ? "ml-0.5" : ""} />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] text-muted-foreground">
                  AI can make mistakes. Please verify important financial information.
                </p>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
