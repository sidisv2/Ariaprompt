import React, { useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';

const PROMPT_CHIPS = [
  '📊 Calcular ROI de departamento',
  '🏠 Buscar inmuebles de 2 dormitorios',
  '📄 Consultar detalles de plano / dossier',
  '📅 Agendar visita virtual',
];

export const HeroInteractive: React.FC<{ initialContext?: string }> = ({ initialContext = 'general' }) => {
  const { send, messages, isTyping } = useChat({ initialContext: initialContext as any });
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user, openAuthModal } = useAuth();

  const getSentCount = () => {
    try { return parseInt(localStorage.getItem('sent_messages_count') || '0', 10); } catch { return 0; }
  };
  const incrementSentCount = () => {
    try { const s = getSentCount() + 1; localStorage.setItem('sent_messages_count', String(s)); } catch {}
  };

  const isAdmin = Boolean(user?.role === 'admin' || localStorage.getItem('aria_prop_mock_role') === 'admin');

  const handleChip = async (text: string) => {
    setValue(text);
    inputRef.current?.focus();
    setTimeout(async () => {
      await send(text, initialContext, messages);
      incrementSentCount();
    }, 120);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;

    await send(value, initialContext, messages);
    incrementSentCount();
    setValue('');
  };

  return (
    <div className="hero-interactive card glass-card p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm text-slate-300">Prueba rápida — escribe o usa un prompt</label>
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            className="input w-full"
            placeholder="Escribe tu consulta: ejemplo '¿Cuál es el ROI de este piso?'"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Hero chat input"
          />
          <button type="submit" className="btn primary">Probar</button>
        </div>

        <div className="chips flex gap-2 mt-2">
          {PROMPT_CHIPS.map((c, i) => (
            <button key={i} type="button" className="chip" onClick={() => handleChip(c)}>{c}</button>
          ))}
        </div>

        <div className="mt-3">
          {isTyping && <div className="text-xs text-slate-400 italic">Aria está pensando...</div>}
        </div>
      </form>
    </div>
  );
};

export default HeroInteractive;
