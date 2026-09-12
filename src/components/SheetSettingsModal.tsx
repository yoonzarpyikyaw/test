import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Link as LinkIcon, Table, Check, AlertCircle, Database, ShieldCheck } from 'lucide-react';
import { normalizeGoogleSheetUrl, DEFAULT_SHEET_URL } from '../utils/csvParser';
import { getSupabaseConfig, setSupabaseConfig, fetchMoviesFromSupabase } from '../services/supabase';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetUrl: string;
  onUpdateSheetUrl: (newUrl: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSheetUrl,
  onUpdateSheetUrl,
  onRefresh,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'sheet'>('supabase');

  // Supabase states
  const [supabaseUrl, setSupabaseUrlState] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKeyState] = useState('');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  // Google Sheet states
  const [urlInput, setUrlInput] = useState(currentSheetUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrlState(config.url.includes('your-project') ? '' : config.url);
    setSupabaseAnonKeyState(config.anonKey);
    setUrlInput(currentSheetUrl);
  }, [currentSheetUrl, isOpen]);

  if (!isOpen) return null;

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setSavedSuccess(true);
    onRefresh();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestSupabase = async () => {
    setTestResult({ status: 'testing', message: 'Testing Supabase connection...' });
    setSupabaseConfig(supabaseUrl, supabaseAnonKey);
    const movies = await fetchMoviesFromSupabase();
    if (movies !== null) {
      setTestResult({
        status: 'success',
        message: `Connected successfully! Found ${movies.length} active movies in PostgreSQL.`
      });
    } else {
      setTestResult({
        status: 'error',
        message: 'Could not connect. Please check Project URL, Anon Key, and RLS policies.'
      });
    }
  };

  const handleSaveSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeGoogleSheetUrl(urlInput);
    setUrlInput(normalized);
    onUpdateSheetUrl(normalized);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetDefault = () => {
    setUrlInput(DEFAULT_SHEET_URL);
    onUpdateSheetUrl(DEFAULT_SHEET_URL);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="bg-red-600/20 text-red-400 p-2 rounded-xl border border-red-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Database & Admin Settings</h2>
              <p className="text-xs text-zinc-400">Production Supabase & Google Sheets ချိတ်ဆက်မှု</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 bg-black/40 px-6 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'supabase'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase PostgreSQL (Production)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'sheet'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Google Sheets (Admin / Fallback)</span>
          </button>
        </div>

        {activeTab === 'supabase' ? (
          /* Supabase Tab */
          <form onSubmit={handleSaveSupabase} className="p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Supabase Project URL:
                </label>
                <div className="relative">
                  <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrlState(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Supabase Anon Public Key:
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKeyState(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  * Public Anon Key ဖြစ်၍ ဘရောက်ဇာတွင် ဖတ်ရှုရန် လုံခြုံမှုရှိပါသည်။ (Service Role key မထည့်ပါနှင့်)
                </p>
              </div>
            </div>

            {testResult.message && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : testResult.status === 'error'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                {testResult.status === 'testing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {testResult.status === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {testResult.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={!supabaseUrl || !supabaseAnonKey || testResult.status === 'testing'}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold rounded-xl transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved & Applied!</span>
                  </>
                ) : (
                  <span>Save Supabase Config</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Google Sheet Tab */
          <form onSubmit={handleSaveSheet} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Google Sheet Published CSV URL:
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span>Google Sheet Admin Workflow:</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Google Sheet တွင် Title + Year ထည့်ပြီး <code className="text-emerald-400">🎬 Movie Tools</code> မှ Fetch TMDB နှင့် Sync to Supabase လုပ်ဆောင်နိုင်ပါသည်။
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
              >
                Reset to Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save & Load</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
