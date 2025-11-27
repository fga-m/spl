import React, { useState } from 'react';
import { AppState, ParsedLog } from './types';
import { parseSplLog, extractMetadataFromFilename } from './utils/parser';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [parsedLog, setParsedLog] = useState<ParsedLog | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        // 1. Local Parsing for data and stats
        const parsed = parseSplLog(content);
        
        // 2. Extract Metadata from filename (date format: YYYYMMDD)
        const { eventName, eventDate } = extractMetadataFromFilename(file.name);

        const logData: ParsedLog = {
          fileName: file.name,
          eventName,
          eventDate,
          data: parsed.data,
          stats: parsed.stats
        };
        
        setParsedLog(logData);
        setAppState(AppState.COMPLETE);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to process the log file.");
        setAppState(AppState.ERROR);
      }
    };
    reader.readAsText(file);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setParsedLog(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
        {/* Background gradient effects */}
        <div className="no-print fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-3 h-8 bg-blue-500 rounded-sm"></div>
           <h1 className="text-xl font-bold tracking-tight text-white">FGAM SPL Analyser</h1>
        </div>
      </div>

      <main className="flex flex-col items-center justify-center min-h-[80vh]">
        {appState === AppState.IDLE && (
           <div className="text-center w-full max-w-2xl animate-in fade-in zoom-in duration-500">
             <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
               Turn raw data into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">insight.</span>
             </h2>
             <p className="text-slate-400 text-lg mb-12">
               Upload your REW SPL logs to visualize loudness trends, identify peak moments, and generate reports.
             </p>
             <FileUpload onFileSelect={handleFileSelect} appState={appState} />
           </div>
        )}

        {appState === AppState.ANALYZING && (
           <FileUpload onFileSelect={() => {}} appState={appState} />
        )}

        {appState === AppState.ERROR && (
           <div className="text-center p-8 bg-red-500/10 border border-red-500/50 rounded-2xl max-w-md">
              <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h3>
              <p className="text-slate-300 mb-6">{errorMsg}</p>
              <button 
                onClick={resetApp}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
              >
                Try Again
              </button>
           </div>
        )}

        {appState === AppState.COMPLETE && parsedLog && (
           <div className="w-full">
             <Dashboard log={parsedLog} onReset={resetApp} />
           </div>
        )}
      </main>
      
      <footer className="no-print mt-12 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} FGAM SPL Analyser.</p>
      </footer>
    </div>
  );
};

export default App;