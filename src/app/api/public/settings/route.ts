import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: { type: 'setting' },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Return default values if not set
    const defaultSettings = {
      siteName: settingsMap.siteName || 'BKAD Kabupaten Seruyan',
      siteDescription: settingsMap.siteDescription || 'Portal Resmi Badan Keuangan dan Aset Daerah Kabupaten Seruyan',
      siteKeywords: settingsMap.siteKeywords || 'bkad, seruyan, keuangan, aset daerah, kalimantan tengah',
      address: settingsMap.address || 'Jl. H. Ngaliman, Kuala Pembuang, Kab. Seruyan, Kalimantan Tengah',
      phone: settingsMap.phone || '(0532) 123456',
      email: settingsMap.email || 'bkad@seruyankab.go.id',
      facebook: settingsMap.facebook || '',
      twitter: settingsMap.twitter || '',
      instagram: settingsMap.instagram || '',
      youtube: settingsMap.youtube || '',
      logo: settingsMap.logo || '',
      favicon: settingsMap.favicon || '',
      mapLatitude: settingsMap.mapLatitude || '-2.4000',
      mapLongitude: settingsMap.mapLongitude || '112.1333',
      mapZoom: settingsMap.mapZoom || '14',
    };

    return NextResponse.json({ data: defaultSettings });
  } catch (error) {
    console.error('Get public settings error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
