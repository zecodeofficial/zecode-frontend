import { NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

export async function GET(request: Request) {
    if (!GOOGLE_MAPS_API_KEY) {
        return NextResponse.json({ error: 'Google Maps API Key missing' }, { status: 500 });
    }

    try {
        // Search for "Zecode" stores. 
        // We use "textsearch" to find places matching the query.
        const query = "Zecode clothing store";
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API Error:', data);
            return NextResponse.json({ error: data.error_message || 'Failed to fetch places' }, { status: 500 });
        }

        const places = data.results || [];

        // transform to our Store interface
        // Note: detailed info like phone number requires a separate Place Details call for each place if not returned in search (textsearch returns basic info).
        // TextSearch usually returns formatted_address, names, geometry (lat/lng), place_id.
        // It might NOT return phone number or opening hours in the list response.
        // For a minimal switch, we will return what we have. If meaningful details are missing, we might need a second step (Details API), but that consumes more quota (1 search + N details).
        // Let's verify what we get.

        const stores = places.map((place: any, index: number) => ({
            id: index + 1, // generated ID
            name: place.name,
            address: place.formatted_address,
            city: place.formatted_address?.split(',').slice(-3)[0]?.trim() || '', // rough heuristic
            state: 'Karnataka', // fallback or extract
            // phone: place.formatted_phone_number, // Not usually in list results
            lat: place.geometry?.location?.lat || 0,
            lng: place.geometry?.location?.lng || 0,
            placeId: place.place_id,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            open_now: place.opening_hours?.open_now
        }));

        return NextResponse.json({ data: stores });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
