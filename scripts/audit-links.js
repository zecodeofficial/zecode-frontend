
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://zecode-frontend.vercel.app';
const VISITED = new Set();
const BROKEN_LINKS = [];
const QUEUE = [BASE_URL];
const MAX_DEPTH = 3;

function normalizeUrl(url, baseUrl) {
    try {
        const fullUrl = new URL(url, baseUrl);
        if (!['http:', 'https:'].includes(fullUrl.protocol)) return null;
        return fullUrl.href;
    } catch (e) {
        return null;
    }
}

async function checkLink(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
            clearTimeout(timeout);
            return res.status;
        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    } catch (e) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);
            return res.status;
        } catch (e2) {
            return 0;
        }
    }
}

async function audit() {
    console.log(`🔍 Starting Link Audit for ${BASE_URL}`);

    const pagesToVisit = [BASE_URL];
    const visitedPages = new Set();
    const checkedLinks = new Map();
    const brokenLinks = [];

    while (pagesToVisit.length > 0) {
        const pageUrl = pagesToVisit.shift();
        if (visitedPages.has(pageUrl)) continue;
        visitedPages.add(pageUrl);

        console.log(`📄 Analyzing page: ${pageUrl}`);

        try {
            const res = await fetch(pageUrl);
            const html = await res.text();

            if (res.status >= 400) {
                console.log(`❌ Page error: ${res.status}`);
                continue;
            }

            const $ = cheerio.load(html);
            const anchors = $('a');

            const linksOnPage = new Set();
            anchors.each((_, el) => {
                const href = $(el).attr('href');
                if (href) {
                    const normalized = normalizeUrl(href, pageUrl);
                    if (normalized) linksOnPage.add(normalized);
                }
            });

            for (const link of linksOnPage) {
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

                    if (link.startsWith(BASE_URL) && !visitedPages.has(link) && !pagesToVisit.includes(link)) {
                        pagesToVisit.push(link);
                    }
                } else {
                    const status = checkedLinks.get(link);
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
        fs.writeFileSync('broken_links_report.json', JSON.stringify(brokenLinks, null, 2));
    } else {
        console.log('✅ No broken links found!');
    }
}

audit();
