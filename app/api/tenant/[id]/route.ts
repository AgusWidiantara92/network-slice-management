import { NextRequest, NextResponse } from 'next/server';
import { tenantService } from '@/services/tenant.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenant = await tenantService.updateTenant(id, body);
    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengupdate tenant.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await tenantService.deleteTenant(id);
    return NextResponse.json({ success: true, message: 'Tenant berhasil dihapus.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus tenant.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
