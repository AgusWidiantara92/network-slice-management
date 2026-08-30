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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = {
      search: searchParams.get('search') || undefined,
      tenantId: searchParams.get('tenantId') || undefined,
      routerId: searchParams.get('routerId') || undefined,
      sliceId: searchParams.get('sliceId') || undefined,
      status: searchParams.get('status') || undefined,
      repeatType: searchParams.get('repeatType') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '10', 10),
    };

    const result = await schedulerService.getSchedulers(params);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/scheduler error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data scheduler.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = await getOperatorEmail(request);
    const scheduler = await schedulerService.createScheduler(body, email);
    return NextResponse.json({ success: true, data: scheduler }, { status: 201 });
  } catch (error) {
    console.error('POST /api/scheduler error:', error);
    const message = error instanceof Error ? error.message : 'Gagal membuat scheduler.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
