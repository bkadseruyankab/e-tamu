import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Delete existing data in reverse dependency order
    await db.followUp.deleteMany();
    await db.disposition.deleteMany();
    await db.guestLog.deleteMany();
    await db.notification.deleteMany();
    await db.auditLog.deleteMany();
    await db.guest.deleteMany();
    await db.employee.deleteMany();
    await db.guest.deleteMany();
    await db.setting.deleteMany();
    await db.user.deleteMany();
    await db.department.deleteMany();

    // 1. Create Departments
    const departments = await Promise.all([
      db.department.create({ data: { name: 'Sekretariat', code: 'SEK', headName: 'H. Ahmad Fauzi, S.Sos', description: 'Sekretariat Badan Keuangan dan Aset Daerah', isActive: true } }),
      db.department.create({ data: { name: 'Bidang Pendapatan', code: 'BDP', headName: 'Ir. Siti Nurhaliza', description: 'Bidang Pengelolaan Pendapatan Daerah', isActive: true } }),
      db.department.create({ data: { name: 'Bidang Belanja', code: 'BDB', headName: 'Drs. Muhammad Rizki', description: 'Bidang Pengelolaan Belanja Daerah', isActive: true } }),
      db.department.create({ data: { name: 'Bidang Keuangan', code: 'BDK', headName: 'Hj. Ratna Dewi, M.Sc', description: 'Bidang Perbendaharaan dan Keuangan', isActive: true } }),
      db.department.create({ data: { name: 'Bidang Aset', code: 'BDA', headName: 'Andi Pratama, S.T', description: 'Bidang Pengelolaan Aset Daerah', isActive: true } }),
    ]);

    // 2. Create Admin User
    const admin = await db.user.create({
      data: {
        email: 'admin@bkad.seruyan.go.id',
        password: 'hashed_admin123',
        name: 'Administrator BKAD',
        role: 'super_admin',
        phone: '081234567890',
        isActive: true,
      },
    });

    // Create other users
    const users = await Promise.all([
      db.user.create({ data: { email: 'resepsionis@bkad.seruyan.go.id', password: 'hashed_resepsionis123', name: 'Sari Indah', role: 'resepsionis', phone: '081234567891', isActive: true } }),
      db.user.create({ data: { email: 'pimpinan@bkad.seruyan.go.id', password: 'hashed_pimpinan123', name: 'Dr. H. Bambang Suryanto, M.Si', role: 'pimpinan', phone: '081234567892', isActive: true } }),
      db.user.create({ data: { email: 'pegawai.sek@bkad.seruyan.go.id', password: 'hashed_pegawai123', name: 'Dewi Lestari', role: 'pegawai', phone: '081234567893', isActive: true } }),
      db.user.create({ data: { email: 'pegawai.bdp@bkad.seruyan.go.id', password: 'hashed_pegawai123', name: 'Rudi Hartono', role: 'pegawai', phone: '081234567894', isActive: true } }),
    ]);

    // 3. Create Employees
    const employees = await Promise.all([
      db.employee.create({ data: { name: 'H. Ahmad Fauzi, S.Sos', nip: '197501012000031001', position: 'Kepala Sekretariat', phone: '081111111111', email: 'ahmad.fauzi@bkad.seruyan.go.id', departmentId: departments[0].id, isActive: true } }),
      db.employee.create({ data: { name: 'Dewi Lestari', nip: '198002152005012003', position: 'Staff Sekretariat', phone: '082222222222', email: 'dewi.lestari@bkad.seruyan.go.id', departmentId: departments[0].id, isActive: true } }),
      db.employee.create({ data: { name: 'Ir. Siti Nurhaliza', nip: '197803202001032002', position: 'Kepala Bidang Pendapatan', phone: '083333333333', email: 'siti.nurhaliza@bkad.seruyan.go.id', departmentId: departments[1].id, isActive: true } }),
      db.employee.create({ data: { name: 'Rudi Hartono', nip: '198505102003041004', position: 'Staff Pendapatan', phone: '084444444444', email: 'rudi.hartono@bkad.seruyan.go.id', departmentId: departments[1].id, isActive: true } }),
      db.employee.create({ data: { name: 'Drs. Muhammad Rizki', nip: '197606152002031005', position: 'Kepala Bidang Belanja', phone: '085555555555', email: 'muhammad.rizki@bkad.seruyan.go.id', departmentId: departments[2].id, isActive: true } }),
      db.employee.create({ data: { name: 'Ani Susanti', nip: '199001202010012006', position: 'Staff Belanja', phone: '086666666666', email: 'ani.susanti@bkad.seruyan.go.id', departmentId: departments[2].id, isActive: true } }),
      db.employee.create({ data: { name: 'Hj. Ratna Dewi, M.Sc', nip: '197712252001032007', position: 'Kepala Bidang Keuangan', phone: '087777777777', email: 'ratna.dewi@bkad.seruyan.go.id', departmentId: departments[3].id, isActive: true } }),
      db.employee.create({ data: { name: 'Budi Santoso', nip: '198808302006041008', position: 'Staff Keuangan', phone: '088888888888', email: 'budi.santoso@bkad.seruyan.go.id', departmentId: departments[3].id, isActive: true } }),
      db.employee.create({ data: { name: 'Andi Pratama, S.T', nip: '198204102003041009', position: 'Kepala Bidang Aset', phone: '089999999999', email: 'andi.pratama@bkad.seruyan.go.id', departmentId: departments[4].id, isActive: true } }),
      db.employee.create({ data: { name: 'Lina Marlina', nip: '199103152011012010', position: 'Staff Aset', phone: '081010101010', email: 'lina.marlina@bkad.seruyan.go.id', departmentId: departments[4].id, isActive: true } }),
      db.employee.create({ data: { name: 'Fajar Nugroho', nip: '199205202012011011', position: 'Staff Sekretariat', phone: '081111111112', email: 'fajar.nugroho@bkad.seruyan.go.id', departmentId: departments[0].id, isActive: true } }),
      db.employee.create({ data: { name: 'Putri Handayani', nip: '199007082009012012', position: 'Staff Keuangan', phone: '082222222223', email: 'putri.handayani@bkad.seruyan.go.id', departmentId: departments[3].id, isActive: true } }),
    ]);

    // 4. Create Guests (20+ with various statuses and dates)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const statuses = ['menunggu', 'check_in', 'dilayani', 'selesai', 'ditolak'];
    const purposes = [
      'Konsultasi pengelolaan keuangan daerah',
      'Pengambilan dokumen SP2D',
      'Koordinasi program pembangunan',
      'Pelaporan realisasi pendapatan',
      'Penyerahan berkas administrasi',
      'Pembahasan APBD',
      'Verifikasi data keuangan',
      'Pengambilan surat keterangan',
      'Konsultasi perpajakan daerah',
      'Pengaduan masyarakat',
      'Pengajuan permohonan izin',
      'Sosialisasi kebijakan baru',
      'Audit kinerja keuangan',
      'Penandatanganan dokumen',
      'Koordinasi aset daerah',
      'Pelatihan pengelolaan keuangan',
      'Pengambilan bukti potong',
      'Konsultasi pengadaan barang',
      'Penyerahan laporan keuangan',
      'Pembahasan rencana kerja',
      'Koordinasi BPD',
      'Pengajuan klaim asuransi',
      'Verifikasi inventaris aset',
      'Pengambilan SK',
    ];

    const guestNames = [
      'H. Syaiful Rahman', 'Ibu Murniati', 'Bpk. Joko Widodo', 'Ir. Suparman',
      'Siti Aminah', 'Ahmad Dahlan', 'Dra. Nurhasanah', 'H. Muhadi',
      'Ibu Fatimah', 'Bpk. Sugianto', 'Andi Wijaya', 'Lilis Suryani',
      'Bpk. Hartono', 'Ibu Ratnasari', 'Muhammad Ilham', 'Dewi Safitri',
      'Bpk. Kusnadi', 'Ibu Hartini', 'Agus Salim', 'Rina Wati',
      'Bpk. Parmin', 'Ibu Sumiati', 'Hendra Gunawan', 'Yuni Astuti',
    ];

    const institutions = [
      'Pemkab Seruyan', 'DPRD Seruyan', 'BPKP Perwakilan Kalteng',
      'Inspektorat Seruyan', 'BPS Seruyan', 'Kecamatan Seruyan Hilir',
      'Kecamatan Seruyan Tengah', 'Kecamatan Seruyan Hulu',
      'Dinas PUPR Seruyan', 'Dinas Kesehatan Seruyan', 'Masyarakat Umum',
    ];

    const guests: Awaited<ReturnType<typeof db.guest.create>>[] = [];

    for (let i = 0; i < 25; i++) {
      const status = statuses[i % statuses.length];
      const daysAgo = Math.floor(i / 4); // spread across days
      const visitDate = new Date(today);
      visitDate.setDate(visitDate.getDate() - daysAgo);
      visitDate.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      const deptIndex = i % departments.length;
      const empIndex = i % employees.length;

      const checkInTime = status !== 'menunggu' ? new Date(visitDate.getTime() + 5 * 60000) : null;
      const checkOutTime = status === 'selesai' ? new Date(visitDate.getTime() + (30 + Math.floor(Math.random() * 60)) * 60000) : null;

      const guest = await db.guest.create({
        data: {
          name: guestNames[i % guestNames.length],
          institution: institutions[i % institutions.length],
          address: `Jl. Merdeka No. ${i + 1}, Kuala Pembuang`,
          phone: `0812${String(34567890 + i).padStart(8, '0')}`,
          visitPurpose: purposes[i % purposes.length],
          departmentId: departments[deptIndex].id,
          employeeId: employees[empIndex].id,
          status,
          checkInTime,
          checkOutTime,
          visitDate,
        },
      });
      guests.push(guest);
    }

    // 5. Create Dispositions (users array has indices 0-3: resepsionis, pimpinan, pegawai.sek, pegawai.bdp)
    const dispositions = await Promise.all([
      db.disposition.create({ data: { guestId: guests[1].id, fromUserId: admin.id, toUserId: users[2].id, status: 'diproses', notes: 'Mohon ditindaklanjuti' } }),
      db.disposition.create({ data: { guestId: guests[3].id, fromUserId: admin.id, toUserId: users[3].id, status: 'menunggu', notes: 'Perlu koordinasi lebih lanjut' } }),
      db.disposition.create({ data: { guestId: guests[5].id, fromUserId: users[1].id, toUserId: users[2].id, status: 'selesai', notes: 'Sudah ditangani' } }),
      db.disposition.create({ data: { guestId: guests[7].id, fromUserId: admin.id, toUserId: users[3].id, status: 'diproses', notes: 'Prioritas tinggi' } }),
      db.disposition.create({ data: { guestId: guests[9].id, fromUserId: users[1].id, toUserId: admin.id, status: 'menunggu', notes: 'Perlu persetujuan pimpinan' } }),
      db.disposition.create({ data: { guestId: guests[11].id, fromUserId: admin.id, toUserId: users[2].id, status: 'ditolak', notes: 'Tidak memenuhi syarat' } }),
    ]);

    // 6. Create Notifications
    await Promise.all([
      db.notification.create({ data: { userId: admin.id, title: 'Tamu Baru', message: 'H. Syaiful Rahman telah mendaftar sebagai tamu', type: 'info' } }),
      db.notification.create({ data: { userId: admin.id, title: 'Disposisi Baru', message: 'Anda menerima disposisi baru dari Dr. H. Bambang Suryanto', type: 'info' } }),
      db.notification.create({ data: { userId: users[1].id, title: 'Tamu Check-in', message: 'Ibu Murniatti telah check-in', type: 'success' } }),
      db.notification.create({ data: { userId: admin.id, title: 'Tamu Ditolak', message: 'Pengunjung dengan nama tertentu ditolak', type: 'warning' } }),
      db.notification.create({ data: { userId: users[0].id, title: 'Laporan Harian', message: 'Laporan kunjungan hari ini sudah tersedia', type: 'info' } }),
      db.notification.create({ data: { userId: users[2].id, title: 'Disposisi Selesai', message: 'Disposisi untuk Bpk. Joko Widodo sudah selesai', type: 'success' } }),
      db.notification.create({ data: { userId: admin.id, title: 'Tamu Menunggu', message: 'Terdapat 5 tamu yang masih menunggu', type: 'warning' } }),
      db.notification.create({ data: { userId: users[1].id, title: 'Tamu Baru', message: 'Bpk. Sugianto telah mendaftar sebagai tamu', type: 'info' } }),
    ]);

    // 7. Create Settings
    await Promise.all([
      db.setting.create({ data: { key: 'app_name', value: 'E-Tamu BKAD' } }),
      db.setting.create({ data: { key: 'app_title', value: 'Sistem Tamu Digital Badan Keuangan dan Aset Daerah Kabupaten Seruyan' } }),
      db.setting.create({ data: { key: 'running_text', value: 'Selamat datang di E-Tamu BKAD Kabupaten Seruyan - Melayani dengan Sepenuh Hati' } }),
      db.setting.create({ data: { key: 'organization_name', value: 'Badan Keuangan dan Aset Daerah Kabupaten Seruyan' } }),
      db.setting.create({ data: { key: 'organization_address', value: 'Jl. Patin No. 1, Kuala Pembuang, Kabupaten Seruyan, Kalimantan Tengah' } }),
      db.setting.create({ data: { key: 'organization_phone', value: '0532-882123' } }),
      db.setting.create({ data: { key: 'organization_email', value: 'bkad@seruyankab.go.id' } }),
      db.setting.create({ data: { key: 'operating_hours_start', value: '08:00' } }),
      db.setting.create({ data: { key: 'operating_hours_end', value: '16:00' } }),
      db.setting.create({ data: { key: 'max_visitors_per_day', value: '100' } }),
      db.setting.create({ data: { key: 'auto_checkout_minutes', value: '120' } }),
      db.setting.create({ data: { key: 'enable_photo', value: 'true' } }),
      db.setting.create({ data: { key: 'enable_signature', value: 'true' } }),
      db.setting.create({ data: { key: 'enable_qrcode', value: 'true' } }),
    ]);

    // 8. Create Audit Logs
    await Promise.all([
      db.auditLog.create({ data: { userId: admin.id, action: 'SEED', entity: 'System', details: 'Database seeded with initial data', ipAddress: '127.0.0.1' } }),
      db.auditLog.create({ data: { userId: admin.id, action: 'CREATE', entity: 'User', entityId: admin.id, details: 'Admin user created', ipAddress: '127.0.0.1' } }),
      db.auditLog.create({ data: { userId: admin.id, action: 'CREATE', entity: 'Department', details: '5 departments created', ipAddress: '127.0.0.1' } }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        departments: departments.length,
        users: 1 + users.length,
        employees: employees.length,
        guests: guests.length,
        dispositions: dispositions.length,
        settings: 14,
        notifications: 8,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
