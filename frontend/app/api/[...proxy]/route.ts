import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper function to reconstruct the backend URL
function getBackendUrl(endpoint: string): string {
  return `${BACKEND_URL}/api/${endpoint}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const endpoint = resolvedParams.proxy.join('/');
    const backendUrl = getBackendUrl(endpoint);

    console.log(`[API Proxy] POST ${endpoint} -> ${backendUrl}`);

    let body;
    try {
      body = await request.json();
      console.log(`[API Proxy] Request body parsed:`, body);
    } catch (parseError) {
      console.error('[API Proxy] Failed to parse request body:', parseError);
      return NextResponse.json(
        { message: 'Failed to parse request body' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log(`[API Proxy] Forwarding Authorization header`);
    } else {
      console.log(`[API Proxy] No Authorization header found`);
    }

    console.log(`[API Proxy] Sending request to ${backendUrl} with headers:`, Object.keys(headers));

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log(`[API Proxy] Backend responded with status: ${response.status}`);

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

    console.log(`[API Proxy] Response data:`, data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const endpoint = resolvedParams.proxy.join('/');
    const backendUrl = getBackendUrl(endpoint);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const endpoint = resolvedParams.proxy.join('/');
    const backendUrl = getBackendUrl(endpoint);

    console.log(`[API Proxy] PUT ${endpoint} -> ${backendUrl}`);

    const body = await request.json();

    const authHeader = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers,
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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { message: 'Request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const endpoint = resolvedParams.proxy.join('/');
    const backendUrl = getBackendUrl(endpoint);

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
