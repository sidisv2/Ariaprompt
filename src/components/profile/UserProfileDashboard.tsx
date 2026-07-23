import React, { useState } from 'react';
import {
  User,
  FolderKey,
  ShieldCheck,
  Code,
  Copy,
  Check,
  Sparkles,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';
import { FileManagerView } from './FileManagerView';
import { ProfileSettingsView } from './ProfileSettingsView';
import { SUPABASE_STORAGE_RLS_SQL } from '../../lib/storageService';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';

interface UserProfileDashboardProps {
  initialTab?: 'profile' | 'files' | 'security';
  onRouteChange?: (route: AppRoute) => void;
}

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({
  initialTab = 'files',
  onRouteChange,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'profile' | 'security'>(initialTab);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_STORAGE_RLS_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Panel Personal</span>
            {user && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {user.nombre}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona tus archivos en Supabase Storage y personaliza las preferencias de tu cuenta.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKey className="w-4 h-4" />
            <span>Mis Archivos</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ajustes de Perfil</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Reglas RLS</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'files' && <FileManagerView />}

      {activeTab === 'profile' && <ProfileSettingsView />}

      {activeTab === 'security' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Seguridad y Privacidad RLS en Supabase Storage</h2>
                <p className="text-xs text-slate-400">
                  Políticas de nivel de fila (Row Level Security / RLS) configuradas para aislar carpetas por `user_id`.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Bucket Supabase</span>
                <p className="text-xs font-bold text-white">`user-files`</p>
                <p className="text-[11px] text-slate-500">Almacenamiento directo en la nube.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ruta de Aislamiento</span>
                <p className="text-xs font-bold text-white">`user-files/{`{user_id}`}/...`</p>
                <p className="text-[11px] text-slate-500">Ningún otro usuario puede acceder.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Estado de Permisos</span>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Restringido a Propietario
                </p>
                <p className="text-[11px] text-slate-500">Solo auth.uid() asignado.</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-emerald-400" /> Script SQL para el Editor de Supabase
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar SQL RLS
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {SUPABASE_STORAGE_RLS_SQL}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
