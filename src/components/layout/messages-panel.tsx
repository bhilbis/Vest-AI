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
  Check,
  AlertTriangle,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
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

type DraftStatus = 'pending' | 'committing' | 'done' | 'rejected' | 'error'

interface ExpenseDraft {
  kind: 'expense'
  title: string
  amount: number
  category: string
  accountId: string
  accountName: string
  date: string
  currentBalance: number
  sufficientBalance: boolean
}

interface IncomeDraft {
  kind: 'income'
  title: string
  amount: number
  accountId: string
  accountName: string
  date: string
}

type PendingDraft = ExpenseDraft | IncomeDraft

type DraftWithState = PendingDraft & {
  _id: string
  _dbId?: string
  _status: DraftStatus
  _message?: string
}

interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
  drafts?: DraftWithState[]
}

const idr = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)

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
  pendingDrafts?: (PendingDraft & { _dbId?: string })[]
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

function DraftCard({
  draft,
  onApprove,
  onReject,
}: {
  draft: DraftWithState
  onApprove: () => void
  onReject: () => void
}) {
  const isExpense = draft.kind === 'expense'
  const insufficient = draft.kind === 'expense' && !draft.sufficientBalance
  const done = draft._status === 'done'
  const rejected = draft._status === 'rejected'
  const committing = draft._status === 'committing'
  const errored = draft._status === 'error'

  return (
    <div
      className={cn(
        'mt-2 rounded-xl border px-3 py-2.5 text-[12px] max-w-[85%]',
        done
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : rejected
            ? 'border-chat-border bg-chat-surface/40 opacity-60'
            : 'border-chat-border bg-chat-surface/60',
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {isExpense ? (
          <ArrowUpCircle size={13} className="text-red-400 shrink-0" />
        ) : (
          <ArrowDownCircle size={13} className="text-emerald-400 shrink-0" />
        )}
        <span className="font-semibold text-chat-fg">
          {isExpense ? 'Draft Pengeluaran' : 'Draft Pemasukan'}
        </span>
      </div>

      <div className="space-y-0.5 text-chat-fg-muted">
        <div className="flex justify-between gap-2">
          <span>{draft.title}</span>
          <span className="font-semibold text-chat-fg tabular-nums">{idr(draft.amount)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>{isExpense ? 'Dari' : 'Ke'} akun</span>
          <span>{draft.accountName}</span>
        </div>
        {isExpense && (
          <div className="flex justify-between gap-2">
            <span>Kategori</span>
            <span>{draft.category}</span>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <span>Tanggal</span>
          <span className="tabular-nums">{draft.date}</span>
        </div>
      </div>

      {insufficient && !done && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-400">
          <AlertTriangle size={11} className="shrink-0" /> Saldo {draft.kind === 'expense' ? idr(draft.currentBalance) : ''} tidak mencukupi.
        </p>
      )}

      {errored && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
          <AlertTriangle size={11} className="shrink-0" /> {draft._message}
        </p>
      )}

      {done ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
          <Check size={12} className="shrink-0" /> {draft._message || 'Tercatat.'}
        </p>
      ) : rejected ? (
        <p className="mt-2 text-[11px] text-chat-fg-dim">Dibatalkan.</p>
      ) : (
        <div className="mt-2 flex gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={onApprove}
            disabled={committing}
            className="h-7 px-3 text-[11px] bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {committing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : errored ? (
              'Coba lagi'
            ) : (
              'Setujui & Catat'
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReject}
            disabled={committing}
            className="h-7 px-3 text-[11px] text-chat-fg-muted hover:text-chat-fg"
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  )
}

export function MessagesPanel({ isOpen, onClose, position }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'Halo! Saya asisten AI Anda. Saya bisa membantu:\n\n• **Keuangan**: Analisis pengeluaran, saran budget, ringkasan keuangan, deteksi anomali spending.\n• **Catat transaksi**: mis. "catat pengeluaran kopi 25rb dari BCA" — saya buatkan draft, Anda konfirmasi sebelum tersimpan.\n• **Kuliah/Akademik**: Review progress kuliah UT, analisis nilai tuton, saran perbaikan nilai.\n\nApa yang ingin Anda ketahui?',
      timestamp: new Date(),
    },
  ])
  const [restoredDrafts, setRestoredDrafts] = useState<DraftWithState[]>([])

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
    fetch('/api/ai-context-chat/drafts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.drafts) && data.drafts.length > 0) {
          setRestoredDrafts(
            data.drafts.map((d: PendingDraft & { _dbId?: string }) => ({
              ...d,
              _id: crypto.randomUUID(),
              _status: 'pending' as DraftStatus,
            }))
          )
        }
      })
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

      const drafts: DraftWithState[] | undefined = data.pendingDrafts?.length
        ? data.pendingDrafts.map((d) => ({ ...d, _id: crypto.randomUUID(), _status: 'pending' }))
        : undefined

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content ?? 'Tidak ada respon dari AI.',
          timestamp: new Date(),
          drafts,
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

  function patchDraft(messageId: string, draftId: string, patch: Partial<DraftWithState>) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id !== messageId
          ? m
          : {
              ...m,
              drafts: m.drafts?.map((d) =>
                d._id !== draftId ? d : ({ ...d, ...patch } as DraftWithState),
              ),
            },
      ),
    )
  }

  async function handleApprove(messageId: string | null, draft: DraftWithState) {
    if (draft._status === 'committing' || draft._status === 'done') return
    const patch = (p: Partial<DraftWithState>) => {
      if (messageId) {
        patchDraft(messageId, draft._id, p)
      } else {
        setRestoredDrafts(prev =>
          prev.map(d => (d._id === draft._id ? { ...d, ...p } as DraftWithState : d))
        )
      }
    }
    patch({ _status: 'committing', _message: undefined })
    try {
      const res = await fetch('/api/ai-context-chat/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: draft.kind, draft, draftId: draft._dbId }),
      })
      const data = await res.json()
      if (!res.ok) {
        patch({ _status: 'error', _message: data?.summary || data?.error || 'Gagal mencatat transaksi.' })
        return
      }
      patch({ _status: 'done', _message: data?.summary })
    } catch {
      patch({ _status: 'error', _message: 'Kesalahan jaringan.' })
    }
  }

  async function handleReject(messageId: string | null, draft: DraftWithState) {
    if (messageId) {
      patchDraft(messageId, draft._id, { _status: 'rejected' })
    } else {
      setRestoredDrafts(prev =>
        prev.map(d => (d._id === draft._id ? { ...d, _status: 'rejected' as DraftStatus } : d))
      )
    }
    if (draft._dbId) {
      fetch('/api/ai-context-chat/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draft._dbId }),
      }).catch(() => null)
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
    setRestoredDrafts([])
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
                <p className="text-[10px] text-chat-fg-dim">AI-powered · Analisis & catat (perlu konfirmasi)</p>
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
                <div className="flex flex-col min-w-0">
                  <MessageBubble msg={msg} />
                  {msg.drafts?.map((d) => (
                    <DraftCard
                      key={d._id}
                      draft={d}
                      onApprove={() => handleApprove(msg.id, d)}
                      onReject={() => handleReject(msg.id, d)}
                    />
                  ))}

                </div>
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

          {/* Draft tertunda dari sesi sebelumnya (dipulihkan dari DB) */}
          {restoredDrafts.some(d => d._status !== 'done' && d._status !== 'rejected') && (
            <div className="px-4 pb-2 shrink-0 space-y-1.5">
              <p className="text-[10px] text-chat-fg-dim font-medium uppercase tracking-wide">
                Draft tertunda
              </p>
              {restoredDrafts
                .filter(d => d._status !== 'done' && d._status !== 'rejected')
                .map(d => (
                  <DraftCard
                    key={d._id}
                    draft={d}
                    onApprove={() => handleApprove(null, d)}
                    onReject={() => handleReject(null, d)}
                  />
                ))}
            </div>
          )}

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
