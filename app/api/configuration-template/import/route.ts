import { NextRequest, NextResponse } from 'next/server';
import { configurationTemplateService } from '@/services/configuration-template.service';

export async function POST(request: NextRequest) {
  try {
    const { fileContent } = await request.json();
    if (!fileContent) {
      return NextResponse.json({ success: false, error: 'Konten file wajib diisi.' }, { status: 400 });
    }

    const template = await configurationTemplateService.importTemplate(fileContent);
    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal impor template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
