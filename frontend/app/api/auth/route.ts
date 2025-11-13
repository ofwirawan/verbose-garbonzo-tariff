import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);

    // Handle token refresh endpoint
    if (pathname === '/api/auth/refresh') {
      console.log('[Auth Proxy] Handling token refresh request');

      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return NextResponse.json(
          { message: 'No authorization token provided' },
          { status: 401 }
        );
      }

      const backendUrl = `${BACKEND_URL}/api/auth/refresh`;

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      const data = await response.json();

      return NextResponse.json(data, { status: response.status });
    }

    // Regular auth endpoint proxying
    const endpoint = pathname.replace('/api/', '');
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/${endpoint}`;

    console.log(`[Auth Proxy] Proxying POST to: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle response
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
    } else {
      data = await response.text();
    }

    console.log(`[Auth Proxy] Response status: ${response.status}`);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Auth Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Authentication failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
