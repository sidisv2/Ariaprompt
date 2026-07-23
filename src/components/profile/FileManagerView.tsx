import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Search,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Filter,
  RefreshCw,
  Eye,
  X,
  FileSpreadsheet,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserFile } from '../../types';
import {
  getUserFiles,
  uploadFileToSupabase,
  deleteUserFile,
  downloadFileToDevice,
  formatFileSize
} from '../../lib/storageService';

export const FileManagerView: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'pdf' | 'document'>('all');
  
  // Delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<UserFile | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // File Preview Modal
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files when user is available
  useEffect(() => {
    if (user) {
      loadFiles();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadFiles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userFiles = await getUserFiles(user.id);
      setFiles(userFiles);
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadSuccess(null);

    const result = await uploadFileToSupabase(user.id, file, (progress) => {
      setUploadProgress(progress);
    });

    setUploading(false);

    if (result.success && result.fileData) {
      setUploadSuccess(`Archivo "${file.name}" subido exitosamente a Supabase Storage`);
      setFiles((prev) => [result.fileData!, ...prev]);
      setTimeout(() => setUploadSuccess(null), 4000);
    } else {
      setUploadError(result.error || 'Ocurrió un error al subir el archivo');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !fileToDelete) return;
    setDeleting(true);
    try {
      await deleteUserFile(user.id, fileToDelete.id, fileToDelete.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err) {
      console.error('Error deleting file:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Filter and search logic
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeFilter === 'all' || f.type === activeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate total space used
  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalSizeFormatted = formatFileSize(totalSizeBytes);

  const getFileIcon = (type: string, mimeType: string) => {
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (type === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (type === 'document' && (mimeType.includes('sheet') || mimeType.includes('xls'))) {
      return <FileSpreadsheet className="w-5 h-5 text-teal-400" />;
    }
    return <File className="w-5 h-5 text-cyan-400" />;
  };

  if (!user) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso a Almacenamiento Privado</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Inicia sesión para acceder a tu panel de archivos personales en la nube, protegidos mediante Supabase Row Level Security (RLS).
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <UserCheck className="w-5 h-5" />
          Iniciar Sesión / Registrarse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Storage Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Mis Archivos en Supabase Storage</h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Privado (RLS)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Almacenamiento seguro por cuenta (`user-files/{user.id}/*`)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300">
            <div>
              <span className="text-slate-400">Archivos:</span>{' '}
              <span className="text-white font-bold">{files.length}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-400">Espacio Usado:</span>{' '}
              <span className="text-emerald-400 font-bold">{totalSizeFormatted}</span>
            </div>
            <button
              onClick={loadFiles}
              title="Recargar archivos"
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Drag and Drop Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all cursor-pointer relative overflow-hidden group ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              <span className="text-emerald-400 hover:underline">Haz clic para subir</span> o arrastra tus archivos aquí
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Soporta Imágenes (PNG, JPG), Documentos (PDF, Word, Excel) hasta 50MB
            </p>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center px-6 z-20">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Subiendo a Supabase Storage...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs font-medium animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Search and Filters bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de archivo..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>
          {(['all', 'image', 'pdf', 'document'] as const).map((filter) => {
            const labels = {
              all: 'Todos',
              image: 'Imágenes',
              pdf: 'PDFs',
              document: 'Documentos',
            };
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Files List / Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs text-slate-400">Cargando tus archivos desde Supabase Storage...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl py-12 px-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
            <File className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">
              {searchQuery || activeFilter !== 'all'
                ? 'No se encontraron archivos con los filtros aplicados'
                : 'Aún no has subido ningún archivo'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Sube tus documentos, fotos o contratos para guardarlos de forma segura en tu espacio personal de Supabase.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 group transition-all duration-200 hover:shadow-lg hover:shadow-black/40"
            >
              {/* Top Row: File Thumbnail / Icon & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {file.type === 'image' && file.url ? (
                    <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800 relative group/img">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {getFileIcon(file.type, file.mimeType)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-white truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatFileSize(file.sizeBytes)} • {new Date(file.uploadedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Row (Mobile Friendly Buttons) */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                {file.type === 'image' && (
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Vista previa"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver</span>
                  </button>
                )}

                <button
                  onClick={() => downloadFileToDevice(file.url, file.name)}
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="font-medium">Descargar</span>
                </button>

                <button
                  onClick={() => setFileToDelete(file)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">¿Eliminar archivo?</h3>
              <p className="text-xs text-slate-400 mt-1">
                ¿Estás seguro de que deseas eliminar permanentemente{' '}
                <span className="text-white font-semibold">"{fileToDelete.name}"</span>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Eliminando...
                  </>
                ) : (
                  'Sí, Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white truncate max-w-xs">{previewFile.name}</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-hidden flex items-center justify-center bg-slate-950 rounded-xl p-2 border border-slate-800/80">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => downloadFileToDevice(previewFile.url, previewFile.name)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" /> Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
