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
  const measured = ctx.measureText(text).width;
  const safeText = measured <= maxWidth
    ? text
    : `${text.slice(0, Math.max(3, Math.floor(text.length * maxWidth / measured) - 3))}...`;
  ctx.fillText(safeText, x, y);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = candidate;
    }
  }

  if (lines.length < maxLines && line) lines.push(line);
  if (words.join(' ').length > lines.join(' ').length && lines.length) {
    let last = lines[lines.length - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 3) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

/**
 * Creates a shareable machine proposal image: full-bleed machine photo,
 * white machine details directly over the photo, and no information panels.
 * Company branding/contact details are intentionally omitted from the artwork.
 */
function drawTexFitasLogo(ctx: CanvasRenderingContext2D): void {
  // Clean two-color brand mark: compact half-gear close to the wordmark.
  const blue = '#145A8D';
  const green = '#20A464';
  const cx = 146;
  const cy = 82;
  const outer = 39;
  const inner = 31;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = blue;
  ctx.beginPath();
  // Half gear silhouette, with small angular teeth along its upper arc.
  for (let i = 0; i <= 36; i++) {
    const angle = Math.PI - (Math.PI * i / 36);
    const tooth = i % 3 === 0 || i % 3 === 1 ? outer : inner;
    const radius = i % 6 === 0 || i % 6 === 1 ? outer + 5 : tooth;
    const x = cx + Math.cos(angle) * radius;
    const y = cy - Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + outer, cy + 2);
  ctx.lineTo(cx - outer, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Simple inner arc gives the gear a recognizable textile/industrial mark.
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy + 5, 23, Math.PI, 0);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 54px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = blue;
  ctx.fillText('Tex', 48, 122);
  const texWidth = ctx.measureText('Tex').width;
  ctx.fillStyle = green;
  ctx.fillText('Fitas', 48 + texWidth - 2, 122);
  ctx.restore();
}

function drawWhatsAppIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const size = 42;
  const cx = x + size / 2;
  const cy = y - size / 2 + 4;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Simplified white WhatsApp handset inside a speech-bubble contour.
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy + 10);
  ctx.lineTo(cx - 14, cy + 15);
  ctx.lineTo(cx - 5, cy + 13);
  ctx.moveTo(cx - 8, cy - 11);
  ctx.quadraticCurveTo(cx - 13, cy - 5, cx - 7, cy + 2);
  ctx.quadraticCurveTo(cx + 1, cy + 11, cx + 9, cy + 5);
  ctx.quadraticCurveTo(cx + 12, cy + 2, cx + 7, cy - 2);
  ctx.lineTo(cx + 2, cy - 5);
  ctx.lineTo(cx - 2, cy - 1);
  ctx.quadraticCurveTo(cx - 6, cy - 4, cx - 4, cy - 8);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export interface FichaBranding {
  logoUrl?: string | null;
  companyName?: string | null;
  whatsapp?: string | null;
}

export async function generateFichaCardCanvas(
  machine: Machine,
  branding: FichaBranding = {}
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar o canvas 2D.');

  // The machine photo fills the complete image, just like the shared reference.
  ctx.fillStyle = '#17202b';
  ctx.fillRect(0, 0, width, height);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = machine.image_url;
    await new Promise<void>((resolve, reject) => {
      if (img.complete && img.naturalWidth > 0) resolve();
      else {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Não foi possível carregar a foto da máquina.'));
      }
    });

    // Detect and trim solid black letterboxing embedded in uploaded machine photos.
    // Crop full-width pure-black letterbox bands, including unusually tall bands; preserve normal dark details.
    let cropTop = 0;
    let cropBottom = img.height;
    try {
      const scanCanvas = document.createElement('canvas');
      scanCanvas.width = Math.min(img.width, 360);
      scanCanvas.height = Math.min(img.height, 900);
      const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
      if (scanCtx) {
        scanCtx.drawImage(img, 0, 0, scanCanvas.width, scanCanvas.height);
        const pixels = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height).data;
        const rowIsBlack = (row: number) => {
          let black = 0;
          for (let x = 0; x < scanCanvas.width; x++) {
            const i = (row * scanCanvas.width + x) * 4;
            if (pixels[i] < 18 && pixels[i + 1] < 18 && pixels[i + 2] < 18) black++;
          }
          return black / scanCanvas.width > 0.96;
        };
        let top = 0;
        while (top < scanCanvas.height * 0.48 && rowIsBlack(top)) top++;
        let bottom = scanCanvas.height - 1;
        while (bottom > scanCanvas.height * 0.52 && rowIsBlack(bottom)) bottom--;
        if (top > 8) cropTop = Math.round(top * img.height / scanCanvas.height);
        if (scanCanvas.height - 1 - bottom > 8) {
          cropBottom = Math.round((bottom + 1) * img.height / scanCanvas.height);
        }
      }
    } catch {
      // If cross-origin image pixels cannot be inspected, render the original photo normally.
    }

    const sourceHeight = Math.max(1, cropBottom - cropTop);
    const ratio = Math.max(width / img.width, height / sourceHeight);
    const drawWidth = img.width * ratio;
    const drawHeight = sourceHeight * ratio;
    ctx.drawImage(
      img,
      0, cropTop, img.width, sourceHeight,
      (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight
    );
  } catch {
    // Keep a neutral fallback if the image URL cannot be loaded.
    ctx.fillStyle = '#17202b';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Foto da máquina indisponível', 64, height / 2);
  }

  // Subtle photo darkening only at the bottom; no boxes or panels behind text.
  const shade = ctx.createLinearGradient(0, height * 0.48, 0, height);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(0.38, 'rgba(0, 0, 0, 0.28)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  // Use the approved compact two-color TexFitas logo on every shared card.
  drawTexFitasLogo(ctx);

  const left = 58;
  const maxWidth = width - left * 2;
  let y = height - 570;

  // Text stays white and directly over the photograph, with a small shadow
  // to remain readable across different machine and warehouse backgrounds.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.textAlign = 'left';

  ctx.fillStyle = '#FFFFFF';
  drawFittedText(ctx, machine.name || 'Máquina têxtil', left, y, maxWidth, '800', 58, 34);
  y += 58;

  // Reference-inspired layout: white typography and a yellow vertical accent.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(left - 18, y - 34, 7, 132);
  ctx.restore();

  if (machine.model?.trim()) {
    ctx.font = '600 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(ctx, `Modelo: ${machine.model.trim()}`, left, y, maxWidth, '600', 38, 26);
    y += 54;
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
  drawFittedText(ctx, formatCurrency(machine.price), left, y, maxWidth, '800', 58, 34);
  y += 64;

  const details: string[] = [];
  // Availability/status intentionally omitted from the share image.

  if (machine.warranty?.trim()) details.push(`Garantia: ${machine.warranty.trim()}`);
  if (machine.origin?.trim()) details.push(`Origem: ${machine.origin.trim()}`);

  ctx.font = '500 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  for (const detail of details) {
    drawFittedText(ctx, detail, left, y, maxWidth, '500', 32, 23);
    y += 46;
  }

  const description = machine.description?.trim();
  if (description) {
    y += 10;
    ctx.font = '400 29px "Plus Jakarta Sans", sans-serif';
    const lines = wrapText(ctx, description, maxWidth, 3);
    lines.forEach((line) => {
      drawFittedText(ctx, line, left, y, maxWidth, '400', 29, 22);
      y += 41;
    });
  }

  // WhatsApp contact and recognizable green icon on the shared photo.
  if (branding.whatsapp?.trim()) {
    y += 18;
    drawWhatsAppIcon(ctx, left, y - 4);
    ctx.fillStyle = '#FFFFFF';
    drawFittedText(
      ctx,
      `Entre em contato pelo WhatsApp ${branding.whatsapp.trim()}`,
      left + 54,
      y,
      maxWidth - 54,
      '700',
      30,
      20
    );
  }

  ctx.restore();
  return canvas;
}

/** Copies the generated machine proposal image to the clipboard as PNG. */
export async function copyFichaImageToClipboard(
  machine: Machine,
  branding: FichaBranding = {}
): Promise<boolean> {
  try {
    const canvas = await generateFichaCardCanvas(machine, branding);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Falha ao gerar blob da imagem.');

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Clipboard image write not supported, falling back:', err);
    return false;
  }
}

/** Downloads the machine proposal artwork as PNG. */
export async function downloadFichaCard(
  machine: Machine,
  branding: FichaBranding = {}
): Promise<void> {
  const canvas = await generateFichaCardCanvas(machine, branding);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = machine.name.replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `Proposta_Maquina_${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
