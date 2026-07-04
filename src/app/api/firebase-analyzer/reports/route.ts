import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reports = await db.firebaseReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        createdAt: true,
        data: true,
      },
    });

    // Parse the analysis summary from data for each report
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        try {
          const data = JSON.parse(report.data);
          return {
            id: report.id,
            name: report.name,
            createdAt: report.createdAt,
            totalCost: data.analysis?.total ? Math.round(data.analysis.total * 100) / 100 : null,
            period: data.period || null,
          };
        } catch {
          return {
            id: report.id,
            name: report.name,
            createdAt: report.createdAt,
            totalCost: null,
            period: null,
          };
        }
      })
    );

    return NextResponse.json(enrichedReports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}