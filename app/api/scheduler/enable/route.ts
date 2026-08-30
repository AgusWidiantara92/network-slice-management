import { NextRequest, NextResponse } from 'next/server';
import { schedulerService } from '@/services/scheduler.service';
import { verifyAccessToken } from '@/lib/jwt';
import { adminRepository } from '@/repositories/admin.repository';

async function getOperatorEmail(request: NextRequest): Promise<string> {
  const token = request.cookies.get('access_token')?.value;
  if (token) {
    const decoded = await verifyAccessToken(token);
    if (decoded) {
      const admin = await adminRepository.findById(decoded.userId);
      if (admin) return admin.email;
    }
  }
  return 'System';
}

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID scheduler wajib diisi.' },
        { status: 400 }
      );
    }
    const email = await getOperatorEmail(request);
    const scheduler = await schedulerService.enableScheduler(id, email);
    return NextResponse.json({ success: true, data: scheduler });
  } catch (error) {
    console.error('POST /api/scheduler/enable error:', error);
    const message = error instanceof Error ? error.message : 'Gagal mengaktifkan scheduler.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
