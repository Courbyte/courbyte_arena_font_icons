import { createClient } from '@supabase/supabase-js';
import svgtofont from 'svgtofont';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const KIT_ICONS = ['star', 'trash', 'user', 'settings', 'search'];

const OUTPUT_DIR = path.resolve('./dist-kit');
const TEMP_ICONS_DIR = path.resolve('./temp-icons');

async function buildKit() {
  console.log('Fetching icons from Supabase...');
  const { data: iconRows, error } = await supabase
    .from('icons')
    .select('name, svg, source_repo')
    .in('name', KIT_ICONS);

  if (error) {
    console.error('Database query failed:', error);
    return;
  }

  console.log(`Query returned ${iconRows.length} rows.`);
  if (!iconRows.length) {
    console.error('No icons found.');
    return;
  }

  // Write unique SVGs (use source_repo as suffix if needed to avoid overwrites)
  await fs.mkdir(TEMP_ICONS_DIR, { recursive: true });
  const written = new Set();
  for (const icon of iconRows) {
    if (!icon.svg || icon.svg.trim() === '') continue;
    // Ensure unique file name: e.g., feather_star.svg, lucide_star.svg
    const fileName = `${icon.source_repo}_${icon.name}.svg`;
    const filePath = path.join(TEMP_ICONS_DIR, fileName);
    await fs.writeFile(filePath, icon.svg);
    written.add(icon.name);
  }
  console.log(`Wrote ${written.size} unique icons to temp-icons.`);

  // Generate font with svgtofont
  console.log('Generating font...');
  await svgtofont({
    src: TEMP_ICONS_DIR,           // input folder
    dist: OUTPUT_DIR,              // output folder
    fontName: 'ca-icons',          // font name
    css: true,                     // generate CSS file
    outSVGReact: false,
    outSVGPath: false,
    startUnicode: 0xea01,          // starting codepoint
    classNamePrefix: 'ca',         // css class prefix
    prefix: 'ca',                  // icon class prefix
    svgicons2svgfont: {
      fontHeight: 1000,
      normalize: true,
    },
    // Generates woff2, woff, ttf, eot, svg
    emptyDist: true,               // clear dist folder before generating
  });

  // Cleanup temp files
  await fs.rm(TEMP_ICONS_DIR, { recursive: true, force: true });

  console.log(`✅ Kit built! Check the folder: ${OUTPUT_DIR}`);
  console.log(`   CSS file: ${path.join(OUTPUT_DIR, 'ca-icons.css')}`);
}

buildKit().catch(console.error);
