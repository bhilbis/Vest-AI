import { LayoutDashboardIcon, MessageSquareIcon, Settings, ArrowLeftRight, Target } from "lucide-react";

// Available AI models and their configurations
export const AI_MODELS = {
  'deepseek/deepseek-v3': {
    model: "deepseek/deepseek-chat-v3-0324:free",
    systemPrompt: "You are a Financial Assistant that helps users analyze their spending, set budgets, and manage personal finances.",
    streamable: false
  },
  'mistralai/mistral-small-3.2-24b-instruct': {
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    systemPrompt: "You are a Financial Assistant that helps users analyze their spending, set budgets, and manage personal finances.",
    streamable: false
  },
  'google/gemini-2.5-pro-exp-03-25': {
    model: "google/gemini-2.5-pro-exp-03-25:free",
    systemPrompt: "You are a Financial Assistant that helps users analyze their spending, set budgets, and manage personal finances.",
    streamable: false
  },
  'deepseek/deepseek-r1-0528': {
    model: "deepseek/deepseek-r1-0528:free",
    systemPrompt: "You are a Financial Assistant that helps users analyze their spending, set budgets, and manage personal finances.",
    streamable: false
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
