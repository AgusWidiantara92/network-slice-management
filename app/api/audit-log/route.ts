import { NextRequest, NextResponse } from 'next/server';
import { auditLogService } from '@/services/audit-log.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = {
      search: searchParams.get('search') || undefined,
      action: searchParams.get('action') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '15', 10),
    };

    const result = await auditLogService.getAuditLogs(params);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/audit-log error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data audit log.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const daysStr = searchParams.get('days') || '90';
    const days = parseInt(daysStr, 10);

    if (isNaN(days) || days < 0) {
      return NextResponse.json(
        { success: false, error: 'Parameter days tidak valid.' },
        { status: 400 }
      );
    }

    const result = await auditLogService.clearOldLogs(days);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('DELETE /api/audit-log error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membersihkan log lama.' },
      { status: 500 }
    );
  }
}
