#!/usr/bin/env node
/**
 * scripts/cloudinary-cleanup.js
 *
 * Safe Cloudinary cleanup utility.
 * - Dry-run mode (default) lists candidate placeholder/unused images and writes a report
 * - Delete mode (--delete) will remove candidates after an explicit --force flag
 *
 * Usage (PowerShell):
 *  $env:CLOUDINARY_CLOUD_NAME='ds8llatku'; $env:CLOUDINARY_API_KEY='KEY'; $env:CLOUDINARY_API_SECRET='SECRET'; node .\scripts\cloudinary-cleanup.js --dry-run
 *  node .\scripts\cloudinary-cleanup.js --dry-run --protect-file=used-ids.json
 *  node .\scripts\cloudinary-cleanup.js --delete --force --protect-file=used-ids.json
 *
 * Notes:
 * - This script DOES NOT automatically decide what is "in use". Provide a protect-file (JSON array of public_ids)
 *   exported from your Directus data (or run the `list-used-product-images.js` script and save results).
 * - Always run with --dry-run first and review `cloudinary-cleanup-report.json`.
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const argv = yargs
  .option('dry-run', { type: 'boolean', default: true, describe: 'List candidates but do not delete' })
  .option('delete', { type: 'boolean', default: false, describe: 'Actually delete candidates (use with --force)' })
  .option('force', { type: 'boolean', default: false, describe: 'Force deletion without confirmation prompt' })
  .option('protect-file', { type: 'string', describe: 'Path to JSON file containing array of protected public_ids' })
  .option('prefix', { type: 'string', default: 'zecode', describe: 'Cloudinary prefix/folder to search' })
  .option('max-results', { type: 'number', default: 500, describe: 'Max resources per API page (Cloudinary limit 500)' })
  .help()
  .argv;

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listAllResources(prefix) {
  const results = [];
  let next_cursor = undefined;
  do {
    const res = await cloudinary.api.resources({
      type: 'upload',
      prefix,
      max_results: argv['max-results'],
      next_cursor,
    });
    if (res.resources && res.resources.length) results.push(...res.resources);
    next_cursor = res.next_cursor;
  } while (next_cursor);
  return results;
}

function looksLikePlaceholder(resource) {
  // Heuristics for placeholder/unused images
  const id = (resource.public_id || '').toLowerCase();
  const filename = path.basename(id);
  const tags = (resource.tags || []).map(t => t.toLowerCase());

  // common placeholder tokens
  const placeholderTokens = ['placeholder', 'no-image', 'noimage', 'not-available', 'sample', 'temp', 'dummy', 'test', 'placeholder_image', 'extracted-products/placeholder'];
  for (const t of placeholderTokens) if (id.includes(t) || tags.includes(t)) return true;

  // very small files (likely placeholders) - bytes field available
  if (resource.bytes && resource.bytes > 0 && resource.bytes < 4 * 1024) return true; // <4KB

  // extremely small dimensions
  if (resource.width && resource.height && (resource.width < 50 || resource.height < 50)) return true;

  // public_id patterns for temporary/generated images
  if (id.includes('_tmp_') || id.includes('_temp_') || id.includes('generated')) return true;

  return false;
}

(async function main(){
  try {
    console.log(`Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME} — scanning prefix: ${argv.prefix}`);

    const protectSet = new Set();
    if (argv['protect-file']) {
      const pf = path.resolve(argv['protect-file']);
      if (!fs.existsSync(pf)) {
        console.error('❌ protect-file not found:', pf);
        process.exit(1);
      }
      const arr = JSON.parse(fs.readFileSync(pf, 'utf8'));
      if (!Array.isArray(arr)) {
        console.error('❌ protect-file must be a JSON array of public_ids');
        process.exit(1);
      }
      arr.forEach(id => protectSet.add(String(id)));
      console.log(`🔒 Loaded ${protectSet.size} protected public_ids`);
    }

    const all = await listAllResources(argv.prefix);
    console.log(`Found ${all.length} resources under prefix ${argv.prefix}`);

    const candidates = all.filter(r => looksLikePlaceholder(r) && !protectSet.has(r.public_id));

    const report = {
      scanned_at: new Date().toISOString(),
      prefix: argv.prefix,
      total_resources: all.length,
      candidate_count: candidates.length,
      candidates: candidates.map(r => ({ public_id: r.public_id, format: r.format, bytes: r.bytes, width: r.width, height: r.height, tags: r.tags || [] })),
    };

    const outPath = path.join(__dirname, 'cloudinary-cleanup-report.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`
✅ Dry-run complete — report written to ${outPath}`);
    console.log(`Candidates: ${report.candidate_count} (first 10):`);
    console.log(report.candidates.slice(0,10).map(c => c.public_id).join('\n'));

    if (argv.delete) {
      if (argv['dry-run'] && !argv.force) {
        console.error('\n❗ Running with --delete also requires --force to actually delete (or omit --dry-run).');
        process.exit(1);
      }

      if (!argv.force) {
        // interactive confirmation
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(res => rl.question(`Proceed to DELETE ${candidates.length} resources? Type DELETE to confirm: `, ans => { rl.close(); res(ans); }));
        if (answer !== 'DELETE') {
          console.log('Aborted by user. No deletions performed.');
          process.exit(0);
        }
      }

      // perform deletions in batches
      console.log(`Deleting ${candidates.length} resources...`);
      for (const c of candidates) {
        try {
          const r = await cloudinary.uploader.destroy(c.public_id, { resource_type: 'image' });
          console.log(`Deleted: ${c.public_id} -> ${r.result}`);
        } catch (err) {
          console.error(`Failed to delete ${c.public_id}:`, err.message || err);
        }
      }
      console.log('Done deletions. Update report to reflect deletions.');
    }

  } catch (err) {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  }
})();
