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
    cachedToken = data.data.access_token;
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
  const searchParams = request.nextUrl.searchParams;
  
  // Extract all query parameters to pass through to Directus
  const directusParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    directusParams.set(key, value);
  });

  try {
    // Get authenticated token
    const token = await getAccessToken();

    // Build asset URL with all query parameters
    let assetUrl = `${DIRECTUS_URL}/assets/${id}`;
    if (directusParams.toString()) {
      assetUrl += `?${directusParams.toString()}`;
    }

    // Fetch asset with authentication
    const response = await fetch(assetUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      // Don't cache the fetch, let Next.js handle caching
      cache: 'no-store'
    });

    if (!response.ok) {
      // If 403, try alternative approach: get file metadata and construct storage path
      if (response.status === 403) {
        try {
          // Get file metadata to verify it exists and get storage info
          const fileResponse = await fetch(`${DIRECTUS_URL}/files/${id}?fields=*,storage`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            const file = fileData.data;
            
            if (file) {
              // Try alternative: use the files endpoint with download parameter
              // Some Directus setups allow downloading via /files endpoint
              const downloadResponse = await fetch(`${DIRECTUS_URL}/files/${id}?download`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (downloadResponse.ok) {
                const blob = await downloadResponse.blob();
                const headers = new Headers();
                headers.set('Content-Type', file.type || 'application/octet-stream');
                headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=172800');
                
                return new NextResponse(blob, {
                  status: 200,
                  headers,
                });
              }
              
              // If download also fails, log the issue
              console.error(`Asset access blocked for file ${id} (exists: ${!!file}, storage: ${file.storage})`);
            }
          }
        } catch (e) {
          // Ignore fallback errors
          console.error('Fallback asset fetch failed:', e);
        }
      }
      
      return new NextResponse(
        `Asset access error: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    // Get the blob
    const blob = await response.blob();
    const headers = new Headers();

    // Copy important headers from Directus response
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Set cache headers for images (24 hours)
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