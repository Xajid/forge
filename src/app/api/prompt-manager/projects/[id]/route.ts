import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/prompt-manager/projects/[id] — Get project with all versions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.promptProject.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const versions = project.versions.map((v) => ({
      id: v.id,
      projectId: v.projectId,
      title: v.title,
      content: v.content,
      version: v.version,
      tags: v.tags ? v.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      notes: v.notes,
      variables: v.variables ? v.variables.split(',').map((v: string) => v.trim()).filter(Boolean) : [],
      parentId: v.parentId,
      createdAt: v.createdAt.toISOString(),
    }));

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      versions,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// DELETE /api/prompt-manager/projects/[id] — Delete a project and its versions
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.promptProject.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete all AI responses linked to versions in this project
    const versions = await db.promptVersion.findMany({ where: { projectId: id }, select: { id: true } });
    const versionIds = versions.map((v) => v.id);

    if (versionIds.length > 0) {
      await db.aiResponse.deleteMany({
        where: { promptVersionId: { in: versionIds } },
      });
    }

    await db.promptVersion.deleteMany({ where: { projectId: id } });
    await db.promptProject.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}