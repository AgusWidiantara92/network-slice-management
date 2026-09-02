import { NextResponse } from 'next/server';
import { LLMService } from '@/services/llm.service';

export async function GET() {
  try {
    const history = await LLMService.getHistory(30);
    return NextResponse.json({ success: true, data: history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch LLM history';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
