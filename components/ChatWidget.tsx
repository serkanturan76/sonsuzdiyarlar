import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithBot } from '../services/gemini';

interface ChatWidgetProps {
    loreContext: string | null;
    onMessageSent?: () => Promise<void>;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ loreContext, onMessageSent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Selam gezgin. Rehberliğe mi ihtiyacın var?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await chatWithBot(history, userMsg.text, loreContext);
      
      if (onMessageSent) {
          await onMessageSent();
      }

      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Ruhani bağlantı koptu." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl overflow-hidden flex flex-col h-96 animate-fade-in-up">
          <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-amber-500 font-bold text-sm">Diyar Kahini</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-amber-700 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-400 rounded-lg rounded-bl-none p-3 text-xs italic">
                  Kehanet iniyor...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Kahine danış..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button 
              type="submit" 
              disabled={isTyping}
              className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-full shadow-lg border-2 border-slate-800 transition-transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </button>
    </div>
  );
};

export default ChatWidget;