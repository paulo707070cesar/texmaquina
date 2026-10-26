import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Smartphone, Download, X, Share } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] sm:text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all animate-pulse"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 rounded-xl bg-[#0066FF]/20 hover:bg-[#0066FF]/30 border border-[#00C2FF]/40 text-[#00C2FF] font-bold text-[10px] sm:text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,194,255,0.2)] transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#0B1120] border border-white/10 p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center text-white shadow-xl mb-4">
                  <Smartphone className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Instalar TexMachina</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Adicione o sistema à sua tela de início para acesso rápido e visual em tela cheia.
                </p>
                
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#00C2FF] font-bold">1</div>
                    <p className="text-xs text-gray-200">Toque no botão <Share className="w-4 h-4 inline-block mx-1 mb-1" /> na barra do Safari.</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#00C2FF] font-bold">2</div>
                    <p className="text-xs text-gray-200">Role para baixo e toque em <strong className="text-white">"Adicionar à Tela de Início"</strong>.</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-8 w-full py-3 btn-electric rounded-xl font-bold text-sm shadow-xl"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
