import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    // Default to Google Antigravity
    return NextResponse.redirect(new URL('/browse?url=' + encodeURIComponent('https://experiments.withgoogle.com/'), request.url));
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const baseUrl = new URL(targetUrl);
    
    // Get cookies from request to forward
    const cookies = request.headers.get('cookie') || '';
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'manual', // Handle redirects manually
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectUrl = location.startsWith('http') 
          ? location 
          : `${baseUrl.origin}${location.startsWith('/') ? '' : '/'}${location}`;
        return NextResponse.redirect(new URL(`/browse?url=${encodeURIComponent(redirectUrl)}`, request.url));
      }
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // Rewrite all URLs to go through our proxy
      const proxyBase = '/browse?url=';
      
      // Rewrite href, src, action attributes
      html = html.replace(/(href|src|action)=(["'])(\/[^"']*)(["'])/gi, (match, attr, q1, path, q2) => {
        const fullUrl = `${baseUrl.origin}${path}`;
        return `${attr}=${q1}${proxyBase}${encodeURIComponent(fullUrl)}${q2}`;
      });
      
      html = html.replace(/(href|src|action)=(["'])(https?:\/\/[^"']*)(["'])/gi, (match, attr, q1, absUrl, q2) => {
        return `${attr}=${q1}${proxyBase}${encodeURIComponent(absUrl)}${q2}`;
      });
      
      // Rewrite form actions
      html = html.replace(/(<form[^>]*action=["'])(\/[^"']*)([^>]*>)/gi, (match, prefix, path, suffix) => {
        const fullUrl = `${baseUrl.origin}${path}`;
        return `${prefix}${proxyBase}${encodeURIComponent(fullUrl)}${suffix}`;
      });

      // Add navigation bar at top
      const navBar = `
        <div style="position:fixed;top:0;left:0;right:0;background:#1f2937;padding:8px 16px;z-index:99999;display:flex;align-items:center;gap:12px;font-family:system-ui;">
          <span style="color:white;font-weight:bold;">🌐 Proxy</span>
          <input id="proxy-url" value="${targetUrl}" style="flex:1;padding:6px 12px;border-radius:6px;border:1px solid #4b5563;background:#111827;color:white;" />
          <button onclick="window.location.href='/browse?url='+encodeURIComponent(document.getElementById('proxy-url').value)" style="padding:6px 16px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;">Go</button>
          <a href="/" style="padding:6px 16px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">Home</a>
        </div>
        <div style="height:50px;"></div>
      `;
      
      html = html.replace(/<body([^>]*)>/i, `<body$1>${navBar}`);
      
      // Forward any Set-Cookie headers
      const setCookie = response.headers.get('set-cookie');
      const headers: HeadersInit = {
        'Content-Type': 'text/html; charset=utf-8',
      };
      
      if (setCookie) {
        headers['Set-Cookie'] = setCookie;
      }
      
      return new NextResponse(html, { headers });
    }
    
    // Pass through other content types
    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      headers: { 'Content-Type': contentType },
    });
    
  } catch (error) {
    console.error('Browse error:', error);
    return new NextResponse(`
      <html>
        <body style="font-family:system-ui;padding:40px;background:#1f2937;color:white;">
          <h1>⚠️ Error Loading Page</h1>
          <p style="color:#f87171;">${error}</p>
          <a href="/browse" style="color:#60a5fa;">← Go Back</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const baseUrl = new URL(targetUrl);
    const formData = await request.text();
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      body: formData,
      redirect: 'manual',
    });

    // Handle redirects after form submission
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectUrl = location.startsWith('http') 
          ? location 
          : `${baseUrl.origin}${location.startsWith('/') ? '' : '/'}${location}`;
        return NextResponse.redirect(new URL(`/browse?url=${encodeURIComponent(redirectUrl)}`, request.url));
      }
    }

    const html = await response.text();
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    
  } catch (error) {
    return NextResponse.json({ error: `Failed: ${error}` }, { status: 500 });
  }
}
