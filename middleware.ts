import { NextResponse } from 'next/server';

export function middleware() {
  try {
    return NextResponse.json({
      status: 'middleware-ok',
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: ['/'],
};
