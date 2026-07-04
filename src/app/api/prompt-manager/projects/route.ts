import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/prompt-manager/projects — Create a new prompt project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const project = await db.promptProject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// GET /api/prompt-manager/projects — List all projects with version counts
export async function GET() {
  try {
    const projects = await db.promptProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { versions: true },
        },
      },
    });

    const result = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      versionCount: p._count.versions,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}