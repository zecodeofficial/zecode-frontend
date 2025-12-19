import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'zecode@siyaram.com';
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "S!Y@rAM's";

// Cache for access token to avoid logging in on every request
// Note: In serverless environments, this cache may not persist across instances
// but it still helps reduce login requests within the same instance
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: DIRECTUS_EMAIL,
        password: DIRECTUS_PASSWORD
      }),
      // Don't cache the login request
      cache: 'no-store'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(`Directus login failed: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const token = data.data?.access_token;
    
    if (!token || typeof token !== 'string') {
      throw new Error('Directus login response missing access_token');
    }
    
    cachedToken = token;
    // Tokens typically expire in 1 hour, cache for 55 minutes
    tokenExpiry = Date.now() + (55 * 60 * 1000);
    
    return cachedToken;
  } catch (error) {
    console.error('Failed to get Directus access token:', error);
    throw error;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    // Get authenticated token
    const token = await getAccessToken();

    // WORKAROUND: Directus /assets/ endpoint has a bug where it returns JSON (file metadata)
    // instead of the actual image, even with authentication. Skip it and use /files/{id}?download directly.
    // Get file metadata first to get the correct content type
    const fileResponse = await fetch(`${DIRECTUS_URL}/files/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (!fileResponse.ok) {
      return new NextResponse(
        `File not found: ${fileResponse.status} ${fileResponse.statusText}`,
        { status: fileResponse.status }
      );
    }
    
    const fileData = await fileResponse.json();
    const file = fileData.data;
    
    if (!file) {
      return new NextResponse(
        `File metadata not found for ID: ${id}`,
        { status: 404 }
      );
    }
    
    // Use the files endpoint with download parameter to get the actual image
    const downloadResponse = await fetch(`${DIRECTUS_URL}/files/${id}?download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (!downloadResponse.ok) {
      console.error(`Failed to download file ${id}: ${downloadResponse.status} ${downloadResponse.statusText}`);
      return new NextResponse(
        `Failed to download file: ${downloadResponse.status} ${downloadResponse.statusText}`,
        { status: downloadResponse.status }
      );
    }
    
    const blob = await downloadResponse.blob();
    const headers = new Headers();
    headers.set('Content-Type', file.type || 'application/octet-stream');
    const contentLength = downloadResponse.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=172800');
    
    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Asset proxy error:', error);
    return new NextResponse(
      `Internal server error: ${error.message}`,
      { status: 500 }
    );
  }
}