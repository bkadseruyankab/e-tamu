import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily'; // daily, weekly, monthly
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const departmentId = searchParams.get('departmentId') || '';

    const now = new Date();

    // Determine date range based on type
    let startDate: Date;
    let endDate: Date;

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      switch (type) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
      }
    }

    const where: Record<string, unknown> = {
      visitDate: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Get guests for the period
    const [guests, totalGuests] = await Promise.all([
      db.guest.findMany({
        where,
        orderBy: { visitDate: 'asc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          employee: { select: { id: true, name: true, position: true } },
        },
      }),
      db.guest.count({ where }),
    ]);

    // Status breakdown
    const statusBreakdown = await db.guest.groupBy({
      by: ['status'],
      _count: { status: true },
      where,
    });

    // Department breakdown
    const departmentBreakdown = await db.guest.groupBy({
      by: ['departmentId'],
      _count: { departmentId: true },
      where: { ...where, departmentId: { not: null } },
    });

    const departments = await db.department.findMany({ select: { id: true, name: true } });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    // Purpose breakdown
    const purposeBreakdown = guests.reduce<Record<string, number>>((acc, g) => {
      const purpose = g.visitPurpose;
      acc[purpose] = (acc[purpose] || 0) + 1;
      return acc;
    }, {});

    // Hourly distribution
    const hourlyDist = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    guests.forEach((g) => {
      const hour = new Date(g.visitDate).getHours();
      hourlyDist[hour].count++;
    });

    // Average visit duration (for completed visits)
    const completedVisits = guests.filter((g) => g.checkInTime && g.checkOutTime);
    const avgDuration = completedVisits.length > 0
      ? completedVisits.reduce((sum, g) => {
          const duration = new Date(g.checkOutTime!).getTime() - new Date(g.checkInTime!).getTime();
          return sum + duration;
        }, 0) / completedVisits.length / 60000 // in minutes
      : 0;

    // Daily trend for the period
    const dailyTrend: { date: string; count: number }[] = [];
    const current = new Date(startDate);
    while (current < endDate) {
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayCount = guests.filter((g) => {
        const visitDate = new Date(g.visitDate);
        return visitDate >= current && visitDate < dayEnd;
      }).length;

      dailyTrend.push({
        date: current.toISOString().split('T')[0],
        count: dayCount,
      });

      current.setDate(current.getDate() + 1);
    }

    const report = {
      period: {
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalGuests,
        avgDurationMinutes: Math.round(avgDuration),
        completedVisits: completedVisits.length,
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      departmentBreakdown: departmentBreakdown.map((d) => ({
        departmentId: d.departmentId,
        departmentName: deptMap[d.departmentId || ''] || 'Tidak ada',
        count: d._count.departmentId,
      })),
      purposeBreakdown: Object.entries(purposeBreakdown)
        .map(([purpose, count]) => ({ purpose, count }))
        .sort((a, b) => b.count - a.count),
      hourlyDistribution: hourlyDist,
      dailyTrend,
      guests: guests.slice(0, 100), // limit to 100 records
    };

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
