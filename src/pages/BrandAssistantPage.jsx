import React, { useState } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  CheckCircle2, 
  RefreshCw,
  HelpCircle,
  FileQuestion
} from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { askBrandAssistant } from "../services/groq";

export default function BrandAssistantPage() {
  const { activeBrand, knowledgeBase } = useBrand();

  const [messages, setMessages] = useState([
    {
      id: "m-1",
      sender: "assistant",
      text: `Hello! I am your AI Brand Governance Assistant for **${activeBrand?.name || "our brand"}**. Ask me anything about approved terminology, prohibited claims, brand voice guidelines, or request a compliant rewrite.`
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "What is our approved brand tone of voice?",
    "Can I claim 100% zero downtime in my social ad?",
    "What words or buzzwords should I strictly avoid?",
    "Rewrite this slogan: 'The cheapest cloud tool in the world'"
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await askBrandAssistant({
        userQuery: query,
        brandProfile: activeBrand,
        knowledgeBaseItems: knowledgeBase,
        chatHistory: messages
      });

      const assistantMessage = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: "assistant",
          text: `⚠️ I encountered an issue consulting the brand knowledge base: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>AI Brand Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded directly on <strong className="text-slate-200">{activeBrand?.name}</strong> guidelines. Strictly avoids hallucinating policies.
          </p>
        </div>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-semibold">
          Grounded with Groq (120B)
        </span>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser 
                    ? "bg-slate-700 text-slate-200" 
                    : "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-white"
                    : "bg-[#141B2D] border border-slate-800 text-slate-200"
                }`}>
                  {m.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <span>Searching brand knowledge base...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 bg-[#0E1322] flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Quick prompts:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <div className="p-4 bg-[#0B0F19] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask anything about ${activeBrand?.name || "brand"} guidelines, tone, or terms...`}
              className="flex-1 bg-[#141B2D] border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
