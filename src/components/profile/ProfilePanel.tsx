import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { listUserFiles, uploadUserFile, downloadUserFile, deleteUserFile } from '../../lib/storage';

export const ProfilePanel: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = supabase ? await supabase.auth.getSession() : { data: null };
        const user = data?.session?.user || null;
        setSessionUser(user);
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('display_name,avatar_url,estado_cuenta,trial_ends_at').eq('id', user.id).single();
          setName((profile as any)?.display_name || '');
          await refreshFiles(user.id);
        }
      } catch (err) {
        console.warn(err);
      }
    }
    load();
  }, []);

  const refreshFiles = async (userId?: string) => {
    try {
      const id = userId || sessionUser?.id;
      if (!id) return;
      const f = await listUserFiles(id);
      setFiles(f || []);
    } catch (err) { console.warn(err); }
  };

  const handleFileInput = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file || !sessionUser) return;
    setLoading(true);
    try {
      await uploadUserFile(sessionUser.id, file);
      await refreshFiles();
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!sessionUser) return;
    try {
      const path = `${sessionUser.id}/${fileName}`;
      const blob = await downloadUserFile(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { console.warn(err); }
  };

  const handleDelete = async (fileName: string) => {
    if (!sessionUser) return;
    try {
      const path = `${sessionUser.id}/${fileName}`;
      await deleteUserFile(path);
      await refreshFiles();
    } catch (err) { console.warn(err); }
  };

  const handleSaveProfile = async () => {
    if (!sessionUser) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({ id: sessionUser.id, display_name: name, updated_at: new Date().toISOString() }, { returning: 'minimal' });
      if (avatarFile) {
        await uploadUserFile(sessionUser.id, avatarFile);
        // Optionally set avatar_url in profile to path or public URL depending on privacy
      }
      await refreshFiles();
    } catch (err) { console.warn(err); }
    setLoading(false);
  };

  return (
    <div className="profile-panel">
      <h3>Mis Archivos</h3>
      <div className="upload-row">
        <input type="file" onChange={handleFileInput} />
      </div>

      <div className="files-list">
        {files.map((f) => (
          <div key={f.name} className="file-row">
            <div className="file-meta">
              <strong>{f.name}</strong>
              <span>{f.size} bytes</span>
            </div>
            <div className="file-actions">
              <button onClick={() => handleDownload(f.name)}>Descargar</button>
              <button onClick={() => handleDelete(f.name)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <h3>Ajustes de Perfil</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
      <input type="file" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
      <button onClick={handleSaveProfile} disabled={loading}>Guardar</button>
    </div>
  );
};

export default ProfilePanel;
