import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest, { params }: { params: { proxy: string[] } }) {
  try {
    const endpoint = params.proxy.join('/');
    const backendUrl = `${BACKEND_URL}/${endpoint}`;

    console.log(`[API Proxy] POST ${endpoint} -> ${backendUrl}`);

    const body = await request.json();

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

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

    console.log(`[API Proxy] Response status: ${response.status}`);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { proxy: string[] } }) {
  try {
    const endpoint = params.proxy.join('/');
    const backendUrl = `${BACKEND_URL}/${endpoint}`;

    const authHeader = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { proxy: string[] } }) {
  try {
    const endpoint = params.proxy.join('/');
    const backendUrl = `${BACKEND_URL}/${endpoint}`;

    const authHeader = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers,
    });

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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
