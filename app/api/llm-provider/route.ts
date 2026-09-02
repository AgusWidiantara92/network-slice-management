import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/services/llm.service';

export async function GET() {
  try {
    const providers = await LLMService.getAllProviders();
    return NextResponse.json({ success: true, data: providers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch LLM providers';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, provider, apiKey, modelName, apiUrl, isActive } = body;

    if (!name || !provider || !modelName) {
      return NextResponse.json(
        { success: false, error: 'Name, provider, and modelName are required fields.' },
        { status: 400 }
      );
    }

    const newProvider = await LLMService.upsertProvider({
      name,
      provider,
      apiKey,
      modelName,
      apiUrl,
      isActive,
    });

    return NextResponse.json({ success: true, data: newProvider }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save LLM provider';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
