import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute, UserFile } from '../../types';
import { FileText, Download, Lock, ShieldCheck, Sparkles, Upload, ArrowRight, UserCheck, Trash2, Loader2, HardDrive } from 'lucide-react';
import { PLAN_LIMITS } from '../../lib/planLimits';
import {
  getUserFiles,
  uploadFileToSupabase,
  deleteUserFile,
  downloadFileToDevice,
  formatFileSize
} from '../../lib/storageService';

interface UserVaultPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const UserVaultPage: React.FC<UserVaultPageProps> = ({ onRouteChange }) => {
  const { user, openAuthModal } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const usernameSlug = user ? user.nombre.toLowerCase().replace(/\s+/g, '-') : 'invitado';

  // Load real files from storageService for authenticated user
  const loadFiles = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const filesData = await getUserFiles(user.id);
      setUserFiles(filesData);
    } catch (err) {
      console.warn('Error cargando archivos de bóveda privada:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [user]);

  // Real upload to Supabase Storage / local persistent fallback
  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    setStatusMsg(null);

    const res = await uploadFileToSupabase(user.id, file);

    if (res.success && res.fileData) {
      setUserFiles((prev) => [res.fileData!, ...prev.filter((f) => f.id !== res.fileData!.id)]);
      setStatusMsg(`✅ Archivo "${file.name}" guardado exitosamente en tu bóveda privada.`);
    } else {
      setStatusMsg(`⚠️ Error al subir el archivo: ${res.error || 'Error desconocido'}`);
    }
    setUploading(false);
  };

  // Real browser download using downloadFileToDevice
  const handleDownload = (file: UserFile) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    downloadFileToDevice(file.url, file.name, file.storagePath);
  };

  // Real file deletion
  const handleDelete = async (file: UserFile) => {
    if (!user) return;
    const confirmDelete = window.confirm(`¿Confirmás que querés eliminar "${file.name}" de tu bóveda privada?`);
    if (!confirmDelete) return;

    const res = await deleteUserFile(user.id, file.id, file.storagePath);
    if (res.success) {
      setUserFiles((prev) => prev.filter((f) => f.id !== file.id));
      setStatusMsg(`🗑️ Archivo "${file.name}" eliminado de tu bóveda.`);
    }
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
              <span>Bóveda Privada de Documentos</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Directorio Privado de Expedientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Subdirección encriptada exclusiva para usuarios suscritos. Subida y descarga de fichas inmobiliarias, contratos e informes financieros con persistencia real.
            </p>
          </div>

          {/* Subdirectory Breadcrumb Pill */}
          <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-bold shrink-0">
            Path: <span className="text-white">/user/{usernameSlug}/vault</span>
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
            <h3 className="text-2xl font-extrabold text-white">🔒 Acceso Restringido a Documentos</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Los usuarios no registrados o no suscritos no pueden recibir ni descargar expedientes privados. Cada usuario suscrito dispone de su propia subdirección privada y segura con aislamiento multi-tenant.
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
              <span>Ver Planes de Suscripción (desde ${PLAN_LIMITS.solo_agent.annualPriceUsd}/mes)</span>
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
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{uploading ? 'Guardando en Storage...' : 'Subir Archivo a la Bóveda'}</span>
              <input type="file" onChange={handleRealUpload} disabled={uploading} className="hidden" />
            </label>
          </div>

          {/* Feedback Status Message */}
          {statusMsg && (
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300 font-medium animate-fadeIn">
              {statusMsg}
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-3xl border border-white/5">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-medium">Cargando tus expedientes privados desde Supabase Storage...</p>
            </div>
          ) : userFiles.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-4 bg-slate-900/50 rounded-3xl border border-white/10">
              <HardDrive className="w-12 h-12 text-slate-500 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Tu bóveda privada está vacía</h3>
                <p className="text-xs text-slate-400 mt-1">Sube un contrato, ficha o reporte para guardarlo de forma segura en tu espacio privado.</p>
              </div>
            </div>
          ) : (
            /* Files Grid */
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
                      <div className="flex items-center gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/20 uppercase">
                          {file.type}
                        </span>
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar de la bóveda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2" title={file.name}>{file.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tamaño: {formatFileSize(file.sizeBytes)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(file)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Archivo Real</span>
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default UserVaultPage;
