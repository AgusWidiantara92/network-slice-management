import { NextRequest, NextResponse } from 'next/server';
import { configurationTemplateService } from '@/services/configuration-template.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await configurationTemplateService.getTemplateById(id);
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Template tidak ditemukan.';
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const template = await configurationTemplateService.updateTemplate(id, body);
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengupdate template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await configurationTemplateService.deleteTemplate(id);
    return NextResponse.json({ success: true, message: 'Template berhasil dihapus.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
