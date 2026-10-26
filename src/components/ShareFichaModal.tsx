import React, { useState } from 'react';
import { Machine } from '../services/api';
import { 
  copyFichaImageToClipboard, 
  downloadFichaCard, 
  formatCurrency 
} from '../utils/generateFichaImage';
import { 
  X, 
  Copy, 
  Download, 
  Share2, 
  Check, 
  Image as ImageIcon, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface ShareFichaModalProps {
  machine: Machine | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ShareFichaModal: React.FC<ShareFichaModalProps> = ({ machine, onClose, onToast }) => {
  if (!machine) return null;

  const [copyingImage, setCopyingImage] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const getProposalText = () => {
    return (
      `🏭 *TEXMACHINA - PROPOSTA & FICHA TÉCNICA*\n\n` +
      `📌 *Equipamento:* ${machine.name}\n` +
      `⚙️ *Modelo/Bitola:* ${machine.model}\n` +
      `🏷️ *Série Industrial:* #TEX-0${machine.id}-2024\n` +
      `💰 *Valor de Venda:* ${formatCurrency(machine.price)}\n` +
      `🛡️ *Status:* ${machine.status === 'disponivel' ? 'Disponível em Estoque' : 'Em Manutenção'}\n` +
      `📄 *Condições:* FINAME / Financiamento Industrial / À Vista\n\n` +
      `📋 *Especificações Técnicas:*\n${machine.description || 'Equipamento revisado com laudo mecânico e elétrico completo.'}\n\n` +
      `📸 *Foto do Equipamento:* ${machine.image_url}\n\n` +
      `_Enviado através do TexMachina OS - Sistema B2B de Máquinas Têxteis_`
    );
  };

  const handleCopyImage = async () => {
    setCopyingImage(true);
    try {
      const success = await copyFichaImageToClipboard(machine);
      if (success) {
        onToast('Imagem da Ficha Técnica copiada! Cole no WhatsApp com Ctrl+V.');
      } else {
        // Fallback: download directly if clipboard write is blocked by browser policy
        await downloadFichaCard(machine);
        onToast('Imagem baixada em PNG para você anexar no WhatsApp!');
      }
    } catch (err) {
      await downloadFichaCard(machine);
      onToast('Flyer em PNG baixado para envio no WhatsApp!');
    } finally {
      setCopyingImage(false);
    }
  };

  const handleDownloadCard = async () => {
    setDownloading(true);
    try {
      await downloadFichaCard(machine);
      onToast('Ficha Técnica em PNG baixada com sucesso!');
    } catch (err) {
      onToast('Erro ao gerar imagem para download.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyText = () => {
    const text = getProposalText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      onToast('Texto da proposta copiado para a área de transferência!');
      setTimeout(() => setCopiedText(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(getProposalText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0B1120] w-full max-w-lg rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 border border-[#00C2FF]/40 text-[#00C2FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,194,255,0.3)]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Compartilhar Ficha Técnica no WhatsApp
              </h3>
              <p className="text-[11px] text-gray-400">
                Copie a imagem e texto para colar diretamente na conversa com o cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Card Preview */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4 items-center">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10 relative">
              <img
                src={machine.image_url}
                alt={machine.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 text-[#00C2FF] px-1 rounded font-bold">
                HD
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-[#00C2FF] block tracking-wider">
                {machine.name.split(' ')[0]} Têxtil
              </span>
              <h4 className="font-display font-bold text-sm text-white truncate">
                {machine.name}
              </h4>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                Modelo: {machine.model}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-extrabold text-sm text-white tabular-nums">
                  {formatCurrency(machine.price)}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {machine.status === 'disponivel' ? 'Em Estoque' : 'Revisado'}
                </span>
              </div>
            </div>
          </div>

          {/* Action 1: Copy Image to Clipboard (Ctrl+V) */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copyingImage}
              className="w-full p-4 rounded-2xl btn-electric text-white text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(0,102,255,0.4)] disabled:opacity-60 transition-all group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
                  {copyingImage ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block">1. Copiar Imagem da Máquina</span>
                  <span className="text-[11px] text-white/80 font-normal">
                    Depois é só abrir o WhatsApp e dar <strong>Ctrl + V</strong> para colar a foto!
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>

            {/* Action 2: Download Card PNG */}
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={downloading}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#00C2FF]/40 text-left text-xs transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0066FF]/20 text-[#00C2FF] flex items-center justify-center flex-shrink-0">
                  {downloading ? (
                    <div className="w-4 h-4 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-white text-xs block group-hover:text-[#00C2FF]">
                    2. Baixar Imagem da Ficha Técnica (PNG)
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Salva a arte executiva completa com fotos e especificações no seu dispositivo
                  </span>
                </div>
              </div>
            </button>

            {/* Action 3: Open Direct WhatsApp with formatted message */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left text-xs transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <div>
                  <span className="font-bold text-white text-xs block group-hover:text-emerald-300">
                    3. Abrir WhatsApp com a Proposta Formatada
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Abre a mensagem completa com dados técnicos, valor e link da foto
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Action 4: Copy Formatted Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-left text-xs transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Copy className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 font-medium">Copiar texto da proposta para área de transferência</span>
              </div>
              {copiedText ? (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado!</span>
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
