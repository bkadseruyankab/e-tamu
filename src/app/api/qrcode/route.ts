import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qr_code_enabled, logo_url } = body;

    // Get base URL from request
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // The QR code URL points to quick registration
    const qrData = `${baseUrl}/?action=quick-register`;

    // Generate QR code with high quality and high error correction for logo overlay
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 512,
      margin: 2,
      color: {
        dark: '#0c2d57',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High - allows ~30% damage for logo
    });

    // If we have a logo, overlay it on the QR code
    let finalQrDataUrl = qrDataUrl;
    if (logo_url) {
      try {
        finalQrDataUrl = await overlayLogoOnQr(qrDataUrl, logo_url, host, protocol);
      } catch (logoErr) {
        console.error('Failed to overlay logo on QR code, using plain QR:', logoErr);
      }
    }

    // Save settings
    if (qr_code_enabled !== undefined) {
      await db.setting.upsert({
        where: { key: 'qr_code_enabled' },
        update: { value: String(qr_code_enabled) },
        create: { key: 'qr_code_enabled', value: String(qr_code_enabled) },
      });
    }

    await db.setting.upsert({
      where: { key: 'qr_code_url' },
      update: { value: finalQrDataUrl },
      create: { key: 'qr_code_url', value: finalQrDataUrl },
    });

    return NextResponse.json({
      success: true,
      data: {
        qrDataUrl: finalQrDataUrl,
        qrContent: qrData,
      },
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal generate QR Code' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'qr_code_url' },
    });

    const enabledSetting = await db.setting.findUnique({
      where: { key: 'qr_code_enabled' },
    });

    return NextResponse.json({
      success: true,
      data: {
        qr_code_url: setting?.value || '',
        qr_code_enabled: enabledSetting?.value || 'true',
      },
    });
  } catch (error) {
    console.error('QR Code fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil QR Code' },
      { status: 500 }
    );
  }
}

/**
 * Overlay logo in the center of QR code using sharp (server-side).
 * Creates a white rounded-rect background with the logo centered.
 */
async function overlayLogoOnQr(
  qrDataUrl: string,
  logoUrl: string,
  host: string,
  protocol: string
): Promise<string> {
  const sharp = (await import('sharp')).default;

  // Convert QR data URL to buffer
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
  const qrBuffer = Buffer.from(qrBase64, 'base64');

  // Get QR dimensions
  const qrMeta = await sharp(qrBuffer).metadata();
  const qrSize = qrMeta.width || 512;

  // Logo area = ~30% of QR size (fits within error correction capacity)
  const logoAreaSize = Math.round(qrSize * 0.30);
  const logoOffset = Math.round((qrSize - logoAreaSize) / 2);

  // White padding around logo
  const padding = Math.round(logoAreaSize * 0.12);
  const bgAreaSize = logoAreaSize + padding * 2;
  const bgOffset = logoOffset - padding;

  // Build absolute logo URL
  let absoluteLogoUrl = logoUrl;
  if (logoUrl.startsWith('/')) {
    absoluteLogoUrl = `${protocol}://${host}${logoUrl}`;
  }

  // Fetch logo image
  let logoBuffer: Buffer;
  try {
    const logoResponse = await fetch(absoluteLogoUrl);
    if (!logoResponse.ok) throw new Error('Logo fetch failed');
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    logoBuffer = Buffer.from(logoArrayBuffer);
  } catch {
    return qrDataUrl;
  }

  // Resize logo to fit in the center area
  const resizedLogo = await sharp(logoBuffer)
    .resize(logoAreaSize, logoAreaSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Create white background with rounded corners for the logo area
  // Using SVG for rounded rectangle
  const cornerRadius = Math.round(padding * 0.5);
  const whiteBgSvg = `<svg width="${bgAreaSize}" height="${bgAreaSize}">
    <rect x="0" y="0" width="${bgAreaSize}" height="${bgAreaSize}" 
          rx="${cornerRadius}" ry="${cornerRadius}" 
          fill="white"/>
  </svg>`;

  const whiteBg = await sharp(Buffer.from(whiteBgSvg))
    .png()
    .toBuffer();

  // Composite: QR + white background + logo
  const result = await sharp(qrBuffer)
    .composite([
      {
        input: whiteBg,
        top: bgOffset,
        left: bgOffset,
      },
      {
        input: resizedLogo,
        top: logoOffset,
        left: logoOffset,
      },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${result.toString('base64')}`;
}
