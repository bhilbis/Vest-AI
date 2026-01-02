// lib/ai.ts
export type AIContentBlock = {
  type?: string
  text?: string
  content?: AIContentBlock[]
}

export type AIMessage = {
  role?: string
  content?: string | AIContentBlock[]
}
