import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorService } from '@/services/orchestrator.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await OrchestratorService.validateAndOrchestrate(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Orchestration validation failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
