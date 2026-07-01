import { createClient } from '@supabase/supabase-js';
import svgtofont from 'svgtofont';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = process.env.KIT_USER_ID;
const icons = JSON.parse(process.env.KIT_ICONS || '[]');

if (!userId) {
  console.error('Missing userId');
  process.exit(1);
}

// Now icons can be empty (full kit) or a list of names

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
  let query = supabase
    .from('icons')
    .select('name, svg, source_repo, clean_name');

  if (icons.length > 0) {
    // Subset kit: only fetch requested icons
    query = query.in('name', icons);
  } else {
    // Full kit: fetch all icons that have a clean_name
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

  // Generate font
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

  // Upload needed font files + CSS
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

    const { error: uploadError } = await supabase.storage
      .from('kits')
      .upload(`${userId}/${file}`, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ Failed to upload ${file}:`, uploadError.message);
      failed++;
    } else {
      console.log(`✔ Uploaded ${file} (${contentType})`);
      uploaded++;
    }
  }

  if (failed) console.error(`❌ ${failed} upload(s) failed.`);

  if (uploaded > 0) {
    const { data: { publicUrl } } = supabase.storage
      .from('kits')
      .getPublicUrl(`${userId}/ca-icons.css`);
    console.log('✅ Kit live at:', publicUrl);
  }
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
} finally {
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  await fs.rm(distDir, { recursive: true, force: true }).catch(() => {});
}
