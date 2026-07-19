import { NextRequest, NextResponse } from 'next/server';
import { networkSliceService } from '@/services/network-slice.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      tenantId: searchParams.get('tenantId') || undefined,
      routerId: searchParams.get('routerId') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '10', 10),
    };

    const result = await networkSliceService.getSlices(params);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/network-slice error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data network slice.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slice = await networkSliceService.createSlice(body);
    return NextResponse.json({ success: true, data: slice }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat network slice.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
