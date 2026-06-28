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

if (!userId || !icons.length) {
  console.error('Missing userId or icons');
  process.exit(1);
}

const tempDir = path.join(os.tmpdir(), `kit-${userId}`);
const distDir = path.join(os.tmpdir(), `dist-${userId}`);

// MIME type mapping
const MIME_TYPES = {
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.svg': 'image/svg+xml',
};

try {
  // 1. Fetch SVGs
  const { data: rows, error } = await supabase
    .from('icons')
    .select('name, svg, source_repo')
    .in('name', icons);

  if (error) throw error;
  if (!rows.length) throw new Error('No icons found');

  await fs.mkdir(tempDir, { recursive: true });
  for (const icon of rows) {
    if (!icon.svg) continue;
    const fileName = `${icon.source_repo}_${icon.name}.svg`;
    await fs.writeFile(path.join(tempDir, fileName), icon.svg);
  }

  // 2. Generate font
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

  // 3. Upload only needed font files + CSS
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

  // 4. Public URL (only if CSS was uploaded)
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
