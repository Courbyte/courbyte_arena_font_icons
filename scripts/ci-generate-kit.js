import { createClient } from '@supabase/supabase-js';
import svgtofont from 'svgtofont';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 1. Connect to Supabase (for fetching the SVG icons from the database)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Connect to Cloudflare R2 (for uploading the final generated kit)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_PUBLIC_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_PUBLIC_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_PUBLIC_SECRET_ACCESS_KEY,
  },
});

const userId = process.env.KIT_USER_ID;
const icons = JSON.parse(process.env.KIT_ICONS || '[]');

if (!userId) {
  console.error('Missing userId');
  process.exit(1);
}

const tempDir = path.join(os.tmpdir(), `kit-${userId}`);
const distDir = path.join(os.tmpdir(), `dist-${userId}`);

const MIME_TYPES = {
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.svg': 'image/svg+xml',
};

try {
  // --- A. FETCH ICONS FROM SUPABASE DATABASE ---
  let query = supabase
    .from('icons')
    .select('name, svg, source_repo, clean_name');

  if (icons.length > 0) {
    query = query.in('name', icons);
  } else {
    query = query.not('clean_name', 'is', null);
  }

  const { data: rows, error } = await query;

  if (error) throw error;
  if (!rows || rows.length === 0) throw new Error('No icons found');

  await fs.mkdir(tempDir, { recursive: true });
  for (const icon of rows) {
    if (!icon.svg) continue;
    const fileName = `${icon.clean_name || icon.source_repo + '_' + icon.name}.svg`;
    await fs.writeFile(path.join(tempDir, fileName), icon.svg);
  }

  // --- B. GENERATE THE FONT ---
  await fs.mkdir(distDir, { recursive: true });
  await svgtofont({
    src: tempDir,
    dist: distDir,
    fontName: 'ca-icons',
    css: true,
    outSVGReact: false,
    outSVGPath: false,
    startUnicode: 0xea01,
    classNamePrefix: 'ca',
    prefix: 'ca',
    svgicons2svgfont: { fontHeight: 1000, normalize: true },
    emptyDist: true,
  });

  // --- C. UPLOAD TO CLOUDFLARE R2 ---
  const neededExtensions = ['.css', '.woff2', '.woff', '.ttf', '.eot', '.svg'];
  const files = await fs.readdir(distDir);
  let uploaded = 0, failed = 0;

  for (const file of files) {
    const ext = path.extname(file);
    if (!neededExtensions.includes(ext)) {
      console.log(`⏭️ Skipped ${file} (not needed)`);
      continue;
    }

    const filePath = path.join(distDir, file);
    const buffer = await fs.readFile(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
      Key: `${userId}/${file}`, 
      Body: buffer,
      ContentType: contentType,
    });

    try {
      await s3Client.send(command);
      console.log(`✔ Uploaded ${file} to Cloudflare`);
      uploaded++;
    } catch (uploadError) {
      console.error(`❌ Failed to upload ${file}:`, uploadError.message);
      failed++;
    }
  }

  if (failed) console.error(`❌ ${failed} upload(s) failed.`);

  // --- D. RETURN THE CLOUDFLARE PUBLIC URL ---
  if (uploaded > 0) {
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${userId}/ca-icons.css`;
    console.log('✅ Kit live at:', publicUrl);
  }

} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
} finally {
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  await fs.rm(distDir, { recursive: true, force: true }).catch(() => {});
}
