import { NextRequest, NextResponse } from 'next/server';
import { auditLogService } from '@/services/audit-log.service';

export async function GET() {
  try {
    const actions = await auditLogService.getDistinctActions();
    return NextResponse.json({ success: true, data: actions });
  } catch (error) {
    console.error('GET /api/audit-log/actions error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar aksi.' },
      { status: 500 }
    );
  }
}
