import { NextRequest, NextResponse } from 'next/server';
import { fetchStores } from '@/lib/directus';
import { checkRateLimit } from '@/lib/rate-limit';

// Cache stores response for 5 minutes
export const revalidate = 300;

// GET all stores or single store by ID
export async function GET(request: NextRequest) {
    // Rate limiting: 100 requests per minute
    const { allowed, headers } = checkRateLimit(request, { maxRequests: 100 });

    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers }
        );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
        const stores = await fetchStores();

        if (!stores) {
            return NextResponse.json(
                { error: 'Failed to fetch stores' },
                { status: 500, headers }
            );
        }

        if (id) {
            // Validate ID is a number
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                return NextResponse.json(
                    { error: 'Invalid store ID' },
                    { status: 400, headers }
                );
            }

            const store = stores.find(s => s.id === parsedId);
            if (!store) {
                return NextResponse.json(
                    { error: 'Store not found' },
                    { status: 404, headers }
                );
            }
            return NextResponse.json(store, { headers });
        }

        if (slug) {
            // Sanitize slug
            const sanitizedSlug = slug.replace(/[^a-zA-Z0-9-]/g, '');
            const store = stores.find(s => s.slug === sanitizedSlug);
            if (!store) {
                return NextResponse.json(
                    { error: 'Store not found' },
                    { status: 404, headers }
                );
            }
            return NextResponse.json(store, { headers });
        }

        // Return all stores with cache headers
        return NextResponse.json(
            { stores: stores, total: stores.length },
            {
                headers: {
                    ...headers,
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                }
            }
        );
    } catch (error) {
        console.error('Stores API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers }
        );
    }
}
