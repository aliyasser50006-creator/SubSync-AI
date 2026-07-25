import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Return early without mutating any request headers to avoid V8 panics in Edge
  let response = NextResponse.next();

  try {
    const cookieName = request.cookies.getAll().find(c => c.name.includes('-auth-token'))?.name;
    if (!cookieName) return response;

    const authCookie = request.cookies.get(cookieName)?.value;
    if (!authCookie) return response;

    let tokenData;
    try {
      tokenData = JSON.parse(authCookie);
      if (Array.isArray(tokenData)) {
        tokenData = { access_token: tokenData[0], refresh_token: tokenData[1] };
      }
    } catch (e) {
      return response;
    }

    if (tokenData?.refresh_token && tokenData?.access_token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return response;

      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${tokenData.access_token}` },
        body: JSON.stringify({ refresh_token: tokenData.refresh_token }),
      });

      if (res.ok) {
        const data = await res.json();
        
        let newCookieValue;
        // Reconstruct correctly safely
        try {
          if (Array.isArray(JSON.parse(authCookie))) {
             newCookieValue = JSON.stringify([data.access_token, data.refresh_token, '', '', '']);
          } else {
             newCookieValue = JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
          }
        } catch (err) {
           newCookieValue = JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token });
        }

        response.cookies.set(cookieName, newCookieValue, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
      }
    }
  } catch (error) {
    console.error('Middleware fetch refresh failed:', error);
  }

  return response;
}
