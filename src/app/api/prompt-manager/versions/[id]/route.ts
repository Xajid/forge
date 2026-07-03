import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/prompt-manager/versions/[id] — Get a single version
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const version = await db.promptVersion.findUnique({ where: { id } });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: version.id,
      projectId: version.projectId,
      title: version.title,
      content: version.content,
      version: version.version,
      tags: version.tags ? version.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: version.notes,
      variables: version.variables ? version.variables.split(',').map((v) => v.trim()).filter(Boolean) : [],
      parentId: version.parentId,
      createdAt: version.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
  }
}