'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug, STORES } from '@/data/stores';
import { Store } from '@/types/store';
import { getProductsByIds } from '@/data/products';
import GoogleReviews from '@/components/GoogleReviews';
import StorePhotoGallery from '@/components/StorePhotoGallery';
import FeaturedProducts from '@/components/FeaturedProducts';
import Breadcrumb from '@/components/Breadcrumb';

export default function StoreDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    // Initial fallback to local data if available
    const [store, setStore] = useState<Store | null>(() => getStoreBySlug(slug) || null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                const response = await fetch(`/api/stores?slug=${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        setStore(data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch store details from API:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStoreData();
    }, [slug]);

    if (isLoading && !store) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"DIN Condensed", sans-serif'
            }}>
                <p style={{ fontSize: '24px', color: '#666' }}>Loading store details...</p>
            </div>
        );
    }

    if (!store) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: '"DIN Condensed", sans-serif',
                padding: '20px'
            }}>
                <h1 style={{ fontSize: '48px', color: '#C83232', marginBottom: '20px' }}>
                    Store Not Found
                </h1>
                <Link href="/store-locator" style={{
                    padding: '12px 30px',
                    backgroundColor: '#C83232',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '5px',
                    fontSize: '18px'
                }}>
                    Back to Store Locator
                </Link>
            </div>
        );
    }

    // Google Maps embed URL with the store location
    // Using place_id for accurate display of store name and address
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const place_id = (store as any).place_id || store.placeId; // Support both schemas during transition
    const mapEmbedUrl = place_id
        ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${place_id}&zoom=15`
        : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(store.address)}&zoom=15`;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            fontFamily: '"DIN Condensed", sans-serif'
        }}>
            {/* Breadcrumb */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '20px 20px 0 20px'
            }}>
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Store Locator', href: '/store-locator' },
                        { label: store.name }
                    ]}
                />
            </div>

            {/* Main Content */}
            <main style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '20px'
            }}>
                {/* Store Title */}
                <h1 style={{
                    fontSize: '48px',
                    color: '#000000',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                }}>
                    {store.name}
                </h1>

                {store.openedDate && (
                    <p style={{
                        fontSize: '16px',
                        color: '#666',
                        marginBottom: '30px'
                    }}>
                        Opened: {store.openedDate}
                    </p>
                )}

                {/* Store Description */}
                {store.description && (
                    <section style={{
                        backgroundColor: '#f9f9f9',
                        padding: '30px',
                        borderRadius: '10px',
                        marginBottom: '40px'
                    }}>
                        <h2 style={{
                            fontSize: '28px',
                            color: '#C83232',
                            marginBottom: '20px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            ABOUT THIS STORE
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: '#333',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {store.description}
                        </p>
                    </section>
                )}

                {/* Photo Gallery */}
                {store.photos && store.photos.length > 0 && (
                    <StorePhotoGallery photos={store.photos} storeName={store.name} />
                )}

                {/* Two Column Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '40px',
                    marginBottom: '40px'
                }}>
                    {/* Left Column - Store Details */}
                    <div>
                        <section style={{
                            backgroundColor: '#f9f9f9',
                            padding: '30px',
                            borderRadius: '10px',
                            marginBottom: '30px'
                        }}>
                            <h2 style={{
                                fontSize: '28px',
                                color: '#C83232',
                                marginBottom: '20px',
                                fontWeight: 'bold'
                            }}>
                                STORE INFORMATION
                            </h2>

                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    color: '#000',
                                    marginBottom: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    Address:
                                </h3>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#333',
                                    lineHeight: '1.6'
                                }}>
                                    {store.address}<br />
                                    {store.city}, {store.state} {store.pincode}
                                </p>
                            </div>

                            {store.tags && store.tags.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        color: '#000',
                                        marginBottom: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        Nearby Areas:
                                    </h3>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#333',
                                        lineHeight: '1.6'
                                    }}>
                                        {store.tags.join(', ')}
                                    </p>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    color: '#000',
                                    marginBottom: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    Phone Number:
                                </h3>
                                <a href={`tel:${store.phone}`} style={{
                                    fontSize: '16px',
                                    color: '#C83232',
                                    textDecoration: 'none'
                                }}>
                                    {store.phone}
                                </a>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    color: '#000',
                                    marginBottom: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    Email Id:
                                </h3>
                                <a href={`mailto:${store.email}`} style={{
                                    fontSize: '16px',
                                    color: '#C83232',
                                    textDecoration: 'none'
                                }}>
                                    {store.email}
                                </a>
                            </div>

                            {store.workingHours && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        color: '#000',
                                        marginBottom: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        Working Hours:
                                    </h3>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#333'
                                    }}>
                                        {store.workingHours}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '15px',
                                marginTop: '30px'
                            }}>
                                <a
                                    href={`tel:${store.phone}`}
                                    className="call-btn"
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        backgroundColor: '#C83232',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '5px',
                                        textAlign: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        transition: 'transform 0.3s, opacity 0.3s'
                                    }}
                                >
                                    📞 CALL NOW
                                </a>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="directions-btn"
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        backgroundColor: '#000000',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '5px',
                                        textAlign: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        transition: 'transform 0.3s, opacity 0.3s'
                                    }}
                                >
                                    🗺️ GET DIRECTIONS
                                </a>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Google Map */}
                    <div>
                        <div style={{
                            backgroundColor: '#f9f9f9',
                            padding: '20px',
                            borderRadius: '10px',
                            height: '600px'
                        }}>
                            <iframe
                                src={mapEmbedUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    borderRadius: '5px'
                                }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>

                {/* Featured Products Section */}
                {store.featuredProducts && store.featuredProducts.length > 0 && (
                    <FeaturedProducts
                        products={getProductsByIds(store.featuredProducts)}
                        storeName={store.name}
                    />
                )}

                {/* Google Reviews Section */}
                <section style={{
                    backgroundColor: '#f9f9f9',
                    padding: '40px',
                    borderRadius: '10px',
                    marginBottom: '40px'
                }}>
                    <h2 style={{
                        fontSize: '32px',
                        color: '#000000',
                        marginBottom: '30px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        GOOGLE REVIEWS
                    </h2>

                    <GoogleReviews placeId={place_id} storeName={store.name} />
                </section>

                {/* Back to Store Locator */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Link href="/store-locator" style={{
                        display: 'inline-block',
                        padding: '15px 40px',
                        backgroundColor: '#000000',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        ← BACK TO ALL STORES
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#000000',
                color: 'white',
                padding: '40px 20px',
                marginTop: '60px',
                textAlign: 'center'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                        © 2025 ZECODE. All rights reserved.
                    </p>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '30px',
                        marginTop: '20px'
                    }}>
                        <Link href="/store-locator" style={{ color: 'white', textDecoration: 'none' }}>
                            Store Locator
                        </Link>
                        <Link href="/store-locator-map" style={{ color: 'white', textDecoration: 'none' }}>
                            Map View
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
