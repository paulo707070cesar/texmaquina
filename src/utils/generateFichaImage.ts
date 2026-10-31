import { Machine } from '../services/api';

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontPrefix: string,
  baseSize: number,
  minSize = 14
): void {
  let size = baseSize;
  ctx.font = `${fontPrefix} ${size}px "Plus Jakarta Sans", sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${fontPrefix} ${size}px "Plus Jakarta Sans", sans-serif`;
  }
  const safeText = ctx.measureText(text).width <= maxWidth
    ? text
    : `${text.slice(0, Math.max(3, Math.floor(text.length * maxWidth / ctx.measureText(text).width) - 3))}...`;
  ctx.fillText(safeText, x, y);
}

/**
 * Generates an executive visual Ficha Técnica card in PNG format on an HTML5 canvas.
 */
export interface FichaBranding { logoUrl?: string | null; companyName?: string | null; whatsapp?: string | null; }

export async function generateFichaCardCanvas(machine: Machine, branding: FichaBranding = {}): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar o canvas 2D.');

  // 1. Background dark gradient (#080C14 -> #0E1626)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#080C14');
  bgGrad.addColorStop(0.5, '#0B1120');
  bgGrad.addColorStop(1, '#090D18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient neon glow sweeps
  const glow = ctx.createRadialGradient(width - 200, 200, 50, width - 200, 200, 500);
  glow.addColorStop(0, 'rgba(0, 194, 255, 0.25)');
  glow.addColorStop(1, 'rgba(0, 102, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // 3. Company branding header
  const logoX = 80, logoY = 62, logoSize = 54;
  if (branding.logoUrl) {
    try {
      const logo = new Image(); logo.crossOrigin = 'anonymous'; logo.src = branding.logoUrl;
      await new Promise<void>((resolve, reject) => {
        if (logo.complete && logo.naturalWidth > 0) resolve();
        else { logo.onload = () => resolve(); logo.onerror = () => reject(); }
      });
      ctx.save(); ctx.beginPath(); ctx.roundRect(logoX, logoY, logoSize, logoSize, 10); ctx.clip();
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(logoX, logoY, logoSize, logoSize);
      const scale = Math.min(logoSize / logo.width, logoSize / logo.height);
      const dw = logo.width * scale, dh = logo.height * scale;
      ctx.drawImage(logo, logoX + (logoSize - dw) / 2, logoY + (logoSize - dh) / 2, dw, dh); ctx.restore();
    } catch { ctx.fillStyle = '#0066FF'; ctx.beginPath(); ctx.roundRect(logoX, logoY, logoSize, logoSize, 10); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 21px "Plus Jakarta Sans", sans-serif'; ctx.fillText('TM', logoX + 13, logoY + 34); }
  } else { ctx.fillStyle = '#0066FF'; ctx.beginPath(); ctx.roundRect(logoX, logoY, logoSize, logoSize, 10); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 21px "Plus Jakarta Sans", sans-serif'; ctx.fillText('TM', logoX + 13, logoY + 34); }
  ctx.fillStyle = '#FFFFFF';
  drawFittedText(ctx, branding.companyName?.trim() || 'TEXMACHINA • MÁQUINAS TÊXTEIS', 150, 94, 440, 'bold', 28, 20);
  if (branding.whatsapp?.trim()) {
    ctx.fillStyle = '#10B981'; ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif'; ctx.fillText('WHATSAPP', 610, 82);
    ctx.fillStyle = '#D1FAE5'; drawFittedText(ctx, branding.whatsapp.trim(), 610, 106, 190, 'bold', 17, 12);
  }
  ctx.fillStyle = 'rgba(0, 194, 255, 0.15)'; ctx.strokeStyle = 'rgba(0, 194, 255, 0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(width - 380, 65, 300, 50, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#00C2FF'; ctx.font = 'bold 21px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`REF. #${machine.id}`, width - 230, 96); ctx.textAlign = 'left';
  ctx.fillStyle = '#00C2FF'; ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('FICHA COMERCIAL DO EQUIPAMENTO', 80, 145);
  // 4. Draw Machine Photo Frame
  const imgBoxX = 80;
  const imgBoxY = 180;
  const imgBoxW = width - 160;
  const imgBoxH = 580;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 28);
  ctx.clip();

  // Try loading image
  let imageLoaded = false;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = machine.image_url;

    await new Promise<void>((resolve, reject) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => reject();
      }
    });

    // Draw scaled cover image
    const hRatio = imgBoxW / img.width;
    const vRatio = imgBoxH / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (imgBoxW - img.width * ratio) / 2;
    const centerShiftY = (imgBoxH - img.height * ratio) / 2;

    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      imgBoxX + centerShiftX,
      imgBoxY + centerShiftY,
      img.width * ratio,
      img.height * ratio
    );
    imageLoaded = true;
  } catch (err) {
    // Fallback: draw metallic dark slate block
    ctx.fillStyle = '#111827';
    ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Máquina têxtil', imgBoxX + 60, imgBoxY + 300);
  }

  // Dark gradient at bottom of image
  const imgShade = ctx.createLinearGradient(0, imgBoxY + 300, 0, imgBoxY + imgBoxH);
  imgShade.addColorStop(0, 'rgba(8, 12, 20, 0)');
  imgShade.addColorStop(1, 'rgba(8, 12, 20, 0.95)');
  ctx.fillStyle = imgShade;
  ctx.fillRect(imgBoxX, imgBoxY + 300, imgBoxW, imgBoxH - 300);

  // Status Badge on Image
  ctx.fillStyle = machine.status === 'disponivel' ? '#10B981' : '#F59E0B';
  ctx.beginPath();
  ctx.arc(imgBoxX + 40, imgBoxY + imgBoxH - 40, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    machine.status === 'disponivel' ? 'DISPONÍVEL PARA NEGOCIAÇÃO' : machine.status === 'manutencao' ? 'EM MANUTENÇÃO' : 'VENDIDA',
    imgBoxX + 60,
    imgBoxY + imgBoxH - 33
  );

  ctx.restore();

  // Border around image box
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 28);
  ctx.stroke();

  // 5. Machine Title & Model
  let currentY = 820;

  ctx.fillStyle = '#FFFFFF';
  drawFittedText(ctx, machine.name, 80, currentY, width - 160, '800', 54, 34);

  currentY += 45;
  ctx.fillStyle = '#00C2FF';
  drawFittedText(ctx, `Modelo: ${machine.model}`, 80, currentY, width - 160, 'bold', 30, 22);

  // 6. Metrics / Telemetry 3-Grid Boxes
  currentY += 40;
  const colW = (width - 160 - 40) / 3;
  const boxH = 130;

  // Box 1: Preço
  ctx.fillStyle = 'rgba(0, 102, 255, 0.12)';
  ctx.strokeStyle = 'rgba(0, 194, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(80, currentY, colW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('VALOR DE INVESTIMENTO', 105, currentY + 40);

  ctx.fillStyle = '#00F0FF';
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(formatCurrency(machine.price), 105, currentY + 88);

  // Box 2: Condições
  const box2X = 80 + colW + 20;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(box2X, currentY, colW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CONDIÇÃO DE PAGAMENTO', box2X + 25, currentY + 40);

  ctx.fillStyle = '#FFFFFF';
  const paymentLabel = machine.payment_type === 'financiado'
    ? 'FINAME / BNDES*'
    : machine.payment_type === 'conforme_analise'
      ? 'Sujeito à análise*'
      : 'À vista / transferência';
  drawFittedText(ctx, paymentLabel, box2X + 25, currentY + 84, colW - 50, 'bold', 23, 17);

  // Box 3: Garantia
  const box3X = box2X + colW + 20;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(box3X, currentY, colW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('GARANTIA INFORMADA', box3X + 25, currentY + 40);

  ctx.fillStyle = '#10B981';
  drawFittedText(ctx, machine.warranty || 'Consulte condições', box3X + 25, currentY + 84, colW - 50, 'bold', 23, 17);

  // 7. Technical Description Card
  currentY += boxH + 40;
  const descBoxH = 250;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(80, currentY, width - 160, descBoxH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00C2FF';
  ctx.font = 'bold 21px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ESPECIFICAÇÕES TÉCNICAS & COMPONENTES', 110, currentY + 45);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '400 25px "Plus Jakarta Sans", sans-serif';

  // Text wrap logic
  const text = machine.description || 'Entre em contato para receber as especificações técnicas deste equipamento.';
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  const maxTextW = width - 220;
  const maxLines = 4;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxTextW && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = testLine;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  const hasMoreText = words.join(' ').length > lines.join(' ').length;
  if (hasMoreText && lines.length) {
    let last = lines[lines.length - 1];
    while (ctx.measureText(`${last}...`).width > maxTextW && last.length > 3) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}...`;
  }
  // Clip the description to its card so no text can escape the rounded box.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(80, currentY, width - 160, descBoxH, 24);
  ctx.clip();
  lines.forEach((item, index) => ctx.fillText(item, 110, currentY + 85 + index * 38));
  ctx.restore();

  // 8. Footer Bar
  currentY = height - 90;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(80, currentY - 20, width - 160, 1);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TexMachina OS • Gestão & Vendas de Maquinário Têxtil Industrial', 80, currentY + 15);

  ctx.fillStyle = '#00C2FF';
  ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Consulte disponibilidade e condições comerciais', width - 80, currentY + 15);
  ctx.textAlign = 'left';

  if (machine.payment_type !== 'a_vista') {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('*Sujeito à análise e aprovação da instituição financeira.', 80, height - 35);
  }

  return canvas;
}

/**
 * Copies the machine image / visual flyer directly to clipboard as PNG blob.
 */
export async function copyFichaImageToClipboard(machine: Machine, branding: FichaBranding = {}): Promise<boolean> {
  try {
    const canvas = await generateFichaCardCanvas(machine, branding);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Falha ao gerar blob da imagem.');

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Clipboard image write not supported, falling back:', err);
    return false;
  }
}

/**
 * Downloads the visual Ficha card as PNG.
 */
export async function downloadFichaCard(machine: Machine, branding: FichaBranding = {}): Promise<void> {
  const canvas = await generateFichaCardCanvas(machine, branding);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = machine.name.replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `Ficha_Tecnica_${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
