import React from 'react';

interface RealtimeDotProps {
  label?: string;
  className?: string;
}

export const RealtimeDot: React.FC<RealtimeDotProps> = ({ label = 'Sistemas Operativos 24/7', className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>{label}</span>
    </div>
  );
};
