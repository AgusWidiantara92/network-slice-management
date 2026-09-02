import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/services/llm.service';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt string is required' },
        { status: 400 }
      );
    }

    const result = await LLMService.processPrompt(prompt.trim());
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process prompt with LLM';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
