/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  History, 
  Plus, 
  ChevronDown,
  Sparkles,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string[];
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'left' | 'right';
}

const aiModels = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Model terbaik untuk analisis kompleks' },
  { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Model cepat untuk pertanyaan umum' },
  { id: 'claude', name: 'Claude', description: 'Model khusus untuk financial analysis' },
];

const contextOptions = [
  { id: 'all', label: 'Semua Portfolio', description: 'Akses ke semua data asset' },
  { id: 'stock', label: 'Saham Saja', description: 'Fokus pada portfolio saham' },
  { id: 'crypto', label: 'Crypto Saja', description: 'Fokus pada portfolio crypto' },
  { id: 'performance', label: 'Performa Portfolio', description: 'Data profit/loss dan metrics' },
];

export function MessagesPanel({ isOpen, onClose, position }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [selectedContext, setSelectedContext] = useState<string[]>(['all']);
  const [chatHistory, setChatHistory] = useState<Array<{id: string, title: string, lastMessage: Date}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    left: 'right-4',
    right: 'left-4',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Load chat history from localStorage
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
      
      // Initialize with welcome message
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: 'Hi! Saya AI assistant untuk membantu analisis portfolio Anda. Apa yang ingin Anda ketahui tentang investasi Anda hari ini?',
        timestamp: new Date(),
        context: selectedContext,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, selectedContext, messages.length]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      context: selectedContext,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const portfolio = JSON.parse(localStorage.getItem('portfolio') || '[]');
      let response = '';

      if (input.toLowerCase().includes('portfolio') || input.toLowerCase().includes('asset')) {
        const totalAssets = portfolio.length;
        const totalValue = portfolio.reduce((sum: number, asset: any) => 
          sum + (asset.currentPrice * asset.lots), 0);
        const totalCost = portfolio.reduce((sum: number, asset: any) => 
          sum + (asset.buyPrice * asset.lots), 0);
        const totalPL = totalValue - totalCost;
        const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

        response = `Berikut ringkasan portfolio Anda:

📊 **Total Asset**: ${totalAssets} item
💰 **Nilai Portfolio**: Rp ${totalValue.toLocaleString()}
💵 **Total Modal**: Rp ${totalCost.toLocaleString()}
${totalPL >= 0 ? '📈' : '📉'} **P&L**: Rp ${totalPL.toLocaleString()} (${totalPLPercent.toFixed(2)}%)

${portfolio.length > 0 ? 
  `**Asset Terbaik**: ${portfolio.find((a: any) => (a.currentPrice - a.buyPrice) * a.lots > 0)?.name || 'Tidak ada'}

**Saran**: ${totalPL >= 0 ? 
  'Portfolio Anda menunjukkan performa positif! Pertimbangkan untuk diversifikasi lebih lanjut.' : 
  'Portfolio sedang mengalami koreksi. Ini bisa menjadi peluang accumulation jika fundamental masih kuat.'}`
  : 'Anda belum memiliki asset. Mulai dengan menambahkan asset pertama Anda!'}`;
      } else if (input.toLowerCase().includes('saham')) {
        response = `Untuk investasi saham, berikut beberapa tips:

🎯 **Strategi Fundamental**:
- Analisis laporan keuangan perusahaan
- Perhatikan rasio P/E, PBV, dan debt to equity
- Monitor perkembangan industri

📊 **Risk Management**:
- Diversifikasi minimal 5-10 saham berbeda sektor
- Set stop loss 5-10% dari harga beli
- Jangan investasi lebih dari 20% di satu saham

⏰ **Timing**:
- Dollar cost averaging untuk mengurangi risiko timing
- Beli saat market sedang koreksi (contrarian)
- Hold untuk jangka panjang minimal 1-3 tahun`;
      } else if (input.toLowerCase().includes('crypto')) {
        response = `Untuk cryptocurrency, perhatikan hal berikut:

⚡ **Karakteristik Crypto**:
- Volatilitas sangat tinggi (bisa swing 20-50% per hari)
- Market 24/7, tidak ada closing time
- Teknologi blockchain yang terus berkembang

🛡️ **Risk Management**:
- Maksimal 5-10% dari total portfolio
- HODL untuk jangka panjang, jangan panic sell
- Paham teknologi dari crypto yang dibeli

💡 **Tips Trading**:
- DCA (Dollar Cost Averaging) untuk entry
- Set target profit dan stop loss yang jelas
- Follow development dan adoption dari project`;
      } else {
        response = `Saya siap membantu Anda dengan berbagai hal terkait investasi:

💼 **Portfolio Analysis**: Analisis mendalam tentang performa investasi Anda
📊 **Market Insights**: Info terkini tentang kondisi pasar saham dan crypto  
🎯 **Investment Strategy**: Saran strategi investasi sesuai risk tolerance
📈 **Technical Analysis**: Bantuan analisis chart dan pattern
🏦 **Financial Planning**: Perencanaan keuangan jangka panjang

Apa yang ingin Anda diskusikan lebih lanjut?`;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        context: selectedContext,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const startNewChat = () => {
    if (messages.length > 1) {
      const chatTitle = messages.find(m => m.role === 'user')?.content.substring(0, 50) + '...' || 'New Chat';
      const newHistory = {
        id: Date.now().toString(),
        title: chatTitle,
        lastMessage: new Date(),
      };
      
      const updatedHistory = [newHistory, ...chatHistory.slice(0, 9)]; // Keep last 10 chats
      setChatHistory(updatedHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    }
    
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Mulai percakapan baru! Apa yang ingin Anda diskusikan tentang investasi Anda?',
      timestamp: new Date(),
      context: selectedContext,
    }]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: position === 'left' ? 300 : -300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: position === 'left' ? 300 : -300 }}
        className={`fixed ${positionClasses[position]} top-4 bottom-4 w-96 z-40`}
      >
        <div className="h-full backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/20 rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500">
                  <Bot size={16} className="text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Portfolio Advisor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <History size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="left">
                  <div className="space-y-2">
                    <h4 className="text-sm">Chat History</h4>
                    {chatHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Belum ada riwayat chat</p>
                    ) : (
                      chatHistory.map((chat) => (
                        <div key={chat.id} className="p-2 rounded hover:bg-accent cursor-pointer">
                          <p className="text-xs truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {chat.lastMessage.toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
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
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500">
                        <Bot size={12} className="text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-accent'
                    }`}>
                      {message.content}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback>
                        <User size={12} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 justify-start"
                >
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <Bot size={12} className="text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-accent p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 space-y-3">
            {/* Context and Model Selection */}
            <div className="flex gap-2 text-xs">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="flex items-center gap-1">
                          <Sparkles size={12} />
                          {model.name}
                        </div>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Context <ChevronDown size={12} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="top">
                  <div className="space-y-2">
                    <h4 className="text-sm">Pilih Context Data</h4>
                    {contextOptions.map((option) => (
                      <div key={option.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={selectedContext.includes(option.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContext([...selectedContext, option.id]);
                            } else {
                              setSelectedContext(selectedContext.filter(id => id !== option.id));
                            }
                          }}
                        />
                        <div className="space-y-1 leading-none">
                          <label htmlFor={option.id} className="text-xs cursor-pointer">
                            {option.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tanya tentang portfolio Anda..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isTyping}
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}