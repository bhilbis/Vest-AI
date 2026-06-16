"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight } from "lucide-react"

export interface Question {
  id: number
  pertanyaan: string
  pilihan: string[]
  jawaban: number
  penjelasan: string
}

interface QuizViewProps {
  questions: Question[]
}

type Phase = "quiz" | "result"

export function QuizView({ questions }: QuizViewProps) {
  const [phase, setPhase] = useState<Phase>("quiz")
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [showExplanation, setShowExplanation] = useState(false)

  const q = questions[current]
  const selected = answers[current]
  const isAnswered = selected !== null

  function selectAnswer(idx: number) {
    if (isAnswered) return
    const updated = [...answers]
    updated[current] = idx
    setAnswers(updated)
    setShowExplanation(true)
  }

  function goNext() {
    setShowExplanation(false)
    if (current < questions.length - 1) {
      setCurrent(current + 1)
    } else {
      setPhase("result")
    }
  }

  function goPrev() {
    setShowExplanation(false)
    if (current > 0) setCurrent(current - 1)
  }

  function reset() {
    setAnswers(Array(questions.length).fill(null))
    setCurrent(0)
    setPhase("quiz")
    setShowExplanation(false)
  }

  const answered = answers.filter((a) => a !== null).length
  const correct = answers.filter((a, i) => a === questions[i].jawaban).length
  const score = Math.round((correct / questions.length) * 100)

  if (phase === "result") {
    return (
      <div className="space-y-6">
        {/* Score card */}
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <Trophy
            className={cn(
              "mx-auto h-12 w-12",
              score >= 80 ? "text-yellow-500" : score >= 60 ? "text-blue-500" : "text-muted-foreground"
            )}
          />
          <div>
            <p className="text-4xl font-bold">{score}</p>
            <p className="text-muted-foreground text-sm">dari 100</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {correct} benar dari {questions.length} soal
          </p>
          <Badge
            variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}
            className="text-sm px-3 py-1"
          >
            {score >= 80 ? "Sangat Baik" : score >= 60 ? "Cukup Baik" : "Perlu Belajar Lagi"}
          </Badge>
        </div>

        {/* Per-question review */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Review Jawaban
          </h3>
          {questions.map((q, i) => {
            const userAns = answers[i]
            const isCorrect = userAns === q.jawaban
            return (
              <div key={q.id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  )}
                  <p className="text-sm font-medium leading-snug">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    {q.pertanyaan}
                  </p>
                </div>
                {!isCorrect && (
                  <div className="ml-7 space-y-1 text-xs">
                    <p className="text-destructive">
                      Jawaban kamu: {userAns !== null ? q.pilihan[userAns] : "Tidak dijawab"}
                    </p>
                    <p className="text-green-600 dark:text-green-400">
                      Jawaban benar: {q.pilihan[q.jawaban]}
                    </p>
                    <p className="text-muted-foreground mt-1">{q.penjelasan}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Button onClick={reset} className="w-full gap-2" variant="outline">
          <RotateCcw size={16} />
          Ulangi Kuis
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Soal {current + 1} dari {questions.length}</span>
          <span>{answered} dijawab</span>
        </div>
        <Progress value={((current + 1) / questions.length) * 100} className="h-1.5" />
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-medium leading-relaxed">
          <span className="text-muted-foreground mr-1.5">{current + 1}.</span>
          {q.pertanyaan}
        </p>

        <div className="space-y-2">
          {q.pilihan.map((opt, idx) => {
            const isSelected = selected === idx
            const isCorrectOpt = idx === q.jawaban
            let variant: "default" | "outline" | "secondary" = "outline"
            let extraClass = "hover:bg-muted cursor-pointer"

            if (isAnswered) {
              if (isCorrectOpt) {
                extraClass = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 cursor-default"
                variant = "outline"
              } else if (isSelected && !isCorrectOpt) {
                extraClass = "border-destructive bg-destructive/10 text-destructive cursor-default"
                variant = "outline"
              } else {
                extraClass = "opacity-60 cursor-default"
              }
            }

            return (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 text-sm transition-all duration-150",
                  variant === "outline" ? "border-border" : "",
                  extraClass
                )}
              >
                <span className="font-medium mr-2">{["A", "B", "C", "D"][idx]}.</span>
                {opt.replace(/^[A-D]\.\s*/, "")}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {showExplanation && isAnswered && (
          <div
            className={cn(
              "rounded-lg px-4 py-3 text-sm space-y-1",
              selected === q.jawaban
                ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            )}
          >
            <p className="font-semibold flex items-center gap-1.5">
              {selected === q.jawaban ? (
                <><CheckCircle2 size={15} /> Benar!</>
              ) : (
                <><XCircle size={15} /> Salah — jawaban benar: {q.pilihan[q.jawaban]}</>
              )}
            </p>
            <p className="opacity-90">{q.penjelasan}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={current === 0} className="gap-1">
          <ChevronLeft size={16} /> Sebelumnya
        </Button>

        {isAnswered ? (
          <Button size="sm" onClick={goNext} className="gap-1">
            {current === questions.length - 1 ? "Lihat Hasil" : "Lanjut"}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Pilih jawaban untuk melanjutkan</p>
        )}
      </div>

      {/* Jump to question dots */}
      <div className="flex flex-wrap gap-1.5 justify-center pt-1">
        {questions.map((_, i) => {
          const ans = answers[i]
          const done = ans !== null
          const isCorrect = done && ans === questions[i].jawaban
          return (
            <button
              key={i}
              onClick={() => { setShowExplanation(false); setCurrent(i) }}
              className={cn(
                "h-6 w-6 rounded text-xs font-medium transition-colors",
                i === current ? "ring-2 ring-primary" : "",
                done
                  ? isCorrect
                    ? "bg-green-500 text-white"
                    : "bg-destructive text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
