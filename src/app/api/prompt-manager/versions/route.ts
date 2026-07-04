import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/prompt-manager/versions — Create a new version
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, title, content, tags, notes, variables, parentId } = body;

    if (!projectId || !title || !content) {
      return NextResponse.json(
        { error: 'projectId, title, and content are required' },
        { status: 400 }
      );
    }

    // Check project exists
    const project = await db.promptProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Auto-increment version number
    const latestVersion = await db.promptVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const version = await db.promptVersion.create({
      data: {
        projectId,
        title: title.trim(),
        content,
        version: nextVersion,
        tags: tags && Array.isArray(tags) ? tags.join(', ') : null,
        notes: notes?.trim() || null,
        variables:
          variables && Array.isArray(variables) ? variables.join(', ') : null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}