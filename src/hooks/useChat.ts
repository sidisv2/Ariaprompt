import { useState, useEffect } from 'react';
import { INITIAL_BOT_CONFIG } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { generateStructuredAriaRealEstateResponse } from '../../api/_lib/openrouterService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  text?: string;
  timestamp: string;
  recommendedPropertyId?: string;
}

export function useChat(options?: { initialContext?: string }) {
  const { lang } = useLanguage();
  
  const defaultWelcomeMessage: ChatMessage = {
    id: 'welcome-1',
    sender: 'bot',
    content: INITIAL_BOT_CONFIG.welcomeMessage,
    text: INITIAL_BOT_CONFIG.welcomeMessage,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aria_slideover_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [defaultWelcomeMessage];
  });

  const [isTyping, setIsTyping] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('aria_slideover_chat_history', JSON.stringify(messages));
      }
    } catch (_) {}
  }, [messages]);

  const clearChat = () => {
    try {
      localStorage.removeItem('aria_slideover_chat_history');
      setMessages([defaultWelcomeMessage]);
    } catch (_) {}
  };

  const sendMessage = async (text: string, overrideContext?: string, _historyArg?: any) => {
    if (!text.trim()) return;
    const ctx = overrideContext || options?.initialContext || 'general';

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      content: text,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const botMessageId = `bot-${Date.now()}`;
    const placeholderBotMsg: ChatMessage = {
      id: botMessageId,
      sender: 'bot',
      content: '',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, placeholderBotMsg]);

    const historyPayload: { sender: 'user' | 'assistant'; content: string }[] = messages
      .filter((m) => m.content && m.content !== INITIAL_BOT_CONFIG.welcomeMessage)
      .map((m) => ({ sender: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.content || m.text || '' }));

    try {
      let replyText = '';

      // 1. First attempt call to /api/chat
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: historyPayload,
            context: ctx,
            lang,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply || data.replyText || data.message || data.text) {
            replyText = data.reply || data.replyText || data.message || data.text;
          }
        }
      } catch (apiErr) {
        console.warn('API /api/chat error, fallback to client engine:', apiErr);
      }

      // 2. Client-side generative engine fallback
      if (!replyText) {
        const fallback = await generateStructuredAriaRealEstateResponse({
          message: text,
          history: historyPayload,
          propertyContext: 'Catálogo de propiedades inmobiliarias activas disponibles en Argentina.',
          agentName: 'Aria',
          agencyName: 'Aria Prop',
        });
        replyText = fallback.replyText;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === botMessageId ? { ...m, content: replyText, text: replyText } : m))
      );
    } catch (err) {
      console.error('Error generating chat response:', err);
      const errText = 'Disculpas, ocurrió un error momentáneo al consultar el catálogo. Por favor intenta de nuevo en unos instantes.';
      setMessages((prev) =>
        prev.map((m) => (m.id === botMessageId ? { ...m, content: errText, text: errText } : m))
      );
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    send: sendMessage,
    clearChat,
  };
}
