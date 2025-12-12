
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Use global fetch (Node 18+)
// const fetch = global.fetch; 


const BASE_URL = 'https://zecode-frontend.vercel.app';
const VISITED = new Set<string>();
const BROKEN_LINKS: { source: string; url: string; status: number }[] = [];
const QUEUE: string[] = [BASE_URL];
const MAX_DEPTH = 3; // Limit crawl depth

// Helper to normalized URLs
function normalizeUrl(url: string, baseUrl: string): string | null {
    try {
        const fullUrl = new URL(url, baseUrl);
        // Ignore mailto, tel, etc.
        if (!['http:', 'https:'].includes(fullUrl.protocol)) return null;
        return fullUrl.href;
    } catch (e) {
        return null;
    }
}

async function checkLink(url: string): Promise<number> {
    try {
        const res = await fetch(url, { method: 'HEAD', timeout: 5000 });
        return res.status;
    } catch (e) {
        // Retry with GET if HEAD fails (some servers deny HEAD)
        try {
            const res = await fetch(url, { method: 'GET', timeout: 5000 });
            return res.status;
        } catch (e2) {
            return 0; // Connection error
        }
    }
}

async function crawl() {
    console.log(`Starting crawl of ${BASE_URL}...`);

    while (QUEUE.length > 0) {
        const currentUrl = QUEUE.shift()!;
        if (VISITED.has(currentUrl)) continue;
        VISITED.add(currentUrl);

        console.log(`Scanning: ${currentUrl}`);

        try {
            const res = await fetch(currentUrl);
            if (res.status !== 200) {
                BROKEN_LINKS.push({ source: 'Crawl Entry', url: currentUrl, status: res.status });
                continue;
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            // Find all links
            $('a').each(async (_, el) => {
                const href = $(el).attr('href');
                if (!href) return;

                const fullLink = normalizeUrl(href, currentUrl);
                if (!fullLink) return;

                // Verify link integrity
                // Optimization: Don't check same external link multiple times globally if possible, 
                // but for now simple logic:

                // If it's internal and not visited, add to queue
                if (fullLink.startsWith(BASE_URL)) {
                    if (!VISITED.has(fullLink) && !QUEUE.includes(fullLink)) {
                        QUEUE.push(fullLink);
                    }
                }

                // Check availability (optional: mainly check 404s)
                // We could optimize by having a checked cache
            });
        } catch (e) {
            console.error(`Error scanning ${currentUrl}:`, e);
        }
    }

    // Phase 2: Validate all collected distinct links?
    // Actually, standard crawlers check links AS matches are found. The above logic 
    // just finds pages. Let's do a more direct check.
}

// Improved Crawler with Link Checking
async function audit() {
    console.log(`🔍 Starting Link Audit for ${BASE_URL}`);

    const pagesToVisit = [BASE_URL];
    const visitedPages = new Set<string>();
    const checkedLinks = new Map<string, number>(); // URL -> Status
    const brokenLinks: any[] = [];

    while (pagesToVisit.length > 0) {
        const pageUrl = pagesToVisit.shift()!;
        if (visitedPages.has(pageUrl)) continue;
        visitedPages.add(pageUrl);

        console.log(`📄 _Analyzing page_: ${pageUrl}`);

        try {
            const res = await fetch(pageUrl);
            const html = await res.text();

            if (res.status >= 400) {
                console.log(`❌ Page error: ${res.status}`);
                continue;
            }

            const $ = cheerio.load(html);
            const anchors = $('a');

            // Extract all unique links on this page
            const linksOnPage = new Set<string>();
            anchors.each((_, el) => {
                const href = $(el).attr('href');
                if (href) {
                    const normalized = normalizeUrl(href, pageUrl);
                    if (normalized) linksOnPage.add(normalized);
                }
            });

            // Check each link
            for (const link of linksOnPage) {
                // If we haven't checked this link yet
                if (!checkedLinks.has(link)) {
                    process.stdout.write(`   Checking ${link}... `);
                    const status = await checkLink(link);
                    checkedLinks.set(link, status);

                    if (status >= 400 || status === 0) {
                        console.log(`❌ BROKEN (${status})`);
                        brokenLinks.push({ source: pageUrl, url: link, status });
                    } else {
                        console.log(`✅ ${status}`);
                    }

                    // If it's an internal link we haven't visited, add to crawl queue
                    if (link.startsWith(BASE_URL) && !visitedPages.has(link) && !pagesToVisit.includes(link)) {
                        pagesToVisit.push(link);
                    }
                } else {
                    // We already checked it. If it was broken, record this new occurrence?
                    // Optional, but good for reporting.
                    const status = checkedLinks.get(link)!;
                    if (status >= 400 || status === 0) {
                        brokenLinks.push({ source: pageUrl, url: link, status });
                    }
                }
            }

        } catch (e) {
            console.error(`Error processing page ${pageUrl}:`, e);
        }
    }

    console.log('\n--- 📊 Audit Complete ---');
    console.log(`Pages Scanned: ${visitedPages.size}`);
    console.log(`Unique Links Checked: ${checkedLinks.size}`);
    console.log(`Broken Links Found: ${brokenLinks.length}`);

    if (brokenLinks.length > 0) {
        console.log('\n❌ Broken Links List:');
        brokenLinks.forEach(b => {
            console.log(` [${b.status}] ${b.url} (Found on: ${b.source})`);
        });

        // Save to file
        fs.writeFileSync('broken_links_report.json', JSON.stringify(brokenLinks, null, 2));
    } else {
        console.log('✅ No broken links found!');
    }
}

audit();
