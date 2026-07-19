import { NextRequest, NextResponse } from 'next/server';
import { networkSliceService } from '@/services/network-slice.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slice = await networkSliceService.getSliceById(id);
    return NextResponse.json({ success: true, data: slice });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network slice tidak ditemukan.';
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
    const slice = await networkSliceService.updateSlice(id, body);
    return NextResponse.json({ success: true, data: slice });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengupdate network slice.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await networkSliceService.deleteSlice(id);
    return NextResponse.json({ success: true, message: 'Network slice berhasil dihapus.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus network slice.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
