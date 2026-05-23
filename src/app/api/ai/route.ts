import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required (frequent_visitors, busy_hours, summary)' },
        { status: 400 }
      );
    }

    // Gather guest data for AI analysis
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGuests = await db.guest.findMany({
      where: { visitDate: { gte: thirtyDaysAgo } },
      include: {
        department: { select: { name: true } },
        employee: { select: { name: true } },
      },
      take: 200,
      orderBy: { visitDate: 'desc' },
    });

    const allGuests = await db.guest.findMany({
      include: {
        department: { select: { name: true } },
      },
      take: 500,
      orderBy: { visitDate: 'desc' },
    });

    let prompt = '';
    let contextData = '';

    switch (action) {
      case 'frequent_visitors': {
        // Analyze frequent visitors
        const visitorStats = allGuests.reduce<Record<string, { name: string; count: number; purposes: string[]; lastVisit: Date }>>((acc, g) => {
          const key = g.phone || g.name;
          if (!acc[key]) {
            acc[key] = { name: g.name, count: 0, purposes: [], lastVisit: g.visitDate };
          }
          acc[key].count++;
          if (!acc[key].purposes.includes(g.visitPurpose)) {
            acc[key].purposes.push(g.visitPurpose);
          }
          if (new Date(g.visitDate) > new Date(acc[key].lastVisit)) {
            acc[key].lastVisit = g.visitDate;
          }
          return acc;
        }, {});

        const frequentVisitors = Object.values(visitorStats)
          .filter((v) => v.count > 1)
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        contextData = JSON.stringify(frequentVisitors, null, 2);
        prompt = `Analisis data pengunjung yang sering datang ke Badan Keuangan dan Aset Daerah (BKAD) Kabupaten Seruyan. Berikan insight tentang pola kunjungan, tujuan utama, dan rekomendasi untuk meningkatkan pelayanan. Data pengunjung frequent: ${contextData}`;
        break;
      }

      case 'busy_hours': {
        // Analyze busy hours
        const hourlyData = Array.from({ length: 24 }, (_, h) => ({
          hour: h,
          label: `${h.toString().padStart(2, '0')}:00`,
          weekdayCount: 0,
          weekendCount: 0,
        }));

        recentGuests.forEach((g) => {
          const visitDate = new Date(g.visitDate);
          const hour = visitDate.getHours();
          const dayOfWeek = visitDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            hourlyData[hour].weekendCount++;
          } else {
            hourlyData[hour].weekdayCount++;
          }
        });

        const dailyData = Array.from({ length: 7 }, (_, i) => ({
          day: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][i],
          count: 0,
        }));

        recentGuests.forEach((g) => {
          const dayOfWeek = new Date(g.visitDate).getDay();
          dailyData[dayOfWeek].count++;
        });

        contextData = JSON.stringify({ hourlyData, dailyData }, null, 2);
        prompt = `Analisis pola jam sibuk di Badan Keuangan dan Aset Daerah (BKAD) Kabupaten Seruyan berdasarkan data kunjungan 30 hari terakhir. Prediksi jam dan hari yang akan sibuk, berikan rekomendasi pengaturan staf dan sumber daya. Data: ${contextData}`;
        break;
      }

      case 'summary': {
        // General summary
        const statusCounts = allGuests.reduce<Record<string, number>>((acc, g) => {
          acc[g.status] = (acc[g.status] || 0) + 1;
          return acc;
        }, {});

        const deptCounts = allGuests.reduce<Record<string, number>>((acc, g) => {
          const dept = g.department?.name || 'Tidak ada';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {});

        const purposeCounts = allGuests.reduce<Record<string, number>>((acc, g) => {
          acc[g.visitPurpose] = (acc[g.visitPurpose] || 0) + 1;
          return acc;
        }, {});

        contextData = JSON.stringify({
          totalGuests: allGuests.length,
          statusCounts,
          departmentCounts: deptCounts,
          purposeCounts: Object.entries(purposeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce<Record<string, number>>((acc, [k, v]) => { acc[k] = v; return acc; }, {}),
          recentCount: recentGuests.length,
        }, null, 2);

        prompt = `Buat ringkasan analisis komprehensif tentang data kunjungan tamu di Badan Keuangan dan Aset Daerah (BKAD) Kabupaten Seruyan. Sertakan insight tentang distribusi status, departemen yang paling banyak dikunjungi, tujuan kunjungan utama, dan rekomendasi untuk peningkatan layanan. Data: ${contextData}`;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: frequent_visitors, busy_hours, or summary' },
          { status: 400 }
        );
    }

    // Use z-ai-web-dev-sdk LLM
    const { LLM } = await import('z-ai-web-dev-sdk');
    const llm = new LLM();

    const result = await llm.chat({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah asisten AI yang ahli dalam menganalisis data kunjungan tamu di instansi pemerintah. Berikan analisis dalam bahasa Indonesia yang jelas, terstruktur, dan mudah dipahami. Gunakan format markdown untuk tampilan yang rapi.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        action,
        analysis: result.choices?.[0]?.message?.content || result.content || result.text || JSON.stringify(result),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI analysis', details: String(error) },
      { status: 500 }
    );
  }
}
