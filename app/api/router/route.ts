import { NextRequest, NextResponse } from 'next/server';
import { routerService } from '@/services/router.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await routerService.getRouters({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '10', 10),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/router error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data router.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const router = await routerService.createRouter(body);
    return NextResponse.json({ success: true, data: router }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat router.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
