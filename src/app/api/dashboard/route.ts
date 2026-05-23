import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total guests by period
    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
      db.guest.count({ where: { visitDate: { gte: today } } }),
      db.guest.count({ where: { visitDate: { gte: weekStart } } }),
      db.guest.count({ where: { visitDate: { gte: monthStart } } }),
      db.guest.count(),
    ]);

    // Guests by status
    const statusCounts = await db.guest.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const guestsByStatus = {
      menunggu: 0,
      check_in: 0,
      dilayani: 0,
      selesai: 0,
      ditolak: 0,
    };

    statusCounts.forEach((item) => {
      const status = item.status as keyof typeof guestsByStatus;
      if (status in guestsByStatus) {
        guestsByStatus[status] = item._count.status;
      }
    });

    // Guests by department
    const guestsByDept = await db.guest.groupBy({
      by: ['departmentId'],
      _count: { departmentId: true },
      where: { departmentId: { not: null } },
    });

    const departments = await db.department.findMany({ select: { id: true, name: true } });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const guestsByDepartment = guestsByDept.map((item) => ({
      departmentId: item.departmentId,
      departmentName: deptMap[item.departmentId || ''] || 'Tidak ada',
      count: item._count.departmentId,
    }));

    // Recent guests (last 10)
    const recentGuests = await db.guest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
        employee: { select: { name: true } },
      },
    });

    // Hourly distribution for today
    const todayGuests = await db.guest.findMany({
      where: { visitDate: { gte: today } },
      select: { visitDate: true },
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));

    todayGuests.forEach((g) => {
      const hour = new Date(g.visitDate).getHours();
      hourlyDistribution[hour].count++;
    });

    // Weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await db.guest.count({
        where: {
          visitDate: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      weeklyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        dayName: dayStart.toLocaleDateString('id-ID', { weekday: 'short' }),
        count,
      });
    }

    // Disposition stats
    const dispositionStats = await db.disposition.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Active employees
    const activeEmployees = await db.employee.count({ where: { isActive: true } });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          today: todayCount,
          thisWeek: weekCount,
          thisMonth: monthCount,
          total: totalCount,
          activeEmployees,
        },
        guestsByStatus,
        guestsByDepartment,
        recentGuests,
        hourlyDistribution,
        weeklyTrend,
        dispositionStats: dispositionStats.map((d) => ({
          status: d.status,
          count: d._count.status,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
