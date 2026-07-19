import { NextRequest, NextResponse } from 'next/server';
import { tenantService } from '@/services/tenant.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '10', 10),
    };

    const result = await tenantService.getTenants(params);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data tenant.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await tenantService.createTenant(body);
    return NextResponse.json({ success: true, data: tenant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat tenant.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
