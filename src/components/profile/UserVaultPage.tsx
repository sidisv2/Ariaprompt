import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';
import { FileText, Download, Lock, ShieldCheck, Sparkles, Upload, ArrowRight, UserCheck } from 'lucide-react';

interface UserVaultPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const UserVaultPage: React.FC<UserVaultPageProps> = ({ onRouteChange }) => {
  const { user, openAuthModal } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [userFiles, setUserFiles] = useState([
    { id: '1', name: 'Dossier_Exclusivo_El_Poblado_2026.pdf', size: '4.8 MB', date: '2026-07-23', type: 'Dossier RAG' },
    { id: '2', name: 'Analisis_Financiero_ROI_Polanco.pdf', size: '2.3 MB', date: '2026-07-22', type: 'Informe Financiero' },
    { id: '3', name: 'Memoria_Calidades_Salamanca_Penthouse.pdf', size: '6.1 MB', date: '2026-07-20', type: 'Plano & Especificaciones' },
  ]);

  const usernameSlug = user ? user.nombre.toLowerCase().replace(/\s+/g, '-') : 'invitado';

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUserFiles((prev) => [
        {
          id: `file-${Date.now()}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          date: new Date().toISOString().split('T')[0],
          type: 'Expediente IA Cargado',
        },
        ...prev,
      ]);
      setUploading(false);
    }, 1200);
  };

  const handleDownload = (fileName: string) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    // Trigger simulated browser download
    const element = document.createElement('a');
    const fileContent = `PDF Dossier Privado para ${user.nombre}\n\nDocumento: ${fileName}\nGenerado por Aria Prop IA.`;
    const file = new Blob([fileContent], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8 animate-page-fade">
      
      {/* Header & Subdirectory Path Indicator */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl space-y-4 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>Bóveda Privada de Archivos PDF</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Directorio Privado de Expedientes PDF
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Subdirección encriptada exclusiva para usuarios suscritos. Descarga dossiers RAG, planos e informes financieros.
            </p>
          </div>

          {/* Subdirectory Breadcrumb Pill */}
          <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-bold shrink-0">
            Path: <span className="text-white">/#/user/{usernameSlug}/vault</span>
          </div>
        </div>
      </div>

      {/* Access Guard for Unsubscribed Visitors */}
      {!user ? (
        <div className="p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border border-emerald-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-extrabold text-white">🔒 Acceso Restringido a Dossiers PDF</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Los usuarios no registrados o no suscritos no pueden recibir ni descargar expedientes PDF privados. Cada usuario suscrito dispone de su propia subdirección privada y segura.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => openAuthModal('signup')}
              className="px-6 py-3 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Registrarme y Obtener Subdirección Privada</span>
            </button>
            <button
              onClick={() => onRouteChange('pricing')}
              className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver Planes de Suscripción ($19/mes)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Subscribed User File Vault List */
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Expedientes asignados a: <strong className="text-emerald-400 font-extrabold">{user.nombre}</strong> ({user.email})</span>
            </div>

            <label className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Cargando expediente...' : 'Subir Nuevo PDF'}</span>
              <input type="file" accept=".pdf" onChange={handleSimulatedUpload} disabled={uploading} className="hidden" />
            </label>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userFiles.map((file) => (
              <div
                key={file.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between group transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/20">
                      {file.type}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-2">{file.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Tamaño: {file.size} • Fecha: {file.date}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(file.name)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Expediente PDF</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};

export default UserVaultPage;
