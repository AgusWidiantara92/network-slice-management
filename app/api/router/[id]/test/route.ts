import { NextRequest, NextResponse } from 'next/server';
import { routerService } from '@/services/router.service';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await routerService.testConnection(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menguji koneksi.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
