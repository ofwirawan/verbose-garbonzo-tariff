import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.t_date || !body.hs6code || body.trade_original === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: t_date, hs6code, trade_original' },
        { status: 400 }
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Forward the Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${backendUrl}/api/history`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    // Handle different response types
    let data;
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        data = { message: 'Invalid response from server' };
      }
    } else {
      // Handle non-JSON responses (like plain text or empty responses)
      const text = await res.text();
      data = text ? { message: text } : { message: 'Empty response from server' };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json(
      { message: 'Failed to save history' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Forward the Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else {
      return NextResponse.json(
        { message: 'No authorization header provided' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${backendUrl}/api/history`, {
      method: 'GET',
      headers
    });

    // Handle different response types and status codes
    if (res.status === 403) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 } // Return 401 to trigger frontend auth redirect
      );
    }

    if (res.status === 401) {
      return NextResponse.json(
        { message: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: `Backend error: ${res.status} ${res.statusText}` };
      }
      return NextResponse.json(errorData, { status: res.status });
    }

    // Check if response has content
    const contentLength = res.headers.get('content-length');
    const contentType = res.headers.get('content-type');
    
    let data;
    
    if (contentLength === '0' || !contentType || !contentType.includes('application/json')) {
      // Handle empty or non-JSON responses
      data = []; // Return empty array for successful but empty responses
    } else {
      // Try to parse JSON response
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        data = []; // Return empty array if parsing fails but request was successful
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Extract ID from query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID parameter is required' },
        { status: 400 }
      );
    }
    
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Forward the Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const backendUrl = `${apiBaseUrl}/api/history/${id}`;

    const res = await fetch(backendUrl, {
      method: 'DELETE',
      headers
    });

    // Handle different response types
    let data;
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        data = { message: res.ok ? 'Deleted successfully' : 'Delete operation failed' };
      }
    } else {
      // Handle non-JSON responses
      const text = await res.text();
      data = { message: text || (res.ok ? 'Deleted successfully' : 'Delete operation failed') };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json(
      { message: 'Failed to delete history item', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}