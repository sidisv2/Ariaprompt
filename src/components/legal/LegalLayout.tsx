import React from 'react';
import { AppRoute } from '../../types';
import { Footer } from '../marketing/Footer';

interface LegalSection {
  title: string;
  body: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: LegalSection[];
  onRouteChange?: (route: AppRoute) => void;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  updatedAt,
  sections,
  onRouteChange,
}) => (
  <div className="min-h-screen bg-slate-950 text-white">
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Legal</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">{subtitle}</p>
        <p className="mt-3 text-xs font-semibold text-slate-500">Última actualización: {updatedAt}</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/5 bg-slate-950/60 p-5">
              <h2 className="text-lg font-extrabold text-white">{section.title}</h2>
              <p className="mt-3 whitespace-pre-line">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-50">
          Para consultas legales, privacidad o reembolsos, escríbenos a{' '}
          <a className="font-bold text-emerald-300 underline" href="mailto:legal@ariaprop.online">
            legal@ariaprop.online
          </a>
          .
        </div>
      </div>
    </main>
    <Footer onRouteChange={onRouteChange} />
  </div>
);
