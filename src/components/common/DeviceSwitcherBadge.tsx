import React from 'react';
import { DeviceType } from '../../hooks/useDeviceType';
import { Monitor, Smartphone, Tablet, RefreshCw, Sparkles } from 'lucide-react';

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
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="fixed bottom-16 right-3 sm:bottom-4 sm:right-4 z-50 font-sans">
      {expanded ? (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl shadow-emerald-500/20 text-xs text-white space-y-2.5 animate-in fade-in slide-in-from-bottom-2 w-64">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo de Interfaz</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/5"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-tight">
            Resolución: <strong className="text-white">{screenWidth}px</strong>. Cambia entre la interfaz nativa para PC y la App Móvil:
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => overrideDevice('desktop')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                deviceType === 'desktop' && forcedDevice === 'desktop'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white hover:border-emerald-500/40'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Vista PC</span>
            </button>

            <button
              onClick={() => overrideDevice('mobile')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                deviceType === 'mobile' && forcedDevice === 'mobile'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white hover:border-emerald-500/40'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>App Móvil</span>
            </button>
          </div>

          {forcedDevice && (
            <button
              onClick={() => overrideDevice(null)}
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer Detección Automática</span>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95 text-xs font-bold ${
            deviceType === 'mobile'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-400 shadow-emerald-500/20'
              : 'bg-slate-900/90 border-teal-500/60 text-teal-300 shadow-teal-500/20'
          }`}
          title="Haz clic para cambiar entre la versión de Escritorio (PC) y la Versión Móvil"
        >
          {deviceType === 'mobile' ? (
            <Smartphone className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-teal-300" />
          )}
          <span>{deviceType === 'mobile' ? 'App Móvil' : 'Modo PC'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-300 font-mono">
            {forcedDevice ? 'FORZADO' : 'AUTO'}
          </span>
        </button>
      )}
    </div>
  );
};
