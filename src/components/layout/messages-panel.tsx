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
  Info,
  Zap,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AI_MODELS } from '@/app/api/data'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
}

interface UsageInfo {
  current: number
  limit: number
  percentage: number
  isLowPower?: boolean
}

interface MessagesPanelProps {
  isOpen: boolean
  onClose: () => void
  position: 'left' | 'right'
}

interface AIResponse {
  content?: string
  usage?: UsageInfo
}

const DAILY_LIMIT = 20

function UsageMeter({ usage }: { usage: UsageInfo }) {
  const pct = Math.min(usage.percentage, 100)
  const barColor =
    pct >= 80 ? 'bg-amber-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-emerald-500'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            {usage.isLowPower && <Zap size={10} className="text-amber-400 shrink-0" />}
            <div className="w-16 h-1.5 bg-chat-border rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] text-chat-fg-dim tabular-nums">
              {usage.current}/{usage.limit}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-[11px]">
            {usage.isLowPower
              ? 'Low-Power Mode aktif — respons dipersingkat untuk hemat kuota.'
              : `${usage.current} dari ${usage.limit} kuota harian terpakai.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <div className={cn('max-w-[85%] space-y-0.5', isUser ? 'items-end flex flex-col' : '')}>
      <div
        className={cn(
          'px-3 py-2.5 text-[12px] leading-relaxed rounded-xl break-words',
          isUser
            ? 'bg-primary/25 text-chat-fg rounded-tr-sm'
            : 'bg-chat-surface/80 text-chat-fg rounded-tl-sm'
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-chat-fg font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="leading-snug">{children}</li>,
              h1: ({ children }) => <h1 className="text-sm font-bold text-chat-fg mb-1 mt-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-[13px] font-bold text-chat-fg mb-1 mt-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-[12px] font-semibold text-chat-fg mb-0.5 mt-1.5">{children}</h3>,
              hr: () => <hr className="border-chat-border my-2" />,
              code: ({ children }) => (
                <code className="bg-chat-surface/70 text-chat-fg rounded px-1 py-0.5 text-[11px] font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-chat-surface/70 rounded-lg p-2 overflow-x-auto text-[11px] my-1.5 font-mono">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-1.5">
                  <table className="w-full text-[11px] border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="border-b border-chat-border">{children}</thead>,
              th: ({ children }) => (
                <th className="text-left px-2 py-1 font-semibold text-chat-fg">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-2 py-1 border-t border-chat-border/50 text-chat-fg">{children}</td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-chat-border pl-3 text-chat-fg-muted italic my-1">
                  {children}
                </blockquote>
              ),
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      <span className="text-[9px] text-chat-fg-dim px-1">
        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

export function MessagesPanel({ isOpen, onClose, position }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'Halo! Saya asisten AI Anda. Saya bisa membantu:\n\n• **Keuangan**: Analisis pengeluaran, saran budget, ringkasan keuangan, deteksi anomali spending.\n• **Kuliah/Akademik**: Review progress kuliah UT, analisis nilai tuton, saran perbaikan nilai, reminder deadline sesi.\n• **General**: Pertanyaan umum, tips produktivitas, perencanaan.\n\nApa yang ingin Anda ketahui?',
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(Object.keys(AI_MODELS)[0])
  const [isExpanded, setIsExpanded] = useState(false)
  const [usage, setUsage] = useState<UsageInfo>({ current: 0, limit: DAILY_LIMIT, percentage: 0 })

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

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/ai-context-chat')
      .then(r => r.json())
      .then(data => { if (data.usage) setUsage(data.usage) })
      .catch(() => null)
  }, [isOpen])

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

    const historyPayload = messages
      .filter(m => m.id !== messages[0]?.id || messages[0]?.role !== 'assistant')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
          history: historyPayload,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Gagal memuat respon AI')
      }

      const data = (await res.json()) as AIResponse

      if (data.usage) setUsage(data.usage)

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
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden',
            'border border-chat-border bg-chat-bg/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40',
            'top-4 bottom-4',
            position === 'left' ? 'left-4' : 'right-4',
            isExpanded
              ? 'w-[600px] max-h-[calc(100vh-2rem)]'
              : 'w-[350px] md:w-[380px] lg:w-[400px] xl:w-[25vw] max-h-[80vh]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-chat-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-chat-surface flex items-center justify-center shrink-0">
                <Bot size={16} className="text-chat-fg-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-chat-fg">Financial Assistant</p>
                <p className="text-[10px] text-chat-fg-dim">AI-powered · Read-only</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <UsageMeter usage={usage} />
              <div className="flex gap-0.5 ml-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 w-7 rounded flex items-center justify-center text-chat-fg-muted hover:text-chat-fg hover:bg-chat-surface transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  type="button"
                  title="Start New Chat"
                  onClick={startNewChat}
                  className="h-7 w-7 rounded flex items-center justify-center text-chat-fg-muted hover:text-chat-fg hover:bg-chat-surface transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  title="Close"
                  onClick={onClose}
                  className="h-7 w-7 rounded flex items-center justify-center text-chat-fg-muted hover:text-red-400 hover:bg-chat-surface transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Low-power mode banner */}
          {usage.isLowPower && (
            <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
              <p className="text-[10px] text-amber-400 flex items-center gap-1">
                <Zap size={10} /> Low-Power Mode — kuota &gt;80%, respons dipersingkat.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx === messages.length - 1 ? 0.05 : 0 }}
                className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                    <AvatarFallback className="bg-chat-surface text-chat-fg-muted">
                      <Bot size={12} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <MessageBubble msg={msg} />
                {msg.role === 'user' && (
                  <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                    <AvatarFallback className="bg-chat-surface text-chat-fg-muted">
                      <User size={12} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-chat-surface text-chat-fg-muted">
                    <Bot size={12} />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-chat-surface/80 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-chat-fg-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-chat-fg-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-chat-fg-muted rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-chat-border shrink-0">
            <div className="flex gap-2 mb-2 items-center">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-7 text-[11px] w-auto bg-chat-surface border-chat-border text-chat-fg-muted min-h-7 min-w-7">
                  <SelectValue>
                    {selectedModel.split('/')[1]?.split('-').slice(0, 3).join('-') || selectedModel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_MODELS).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <div className="flex flex-col items-start">
                        <span>{key.split('/')[1]}</span>
                        {config.description && (
                          <span className="text-[9px] text-chat-fg-dim mt-0.5">{config.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-chat-fg-dim cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] max-w-[200px]">{AI_MODELS[selectedModel]?.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="relative rounded-xl border border-chat-border bg-chat-surface/50 focus-within:border-chat-fg-dim transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya tentang keuangan, kuliah, atau apapun..."
                className="min-h-11 max-h-[100px] w-full resize-none border-0 bg-transparent py-2.5 px-3 pr-10 text-[13px] text-chat-fg focus-visible:ring-0 placeholder:text-chat-fg-dim"
                disabled={isTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className={cn(
                  'absolute right-1.5 bottom-1.5 h-7 w-7 rounded-lg min-h-7 min-w-7 transition-colors',
                  input.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                    : 'bg-chat-surface text-chat-fg-dim'
                )}
              >
                <Send size={12} />
              </Button>
            </div>
            <p className="text-[9px] text-chat-fg-dim text-center mt-1.5">
              AI bisa salah. Verifikasi informasi penting.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
