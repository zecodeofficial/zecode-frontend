'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { STORES } from '@/data/stores';
import { Store } from '@/types/store';
import PageHeader from '@/components/PageHeader';

declare global {
    interface Window {
        google: any;
    }
}

export default function StoreLocatorMapPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [stores] = useState<Store[]>(STORES); // Use local data permanently
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.tags && store.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey || !window.google) return;

        // Initialize map
        const mapOptions = {
            center: { lat: 12.9716, lng: 77.5946 }, // Center on Karnataka
            zoom: 10,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Add markers for all stores
        markersRef.current = stores.map(store => {
            const marker = new window.google.maps.Marker({
                position: { lat: store.lat, lng: store.lng },
                map: mapInstanceRef.current,
                title: store.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#C83232" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(24, 24),
                },
            });

            marker.addListener('click', () => {
                setSelectedStore(store);
            });

            return marker;
        });

        // Fit bounds to show all markers
        if (stores.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            stores.forEach(store => {
                bounds.extend({ lat: store.lat, lng: store.lng });
            });
            mapInstanceRef.current.fitBounds(bounds);
        }
    }, [stores]);

    useEffect(() => {
        // Update selected marker
        markersRef.current.forEach((marker, index) => {
            const store = stores[index];
            if (selectedStore && store.id === selectedStore.id) {
                marker.setIcon({
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" fill="#C83232" stroke="white" stroke-width="3"/>
                            <text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-weight="bold">S</text>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(32, 32),
                });
                mapInstanceRef.current?.setCenter({ lat: store.lat, lng: store.lng });
                mapInstanceRef.current?.setZoom(15);
            } else {
                marker.setIcon({
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#C83232" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(24, 24),
                });
            }
        });
    }, [selectedStore, stores]);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: 'var(--font-din-condensed), sans-serif'
        }}>
            {/* Load Google Maps API */}
            <script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                async
                defer
            />

            {/* Header Section */}
            <PageHeader pageKey="store-locator-map" defaultTitle="STORE LOCATOR" subtitle="Find a ZECODE store near you" />

            {/* Main Content - Map and Store List */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 350px',
                height: 'calc(100vh - 100px)',
                gap: '0'
            }}>
                {/* Map Section - Left */}
                <div style={{
                    backgroundColor: '#e5e7eb',
                    position: 'relative'
                }}>
                    <div
                        ref={mapRef}
                        style={{
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </div>

                {/* Store List Sidebar - Right */}
                <div style={{
                    backgroundColor: '#ffffff',
                    overflowY: 'auto',
                    borderLeft: '1px solid #e5e7eb'
                }}>
                    {/* Search Bar */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                    }}>
                        <input
                            type="text"
                            placeholder="Search by city, area, or store name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{
                        padding: '16px',
                        borderBottom: '2px solid #000000',
                        backgroundColor: '#f9fafb'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-din-condensed)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            margin: '0'
                        }}>
                            {filteredStores.length} Stores Found
                        </h2>
                    </div>

                    {filteredStores.length === 0 ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#6b7280'
                        }}>
                            <p>No stores found matching your search</p>
                        </div>
                    ) : (
                        filteredStores.map((store) => (
                            <div
                                key={store.id}
                                onClick={() => setSelectedStore(store)}
                                className="store-list-item"
                                style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    backgroundColor: selectedStore?.id === store.id ? '#f3f4f6' : '#ffffff'
                                }}
                            >
                                <h3 style={{
                                    fontFamily: 'var(--font-din-condensed)',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    color: selectedStore?.id === store.id ? '#C83232' : '#111827'
                                }}>
                                    {store.name}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    marginBottom: '8px',
                                    lineHeight: '1.5'
                                }}>
                                    📍 {store.address}
                                </p>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    fontSize: '13px',
                                    color: '#4b5563'
                                }}>
                                    <div>📞 <a href={`tel:${store.phone}`} style={{ color: '#4b5563', textDecoration: 'none' }}>{store.phone}</a></div>
                                    <div>✉️ <a href={`mailto:${store.email}`} style={{ color: '#4b5563', textDecoration: 'none' }}>{store.email}</a></div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                    marginTop: '12px'
                                }}>
                                    {store.tags.slice(0, 3).map((tag, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: '11px',
                                                padding: '4px 8px',
                                                backgroundColor: '#e5e7eb',
                                                borderRadius: '4px',
                                                color: '#4b5563'
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <Link
                                    href={`/store/${store.slug}`}
                                    className="store-details-btn"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        backgroundColor: '#C83232',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        transition: 'transform 0.2s, opacity 0.2s'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    VIEW STORE DETAILS →
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
