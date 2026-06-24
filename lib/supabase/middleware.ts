import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Find the Supabase auth cookie (usually named sb-[project_ref]-auth-token)
  const cookieName = request.cookies.getAll().find(c => c.name.includes('-auth-token'))?.name;
  
  if (!cookieName) {
    return response;
  }

  const authCookie = request.cookies.get(cookieName)?.value;
  if (!authCookie) {
    return response;
  }

  try {
    let tokenData;
    
    // Handle both plain JSON and array-wrapped cookie formats
    try {
      tokenData = JSON.parse(authCookie);
      if (Array.isArray(tokenData)) {
        // Handle chunk-encoded format: [access_token, refresh_token, ...]
        tokenData = {
          access_token: tokenData[0],
          refresh_token: tokenData[1],
        };
      }
    } catch (e) {
      // If parsing fails, skip refresh
      return response;
    }
    
    // Only attempt refresh if we have a refresh_token
    if (tokenData && tokenData.refresh_token && tokenData.access_token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) return response;

      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${tokenData.access_token}`
        },
        body: JSON.stringify({ refresh_token: tokenData.refresh_token }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Reconstruct cookie value depending on the original format
        let newCookieValue;
        if (Array.isArray(JSON.parse(authCookie))) {
           newCookieValue = JSON.stringify([data.access_token, data.refresh_token, '', '', '']);
        } else {
           newCookieValue = JSON.stringify({
             access_token: data.access_token,
             refresh_token: data.refresh_token,
             user: data.user
           });
        }
        
        // Update the request and response cookies
        request.cookies.set(cookieName, newCookieValue);
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        
        response.cookies.set(cookieName, newCookieValue, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
      }
    }
  } catch (error) {
    console.error('Manual session refresh failed:', error);
  }

  return response;
}
