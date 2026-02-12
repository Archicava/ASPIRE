import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { hideCaseRecord, loadCaseRecord } from '@/lib/data-platform';
import { readSessionFromCookie } from '@/lib/auth/session';
import { platformConfig } from '@/lib/config';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(platformConfig.auth.sessionCookieName)?.value;
  return readSessionFromCookie(sessionCookieValue);
}

async function isAdminSession() {
  const session = await getSession();
  if (!session) {
    return false;
  }
  return session.role === 'admin' || session.username === 'admin';
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/cases/[id] - Get a single case
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const caseRecord = await loadCaseRecord(id);
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    return NextResponse.json(caseRecord);
  } catch (error) {
    console.error('[cases/[id]] Failed to load case', error);
    return NextResponse.json({ error: 'Failed to load case' }, { status: 500 });
  }
}

// DELETE /api/cases/[id] - Hide/remove a case (admin only)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  // Check admin access
  if (!(await isAdminSession())) {
    return NextResponse.json({ success: false, error: 'Forbidden - admin access required' }, { status: 403 });
  }

  try {
    const { id: caseId } = await params;

    // Verify the case exists (either in storage or seed data)
    const existingCase = await loadCaseRecord(caseId);
    if (!existingCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // Hide the case
    const result = hideCaseRecord(caseId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Case ${caseId} has been removed` });
  } catch (error) {
    console.error('[cases/[id]] Failed to hide case', error);
    return NextResponse.json({ success: false, error: 'Failed to remove case' }, { status: 500 });
  }
}
