import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
  const directusToken = process.env.DIRECTUS_API_TOKEN;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // TEMPORARILY DISABLED: Testing if public access works without token
    // Add authorization if token is available
    // if (directusToken) {
    //   headers['Authorization'] = `Bearer ${directusToken}`;
    //   console.log('[API] Using Directus token (length:', directusToken.length, ')');
    // } else {
    //   console.error('[API] DIRECTUS_API_TOKEN not found in environment!');
    // }

    const response = await fetch(`${directusUrl}/items/products?${searchParams}`, {
      headers,
      cache: 'no-store', // Disable caching
    });

    console.log('[API] Directus response status:', response.status);
    console.log('[API] Directus URL:', `${directusUrl}/items/products?${searchParams}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Directus error response:', errorText);
      return NextResponse.json({
        error: 'Failed to fetch products',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();

    // TEMPORARY PATCH: Override specific status for requested content updates
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((product: any) => {
      } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }