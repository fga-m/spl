import React from 'react';
import { ParsedLog } from '../types';
import SplChart from './SplChart';
import { Calendar, Clock, Volume2, Music, AlertTriangle, FileText, ShieldCheck, Printer } from 'lucide-react';

interface DashboardProps {
  log: ParsedLog;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ log, onReset }) => {
  const { stats, eventName, eventDate } = log;

  // Determine safety colors
  const getSafetyColor = (level: string) => {
    switch(level) {
      case 'High Risk': return 'red';
      case 'Moderate': return 'yellow';
      default: return 'green';
    }
  };
  const safetyColor = getSafetyColor(stats.safetyLevel);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Header Section: Event and Date */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between items-center">
        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">Analysis Report</span>
              </div>
              <button 
                onClick={handlePrint}
                className="no-print flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
                <span className="text-sm font-medium">Print</span>
              </button>
          </div>
          
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
              {eventName}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-slate-200">{eventDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{stats.durationString}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Average SPL */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[160px]">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Volume2 className="w-32 h-32" />
          </div>
          <p className="text-slate-400 font-medium mb-2 uppercase tracking-wide text-sm">Average SPL</p>
          <div className="text-5xl font-bold text-white tracking-tighter">
            {stats.averageSpl.toFixed(1)} <span className="text-xl text-slate-500 font-normal">dB</span>
          </div>
        </div>

        {/* 2. Safety Assessment */}
         <div className={`
            border p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[160px]
            ${safetyColor === 'red' ? 'bg-red-950/30 border-red-500/30' : 
              safetyColor === 'yellow' ? 'bg-yellow-950/30 border-yellow-500/30' : 
              'bg-green-950/30 border-green-500/30'}
        `}>
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ShieldCheck className={`w-32 h-32 text-${safetyColor}-500`} />
            </div>
            <p className={`font-medium mb-2 uppercase tracking-wide text-sm text-${safetyColor}-400`}>Safety Level</p>
            <div className={`text-3xl lg:text-4xl font-bold tracking-tighter mb-1 text-${safetyColor}-400`}>
              {stats.safetyLevel}
            </div>
             <p className="text-xs text-slate-400 opacity-80">
                Avg: {stats.averageSpl.toFixed(1)} dB
            </p>
        </div>

        {/* 3. Loudest Moment (Top 1) */}
         <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[160px]">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Music className="w-32 h-32" />
          </div>
          <p className="text-slate-400 font-medium mb-2 uppercase tracking-wide text-sm">Peak SPL</p>
          <div className="text-5xl font-bold text-white tracking-tighter">
            {stats.top3Loudest[0].value} <span className="text-xl text-slate-500 font-normal">dB</span>
          </div>
          <div className="text-sm text-purple-400 mt-2 font-mono">
             at {stats.top3Loudest[0].timestamp}
          </div>
        </div>

        {/* 4. Max SPL Before 10 AM */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[160px]">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Clock className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                Before 10AM
            </p>
            {stats.maxSplBefore10am ? (
                <>
                <div className="text-5xl font-bold text-white tracking-tighter">
                    {stats.maxSplBefore10am.value} <span className="text-xl text-slate-500 font-normal">dB</span>
                </div>
                <div className="text-sm text-yellow-500 mt-2 font-mono">
                    at {stats.maxSplBefore10am.timestamp}
                </div>
                </>
            ) : (
                <div className="text-2xl text-slate-600 font-medium mt-2">None Recorded</div>
            )}
          </div>
        </div>

      </div>

      {/* Main Content Split: Chart & Top 3 List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2">
           <SplChart data={log.data} stats={stats} />
        </div>

        {/* Top 3 List Column */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Top 3 Loudest Moments
            </h3>
            <div className="space-y-4 flex-1">
                {stats.top3Loudest.map((point, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-4">
                            <span className={`
                                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                ${idx === 0 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}
                            `}>
                                #{idx + 1}
                            </span>
                            <div>
                                <p className="text-slate-200 font-medium font-mono">{point.timestamp}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-xl font-bold text-red-400">{point.value} dB</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800 no-print">
                <button 
                    onClick={onReset}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-blue-500/20"
                >
                    Analyze New Log
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;