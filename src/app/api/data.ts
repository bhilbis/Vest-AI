import { LayoutDashboardIcon, MessageSquareIcon, Settings, Wallet2Icon } from "lucide-react";

// Available AI models and their configurations
export const AI_MODELS = {
  'deepseek/deepseek-v3': {
    model: "deepseek/deepseek-chat-v3-0324:free",
    systemPrompt: "You are VestAI, a helpful financial assistant that can answer general questions about finance, investing, and markets.",
    streamable: false
  },
  'mistralai/mistral-small-3.2-24b-instruct': {
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    systemPrompt: "You are VestAI, a helpful financial assistant that can answer general questions about finance, investing, and markets.",
    streamable: false
  },
  'google/gemini-2.5-pro-exp-03-25': {
    model: "google/gemini-2.5-pro-exp-03-25:free",
    systemPrompt: "You are VestAI, a helpful financial assistant that can answer general questions about finance, investing, and markets.",
    streamable: false

  },
  'deepseek/deepseek-r1-0528': {
    model: "deepseek/deepseek-r1-0528:free",
    systemPrompt: "You are VestAI, a helpful financial assistant that can answer general questions about finance, investing, and markets.",
    streamable: false
  },
};

export const NavbarItems = [
  { 
    title: "Home", 
    url: "/tracker", 
    icon: LayoutDashboardIcon, 
  }, 
  { 
    title: "Messages",
    icon: MessageSquareIcon, 
  }, 
  { 
    title: "Assets",
    icon: Wallet2Icon,
    hasDropdown: true,
  }, 
  { 
    title: "Settings", 
    url: "/tracker/settings", 
    icon: Settings, 
  }, 
];

export const assetTypes = [
  { id: 'stock', label: 'Saham', color: 'bg-blue-500' },
  { id: 'crypto', label: 'Crypto', color: 'bg-orange-500' },
];
