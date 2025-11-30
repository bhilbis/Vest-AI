/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Settings2Icon, SendIcon, BotIcon, BarChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"

const AI_MODELS = [
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek R1",
    description: "Model AI eksperimental dengan kemampuan penalaran tingkat lanjut."
  },
  {
    id: "deepseek/deepseek-v3",
    name: "DeepSeek V3",
    description: "Slow response time, but accurate."

  },
  // {
  //   id: "google/gemini-2.5-pro-exp-03-25",
  //   name: "Gemini Pro",
  //   description: "Model AI canggih dengan pemahaman kontekstual yang kuat."
  // },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    description: "Model AI yang kuat untuk analisis mendalam dan prediksi pasar."
  },
  {
    id: "mistralai/mistral-small-3.2-24b-instruct",
    name: "Mistral Small",
    description: "Model AI yang seimbang antara kecepatan dan akurasi."
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-r1-0528");
  const [contextType, setContextType] = useState("general");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setMessages((prev) => [...prev, 
      { role: "user", content: newMessage },
      { role: "assistant", content: "" },
    ]);
    setNewMessage("");
    setLoading(true);
    
    try {
      // Pengkondisian fetch berdasarkan context
      if (contextType === "portfolio") {
        // Fetch assets terlebih dahulu
        const assetsResponse = await fetch('/api/assets');
        const assets = await assetsResponse.json();
        
        if (assets.length === 0) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Maaf, Anda belum memiliki data aset untuk dianalisis. Silakan tambahkan aset terlebih dahulu." },
          ]);
          setLoading(false);
          return;
        }
        
        // Fetch harga pasar untuk aset
        const coinIds = assets.map((a: any) => a.coinId).filter(Boolean);
        const priceRes = await fetch("/api/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coinIds })
        });
        const prices = await priceRes.json();
        
        // Format market prices
        const marketPrices = Object.fromEntries(
          assets.map((a: any) => {
            const price = prices[a.coinId]?.idr;
            return [a.id, price && price > 0 ? price.toString() : null];
          })
        );
        
        // Kirim ke endpoint ai-analyze
        const response = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assets,
            marketPrices,
            message: newMessage,
            model: selectedModel
          }),
        });
        
        if (!response.body) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Tidak ada respon dari AI." },
          ]);
          setLoading(false);
          return;
        }
        
        // Proses streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: fullText }
          ]);
        }
      } else {
        // Context general - gunakan endpoint ai-chat biasa
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage, model: selectedModel }),
        });
        
        if (!response.body) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Tidak ada respon dari AI." },
          ]);
          setLoading(false);
          return;
        }
        
        // Proses streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: fullText
            };
            return updated;
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, terjadi kesalahan saat memproses pesan Anda." },
      ]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseContent = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed.message) {
        return parsed.message;
      }
    } catch (e) {
    }
    return raw;
  };


  return (
    <>
      <div className="flex items-center justify-end w-full gap-3 sticky top-3 px-4 z-10">  
        <Badge variant="secondary" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          AI Online
        </Badge>
        
        <Badge variant="outline" className="gap-2">
          <BarChartIcon className="h-4 w-4" />
          {contextType === "portfolio" ? "Portfolio Context" : "General Chat"}
        </Badge>
      </div>
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col !bg-transparent !border-none !shadow-none xl:px-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BotIcon className="h-5 w-5" />
              VestAI Chat
              <Badge variant="outline" className="ml-2 text-xs">
                {AI_MODELS.find(m => m.id === selectedModel)?.name || 'AI Model'}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 rounded-lg">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <BotIcon className="h-12 w-12 mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Selamat datang di VestAI Chat</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Tanyakan tentang investasi, analisis pasar, atau strategi portofolio Anda.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {[
                      "Bagaimana cara memulai investasi dengan modal kecil?",
                      "Apa strategi diversifikasi portofolio yang baik?",
                      "Jelaskan perbedaan antara saham dan obligasi",
                      "Bagaimana cara menganalisis laporan keuangan perusahaan?"
                    ].map((suggestion, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        className="justify-start h-auto py-3 px-4 text-left whitespace-normal break-words w-full"
                        onClick={() => {
                          setNewMessage(suggestion);
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg px-4 py-1 ${message.role === "user" 
                          ? "bg-primary/50 text-primary-foreground" 
                          : "bg-muted"}`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="prose dark:prose-invert max-w-none">{children}</p>
                          }}
                        >
                          {parseContent(message.content.replace(/\\n/g, '\n'))}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-75"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Settings2Icon className="h-4 w-4" />
                        Model
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-fit">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm ">AI Model</h4>
                        <div className="space-y-2">
                          <Select
                            value={selectedModel}
                            onValueChange={setSelectedModel}
                          >
                            <SelectTrigger id="ai-model">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                              <TooltipProvider>
                                {AI_MODELS.map((model) => (
                                  <Tooltip key={model.id} delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <SelectItem
                                        value={model.id}
                                        className="flex justify-between items-center cursor-pointer"
                                      >
                                        {model.name}
                                      </SelectItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[200px]">
                                      <p className="text-xs text-white dark:text-black">
                                        {model.description}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </TooltipProvider>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Tabs defaultValue="general" value={contextType} onValueChange={setContextType} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="general">Chat Umum</TabsTrigger>
                      <TabsTrigger value="portfolio">Aset Porto</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan Anda di sini..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || loading}
                    className="shrink-0"
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}