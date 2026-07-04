import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.firebaseReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let data;
    try {
      data = JSON.parse(report.data);
    } catch {
      data = {};
    }

    return NextResponse.json({
      id: report.id,
      name: report.name,
      createdAt: report.createdAt,
      recommendations: report.recommendations,
      analysis: data.analysis || null,
      inputData: {
        name: data.name,
        period: data.period,
        firestore: data.firestore,
        storage: data.storage,
        auth: data.auth,
        hosting: data.hosting,
      },
    });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.firebaseReport.findUnique({ where: { id } });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await db.firebaseReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}