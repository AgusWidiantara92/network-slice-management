import { NextRequest, NextResponse } from 'next/server';
import { configurationTemplateService } from '@/services/configuration-template.service';

export async function POST(request: NextRequest) {
  try {
    const { id, tenantId, routerId, name } = await request.json();
    if (!id || !tenantId || !routerId || !name) {
      return NextResponse.json(
        { success: false, error: 'Field id, tenantId, routerId, dan name wajib diisi.' },
        { status: 400 }
      );
    }

    const slice = await configurationTemplateService.applyTemplate(id, tenantId, routerId, name);
    return NextResponse.json({ success: true, data: slice }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menerapkan template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
