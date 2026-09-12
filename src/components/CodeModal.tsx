import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileText, Download, CheckCircle2, Rocket, Globe } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/netlify_index.html')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load HTML file');
          return res.text();
        })
        .then((text) => {
          setHtmlCode(text);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error loading template:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (!htmlCode) return;
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 text-red-400 p-2 rounded-xl border border-red-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Netlify Ready: Production Single-File HTML Code
              </h2>
              <p className="text-xs text-zinc-400">
                Tailwind CSS, Lucide icons, full Movie Detail view, header-based CSV parsing, cache & routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights Banner */}
        <div className="p-4 bg-red-950/25 border-b border-red-900/30 text-xs text-zinc-300 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Header-Based CSV:</strong> Flexible Google Sheet mapping</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Full Detail View:</strong> Dedicated synopsis page (#movie/id)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Netlify Drop:</strong> Single self-contained index.html file</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-zinc-200">index.html</span>
            <span>(Self-contained single file ready for Netlify)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isLoading || !htmlCode}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download index.html</span>
            </button>

            <button
              onClick={copyToClipboard}
              disabled={isLoading || !htmlCode}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full HTML Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#09090b] font-mono text-xs text-zinc-300 select-all leading-relaxed max-h-[50vh]">
          {isLoading ? (
            <div className="py-12 text-center text-zinc-500">Loading code template...</div>
          ) : (
            <pre className="whitespace-pre overflow-x-auto">{htmlCode}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <span>
            🚀 <strong>Netlify တွင်တင်နည်း:</strong> ဤ Code ကို <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">index.html</code> အဖြစ် သိမ်းပြီး Netlify Drop သို့ ဆွဲထည့်ရုံဖြင့် ချက်ချင်း Live ဖြစ်သွားပါမည်။
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
