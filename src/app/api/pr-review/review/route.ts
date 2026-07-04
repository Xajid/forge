import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diff, title } = body;

    if (!diff || typeof diff !== 'string' || diff.trim().length === 0) {
      return NextResponse.json(
        { error: 'A valid diff is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert senior code reviewer. Review the following Git diff thoroughly.

Provide your review in this EXACT markdown format:

## Score: X/10

## Summary
Brief overview of the changes.

## 🐛 Bug Detection
List any potential bugs found.

## 🔒 Security Issues
List any security concerns.

## ⚡ Performance
List performance-related suggestions.

## 📝 Code Quality
Suggestions for cleaner code.

## ✅ What's Good
Highlight good practices found in the code.

## 💡 Recommendations
Specific actionable recommendations.

Be specific — reference exact line numbers and code snippets from the diff.`,
        },
        {
          role: 'user',
          content: `${title ? `PR: ${title}\n\n` : ''}Here is the diff to review:\n\n${diff}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const review = completion.choices[0]?.message?.content || 'No review generated.';

    // Extract score from the review text
    const scoreMatch = review.match(/Score:\s*(\d+(?:\.\d+)?)\/10/);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

    // Save to DB
    const saved = await db.prReview.create({
      data: { diff, review, score, title, model: 'default' },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('PR Review API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate review. Please try again.' },
      { status: 500 }
    );
  }
}