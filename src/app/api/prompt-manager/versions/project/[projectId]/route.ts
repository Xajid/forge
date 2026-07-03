import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/prompt-manager/versions/project/[projectId] — Get all versions for a project (ordered desc)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const versions = await db.promptVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    const result = versions.map((v) => ({
      id: v.id,
      projectId: v.projectId,
      title: v.title,
      content: v.content,
      version: v.version,
      tags: v.tags ? v.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: v.notes,
      variables: v.variables ? v.variables.split(',').map((v) => v.trim()).filter(Boolean) : [],
      parentId: v.parentId,
      createdAt: v.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}