import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/prompt-manager/versions/[id]/rollback — Create new version based on older one
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sourceVersion = await db.promptVersion.findUnique({ where: { id } });

    if (!sourceVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Auto-increment version number
    const latestVersion = await db.promptVersion.findFirst({
      where: { projectId: sourceVersion.projectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const newVersion = await db.promptVersion.create({
      data: {
        projectId: sourceVersion.projectId,
        title: `${sourceVersion.title} (rollback from v${sourceVersion.version})`,
        content: sourceVersion.content,
        version: nextVersion,
        tags: sourceVersion.tags,
        notes: `Rolled back from version ${sourceVersion.version}`,
        variables: sourceVersion.variables,
        parentId: sourceVersion.id,
      },
    });

    return NextResponse.json(
      {
        id: newVersion.id,
        projectId: newVersion.projectId,
        title: newVersion.title,
        content: newVersion.content,
        version: newVersion.version,
        tags: newVersion.tags ? newVersion.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        notes: newVersion.notes,
        variables: newVersion.variables ? newVersion.variables.split(',').map((v) => v.trim()).filter(Boolean) : [],
        parentId: newVersion.parentId,
        createdAt: newVersion.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error rolling back version:', error);
    return NextResponse.json({ error: 'Failed to rollback version' }, { status: 500 });
  }
}