import { NextRequest, NextResponse } from 'next/server';
import { configurationTemplateService } from '@/services/configuration-template.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Query parameter id wajib diisi.' }, { status: 400 });
    }

    const jsonString = await configurationTemplateService.exportTemplate(id);
    const template = await configurationTemplateService.getTemplateById(id);
    const filename = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_template.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal ekspor template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
