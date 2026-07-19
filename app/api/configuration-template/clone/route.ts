import { NextRequest, NextResponse } from 'next/server';
import { configurationTemplateService } from '@/services/configuration-template.service';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID template wajib diisi.' }, { status: 400 });
    }
    const cloned = await configurationTemplateService.cloneTemplate(id);
    return NextResponse.json({ success: true, data: cloned });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menduplikasi template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
