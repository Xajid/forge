import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reviews = await db.prReview.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        score: true,
        createdAt: true,
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('List reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}