import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Sparkles,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Building,
  Crown,
  Loader2,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export interface CommercialAdvisor {
  id: string;
  name: string;
  phone: string;
  specialty: 'Ventas' | 'Alquileres' | 'Tasaciones' | 'General';
  isOnDuty: boolean;
  assignedLeadsCount: number;
}

export function getNextAvailableAdvisor(advisors: CommercialAdvisor[]): CommercialAdvisor | null {
  const activeAdvisors = advisors.filter((a) => a.isOnDuty);
  if (activeAdvisors.length === 0) return null;

  // Round Robin: Pick advisor with lowest assignedLeadsCount
  const sorted = [...activeAdvisors].sort((a, b) => a.assignedLeadsCount - b.assignedLeadsCount);
  return sorted[0];
}

export function generateAdvisorWhatsappHandoverUrl(
  advisor: CommercialAdvisor,
  leadName = 'Valentin Morales',
  propertyTitle = 'Departamento 3 amb Palermo'
): string {
  const cleanPhone = advisor.phone.replace(/\D/g, '');
  const message = encodeURIComponent(
    `👋 Hola ${advisor.name}, te asignamos a ${leadName} interesado en ${propertyTitle}. Ficha comercial en panel.`
  );
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

export const TeamAssignmentSettings: React.FC = () => {
  const { user } = useAuth();
  const [advisors, setAdvisors] = useState<CommercialAdvisor[]>([
    {
      id: 'adv-1',
      name: 'Luciana Gómez',
      phone: '5491140143729',
      specialty: 'Ventas',
      isOnDuty: true,
      assignedLeadsCount: 14,
    },
    {
      id: 'adv-2',
      name: 'Matías Fernández',
      phone: '5491155228811',
      specialty: 'Alquileres',
      isOnDuty: true,
      assignedLeadsCount: 12,
    },
    {
      id: 'adv-3',
      name: 'Sofía Rossi',
      phone: '5492604014372',
      specialty: 'Tasaciones',
      isOnDuty: false,
      assignedLeadsCount: 9,
    },
  ]);

  // New Advisor Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSpecialty, setNewSpecialty] = useState<CommercialAdvisor['specialty']>('Ventas');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulation State
  const [simulationResult, setSimulationResult] = useState<{
    advisor: CommercialAdvisor | null;
    whatsappUrl: string;
  } | null>(null);

  // Cargar asesores desde Supabase (tabla organizations -> team_members o round_robin_agents)
  useEffect(() => {
    async function loadTeam() {
      if (!supabase || !user?.id) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('team_members, round_robin_agents')
            .eq('id', profile.organization_id)
            .maybeSingle();

          const loaded = org?.team_members || org?.round_robin_agents;
          if (loaded) {
            const parsed = typeof loaded === 'string' ? JSON.parse(loaded) : loaded;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAdvisors(parsed);
            }
          }
        }
      } catch (e) {
        console.warn('Could not load team advisors from Supabase:', e);
      }
    }
    loadTeam();
  }, [user]);

  // Persistir cambios en Supabase
  const persistAdvisors = async (updated: CommercialAdvisor[]) => {
    setAdvisors(updated);
    if (!supabase || !user?.id) return;

    try {
      setSaving(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.organization_id) {
        await supabase
          .from('organizations')
          .update({
            team_members: updated,
            round_robin_agents: updated,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.organization_id);

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving team advisors to Supabase:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const cleanPhone = newPhone.replace(/[^0-9]/g, '');

    const newAdvisor: CommercialAdvisor = {
      id: 'adv-' + Date.now(),
      name: newName.trim(),
      phone: cleanPhone,
      specialty: newSpecialty,
      isOnDuty: true,
      assignedLeadsCount: 0,
    };

    const updated = [...advisors, newAdvisor];
    await persistAdvisors(updated);

    setNewName('');
    setNewPhone('');
  };

  const handleToggleDuty = async (id: string) => {
    const updated = advisors.map((a) => (a.id === id ? { ...a, isOnDuty: !a.isOnDuty } : a));
    await persistAdvisors(updated);
  };

  const handleDeleteAdvisor = async (id: string) => {
    const updated = advisors.filter((a) => a.id !== id);
    await persistAdvisors(updated);
  };

  const handleSimulateAssignment = () => {
    const nextAdv = getNextAvailableAdvisor(advisors);
    if (!nextAdv) {
      setSimulationResult({ advisor: null, whatsappUrl: '' });
      return;
    }

    const url = generateAdvisorWhatsappHandoverUrl(nextAdv);
    setSimulationResult({ advisor: nextAdv, whatsappUrl: url });

    // Increment count in state and persist
    const updated = advisors.map((a) =>
      a.id === nextAdv.id ? { ...a, assignedLeadsCount: a.assignedLeadsCount + 1 } : a
    );
    persistAdvisors(updated);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-6 text-white backdrop-blur-xl font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">
                Asignación Inteligente de Leads (Round-Robin)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                <Crown className="w-3 h-3 inline mr-1 text-amber-400" />
                Agency Pro / Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribución equitativa y rotativa de prospectos calificados entre tus asesores comerciales en guardia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Sincronizado
            </span>
          )}

          <button
            type="button"
            onClick={handleSimulateAssignment}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Simular Asignación de Turno ✨</span>
          </button>
        </div>
      </div>

      {/* Simulation Result Toast */}
      {simulationResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300 space-y-2">
          {simulationResult.advisor ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>¡Turno asignado a {simulationResult.advisor.name}!</strong> (Total acumulado: {simulationResult.advisor.assignedLeadsCount} leads)
                </span>
              </div>
              <a
                href={simulationResult.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] hover:bg-emerald-400 transition-colors"
              >
                Abrir Alerta WhatsApp 📲
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>No hay asesores comerciales en guardia actualmente. Activá al menos 1 asesor.</span>
            </div>
          )}
        </div>
      )}

      {/* Grid: Add Form + Advisors List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form (5 Cols) */}
        <form onSubmit={handleAddAdvisor} className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-4 text-xs">
          <h4 className="font-extrabold text-white text-sm flex items-center gap-2 border-b border-white/10 pb-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Añadir Asesor Comercial
          </h4>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Nombre Completo</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Luciana Gómez"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:border-emerald-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              WhatsApp Comercial (con código de país)
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Ej: 5491140143729"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:border-emerald-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Especialidad</label>
            <select
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:border-emerald-400 outline-none cursor-pointer"
            >
              <option value="Ventas">Ventas (Propiedades en venta)</option>
              <option value="Alquileres">Alquileres (Tradicional y Temporal)</option>
              <option value="Tasaciones">Tasaciones y Valuaciones</option>
              <option value="General">General (Todas las consultas)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !newName.trim() || !newPhone.trim()}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <UserPlus className="w-4 h-4" />}
            <span>Añadir Asesor al Turnero</span>
          </button>
        </form>

        {/* Right Column: Active Advisors List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              Asesores Configurados ({advisors.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              {advisors.filter((a) => a.isOnDuty).length} en guardia activa
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {advisors.map((adv) => (
              <div
                key={adv.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  adv.isOnDuty
                    ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                      adv.isOnDuty
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {adv.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-xs text-white truncate">{adv.name}</h5>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-slate-300 font-bold border border-white/10">
                        {adv.specialty}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      WhatsApp: {adv.phone} • Asignados: {adv.assignedLeadsCount} leads
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleDuty(adv.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                      adv.isOnDuty
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {adv.isOnDuty ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>En Guardia</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>Fuera de Turno</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteAdvisor(adv.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default TeamAssignmentSettings;
