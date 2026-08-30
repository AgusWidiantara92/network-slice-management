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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduler = await schedulerService.getSchedulerById(id);
    return NextResponse.json({ success: true, data: scheduler });
  } catch (error) {
    console.error(`GET /api/scheduler/${request.url} error:`, error);
    const message = error instanceof Error ? error.message : 'Gagal mengambil detail scheduler.';
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const email = await getOperatorEmail(request);
    const scheduler = await schedulerService.updateScheduler(id, body, email);
    return NextResponse.json({ success: true, data: scheduler });
  } catch (error) {
    console.error(`PUT /api/scheduler/${request.url} error:`, error);
    const message = error instanceof Error ? error.message : 'Gagal memperbarui scheduler.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = await getOperatorEmail(request);
    const scheduler = await schedulerService.deleteScheduler(id, email);
    return NextResponse.json({ success: true, data: scheduler });
  } catch (error) {
    console.error(`DELETE /api/scheduler/${request.url} error:`, error);
    const message = error instanceof Error ? error.message : 'Gagal menghapus scheduler.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
