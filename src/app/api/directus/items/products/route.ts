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
        // 1. Dark Blue Top -> Kurta
        if (product.id === 45) {
          product.name = "Women's Indigo Printed Cotton Kurta";
          product.slug = "womens-indigo-printed-cotton-kurta";
          product.subcategory = "Kurta";
          product.description = "Experience the perfect blend of tradition and comfort with this Indigo Printed Cotton Kurta. Crafted from breathable fabric, multiple prints add a contemporary touch to the classic silhouette. Ideal for casual outings or workwear.";
        }
        // 2. Purple Jacket -> Active Hoodie
        if (product.id === 54) {
          product.name = "Women's Performance Active Hoodie - Purple";
          product.slug = "womens-performance-active-hoodie-purple";
          product.subcategory = "Activewear";
          product.gender_category = "Women"; // Ensure it matches
          product.description = "Elevate your workout in this Performance Active Hoodie. Designed with moisture-wicking fabric and four-way stretch, it keeps you cool and moving freely. Features a sleek zip header and thumbholes for a secure fit.";
        }
      });
      console.log('[API] Applied data patches for products 45 and 54');
    }

    console.log('[API] Successfully fetched', data.data?.length || 0, 'products');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}