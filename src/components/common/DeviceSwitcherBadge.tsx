import React, { useState } from 'react';
import { DeviceType } from '../../hooks/useDeviceType';
import { Monitor, Smartphone, RefreshCw, Sparkles, X, ChevronUp } from 'lucide-react';

interface DeviceSwitcherBadgeProps {
  deviceType: DeviceType;
  forcedDevice: DeviceType | null;
  overrideDevice: (type: DeviceType | null) => void;
  screenWidth: number;
}

export const DeviceSwitcherBadge: React.FC<DeviceSwitcherBadgeProps> = ({
  deviceType,
  forcedDevice,
  overrideDevice,
  screenWidth,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getLabel = () => {
    if (forcedDevice === 'desktop') return 'PC (Forzado)';
    if (forcedDevice === 'mobile') return 'Móvil (Forzado)';
    return deviceType === 'mobile' ? 'Modo App' : 'Modo PC';
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-20 z-40 font-sans">
      {expanded ? (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl shadow-emerald-500/20 text-xs text-white space-y-2.5 animate-in fade-in slide-in-from-bottom-2 w-60">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-extrabold text-emerald-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo de Interfaz</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-300 leading-tight">
            Resolución: <strong className="text-white">{screenWidth}px</strong>. Forzar vista:
          </p>

          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              onClick={() => {
                overrideDevice('desktop');
                setExpanded(false);
              }}
              className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 text-[9px] font-bold transition-all cursor-pointer ${
                forcedDevice === 'desktop'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC</span>
            </button>

            <button
              onClick={() => {
                overrideDevice('mobile');
                setExpanded(false);
              }}
              className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 text-[9px] font-bold transition-all cursor-pointer ${
                forcedDevice === 'mobile'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Móvil</span>
            </button>

            <button
              onClick={() => {
                overrideDevice(null);
                setExpanded(false);
              }}
              className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 text-[9px] font-bold transition-all cursor-pointer ${
                forcedDevice === null
                  ? 'bg-teal-500/20 text-teal-300 border-teal-400/40 font-extrabold'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-emerald-500/30 text-[10px] font-extrabold shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
          title="Alternar vista PC / App Móvil"
        >
          {deviceType === 'mobile' ? (
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="text-[10px]">{getLabel()}</span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      )}
    </div>
  );
};

export default DeviceSwitcherBadge;
