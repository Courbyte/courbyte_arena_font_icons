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

  // 3. Upload to Supabase Storage
  const files = await fs.readdir(distDir);
  for (const file of files) {
    const filePath = path.join(distDir, file);
    const buffer = await fs.readFile(filePath);
    await supabase.storage
      .from('kits')
      .upload(`${userId}/${file}`, buffer, {
        contentType: 'application/octet-stream',
        upsert: true,
      });
  }

  // 4. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('kits')
    .getPublicUrl(`${userId}/ca-icons.css`);

  console.log('✅ Kit live at:', publicUrl);

  // Optional: store URL in a 'kits' table so frontend can fetch it
  await supabase.from('kits').upsert({
    user_id: userId,
    css_url: publicUrl,
    updated_at: new Date(),
  }).select();

} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
} finally {
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  await fs.rm(distDir, { recursive: true, force: true }).catch(() => {});
}