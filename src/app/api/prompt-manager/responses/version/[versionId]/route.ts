import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/prompt-manager/responses/version/[versionId] — Get AI responses for a version
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params;

    const responses = await db.aiResponse.findMany({
      where: { promptVersionId: versionId },
      orderBy: { createdAt: 'desc' },
    });

    const result = responses.map((r) => ({
      id: r.id,
      promptVersionId: r.promptVersionId,
      prompt: r.prompt,
      response: r.response,
      model: r.model,
      tokens: r.tokens,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}