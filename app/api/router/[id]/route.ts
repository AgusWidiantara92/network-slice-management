import { NextRequest, NextResponse } from 'next/server';
import { routerService } from '@/services/router.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const router = await routerService.getRouterById(id);
    return NextResponse.json({ success: true, data: router });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Router tidak ditemukan.';
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
    const router = await routerService.updateRouter(id, body);
    return NextResponse.json({ success: true, data: router });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengupdate router.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await routerService.deleteRouter(id);
    return NextResponse.json({ success: true, message: 'Router berhasil dihapus.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus router.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
