import { LayoutDashboardIcon, MessageSquareIcon, Settings, ArrowLeftRight, Target } from "lucide-react";

interface AIModelConfig {
  model: string;
  systemPrompt: string;
  streamable: boolean;
  provider?: "gemini" | "groq";
  description?: string;
}

// Available AI models and their configurations
export const AI_MODELS: Record<string, AIModelConfig> = {
  // Gemini Models
  'gemini/gemini-2.5-flash': {
    model: "gemini-2.5-flash",
    systemPrompt: "You are a helpful assistant.",
    streamable: false,
    provider: "gemini",
    description: "Cepat dan ringkas, cocok untuk jawaban sederhana."
  },
  // 'gemini/gemini-2.5-pro': {
  //   model: "gemini-2.5-pro",
  //   systemPrompt: "You are a helpful assistant.",
  //   streamable: false,
  //   provider: "gemini",
  //   description: "Kemampuan tinggi untuk analisis dan pemahaman mendalam."
  // },
  'gemini/gemini-2-flash': {
    model: "gemini-2-flash",
    systemPrompt: "You are a helpful assistant.",
    streamable: false,
    provider: "gemini",
    description: "Model cepat dengan keseimbangan kecepatan dan kualitas."
  },
  'gemini/gemini-2-flash-lite': {
    model: "gemini-2-flash-lite",
    systemPrompt: "You are a helpful assistant.",
    streamable: false,
    provider: "gemini",
    description: "Ringkas dan hemat kuota untuk pertanyaan cepat."
  },
  // 'gemini/gemma-3-1b': {
  //   model: "gemma-3-1b-it",
  //   systemPrompt: "You are a helpful assistant.",
  //   streamable: false,
  //   provider: "groq",
  //   description: "Model kecil cepat, respons instan."
  // },
  // 'gemini/gemma-3-4b': {
  //   model: "gemma-3-4b-it",
  //   systemPrompt: "You are a helpful assistant.",
  //   streamable: false,
  //   provider: "groq",
  //   description: "Keseimbangan antara kecepatan dan kemampuan analisis."
  // },
  // Groq Free Models
  'groq/llama-3.3-70b-versatile': {
    model: "llama-3.3-70b-versatile",
    systemPrompt: "You are a helpful assistant.",
    streamable: false,
    provider: "groq",
    description: "Model terkuat untuk analisis kompleks dan pemahaman mendalam."
  },
  'groq/llama-3.1-8b-instant': {
    model: "llama-3.1-8b-instant",
    systemPrompt: "You are a helpful assistant.",
    streamable: false,
    provider: "groq",
    description: "Respons sangat cepat untuk pertanyaan sederhana."
  },
};

export const NavbarItems = [
  {
    title: "Dashboard",
    url: "/financial-overview",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Transaksi",
    url: "/financial-overview/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Budget",
    url: "/financial-overview/budgets",
    icon: Target,
  },
  {
    title: "Messages",
    icon: MessageSquareIcon,
  },
  {
    title: "Settings",
    url: "/tracker/settings",
    icon: Settings,
  },
];

export const assetTypes = [
  { id: 'stock', label: 'Saham', color: 'bg-chart-1' },
  { id: 'crypto', label: 'Crypto', color: 'bg-chart-2' },
  { id: 'gold', label: 'Emas', color: 'bg-chart-3' },
  { id: 'cash', label: 'Kas', color: 'bg-chart-4' },
];
