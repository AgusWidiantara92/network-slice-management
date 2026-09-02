import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/services/llm.service';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.setActive) {
      const active = await LLMService.setActiveProvider(id);
      return NextResponse.json({ success: true, data: active });
    }

    const updated = await LLMService.upsertProvider({
      id,
      ...body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update LLM provider';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await LLMService.deleteProvider(id);
    return NextResponse.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete LLM provider';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
