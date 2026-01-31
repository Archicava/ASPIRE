import { NextRequest, NextResponse } from 'next/server';

import { retryCasePrediction } from '@/lib/data-platform';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await retryCasePrediction(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      caseRecord: result.caseRecord
    });
  } catch (error) {
    console.error('[retry/route] Failed to retry prediction:', error);
    return NextResponse.json(
      { error: 'Failed to retry prediction' },
      { status: 500 }
    );
  }
}
