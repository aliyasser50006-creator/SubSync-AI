// Provide a global fallback for Edge Runtime to prevent ReferenceError from transitive dependencies
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).__dirname === 'undefined') {
  (globalThis as any).__dirname = '';
}

import { type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
