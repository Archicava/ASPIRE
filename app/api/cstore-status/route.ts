import { NextResponse } from 'next/server';

import { platformConfig } from '@/lib/config';
import { loadPlatformStatus } from '@/lib/data-platform';

export async function GET() {
  // In local mode, CSTORE is not used for data storage
  if (platformConfig.useLocal) {
    return NextResponse.json({
      status: 'online',
      mode: 'local',
    });
  }

  try {
    const status = await loadPlatformStatus();

    if (!status.cstore) {
      return NextResponse.json({ error: 'CStore status unavailable' }, { status: 503 });
    }

    return NextResponse.json(status.cstore);
  } catch (error) {
    console.error('[cstore-status] Failed to fetch Ratio1 CStore status', error);
    return NextResponse.json({ error: 'Failed to fetch CStore status' }, { status: 500 });
  }
}

