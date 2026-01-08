import { NextRequest, NextResponse } from 'next/server';

const PROXY_BASE = '/api/proxy?url=';

function rewriteUrls(html: string, baseUrl: URL): string {
  const origin = baseUrl.origin;
  
  // Rewrite all href and src attributes
  html = html.replace(/(href|src|action)=(["'])(\/[^"']*)(["'])/gi, (match, attr, q1, path, q2) => {
    const fullUrl = `${origin}${path}`;
    return `${attr}=${q1}${PROXY_BASE}${encodeURIComponent(fullUrl)}${q2}`;
  });
  
  // Rewrite absolute URLs
  html = html.replace(/(href|src|action)=(["'])(https?:\/\/[^"']*)(["'])/gi, (match, attr, q1, url, q2) => {
    return `${attr}=${q1}${PROXY_BASE}${encodeURIComponent(url)}${q2}`;
  });
  
  // Rewrite url() in styles
  html = html.replace(/url\((["']?)(\/[^)"']*)(["']?)\)/gi, (match, q1, path, q2) => {
    const fullUrl = `${origin}${path}`;
    return `url(${q1}${PROXY_BASE}${encodeURIComponent(fullUrl)}${q2})`;
  });
  
  // Rewrite url() with absolute URLs
  html = html.replace(/url\((["']?)(https?:\/\/[^)"']*)(["']?)\)/gi, (match, q1, url, q2) => {
    return `url(${q1}${PROXY_BASE}${encodeURIComponent(url)}${q2})`;
  });

  // Add base tag for relative resources
  html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">`);
  
  return html;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const baseUrl = new URL(targetUrl);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    
    // For HTML content, rewrite all URLs
    if (contentType.includes('text/html')) {
      let html = await response.text();
      html = rewriteUrls(html, baseUrl);
      
      // Remove X-Frame-Options blocking
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy': "frame-ancestors 'self' *",
        },
      });
    }
    
    // For CSS, rewrite URLs
    if (contentType.includes('text/css')) {
      let css = await response.text();
      css = css.replace(/url\((["']?)(\/[^)"']*)(["']?)\)/gi, (match, q1, path, q2) => {
        const fullUrl = `${baseUrl.origin}${path}`;
        return `url(${q1}${PROXY_BASE}${encodeURIComponent(fullUrl)}${q2})`;
      });
      return new NextResponse(css, {
        headers: { 'Content-Type': contentType },
      });
    }
    
    // For other content types, pass through
    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: `Failed to fetch: ${error}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const baseUrl = new URL(targetUrl);
    const body = await request.text();
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      body,
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    
    if (contentType.includes('text/html')) {
      let html = await response.text();
      html = rewriteUrls(html, baseUrl);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
    
    const data = await response.text();
    return new NextResponse(data, {
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('Proxy POST error:', error);
    return NextResponse.json({ error: `Failed: ${error}` }, { status: 500 });
  }
}
