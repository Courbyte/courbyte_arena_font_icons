import { createClient } from '@supabase/supabase-js';
import { optimize } from 'svgo';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REPOS = [
  {
    name: 'feather',
    owner: 'feathericons',
    repo: 'feather',
    folder: 'icons',
  },
  {
    name: 'lucide',
    owner: 'lucide-icons',
    repo: 'lucide',
    folder: 'icons',
  },
  {
    name: 'heroicons-outline',
    owner: 'tailwindlabs',
    repo: 'heroicons',
    folder: 'optimized/24/outline',
  },
  {
    name: 'tabler',
    owner: 'tabler',
    repo: 'tabler-icons',
    folder: 'icons',
  },
  {
    name: 'phosphor-regular',   // 1,000+ icons
    owner: 'phosphor-icons',
    repo: 'core',
    folder: 'assets/regular',
  },
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch ALL files from a GitHub directory (handles pagination)
async function fetchAllFiles(apiUrl, headers) {
  let allFiles = [];
  let url = apiUrl + '?per_page=100'; // max per page
  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`  ❌ Failed to list files: ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('  ❌ Unexpected response (maybe a single file)');
      return [];
    }
    allFiles = allFiles.concat(data);

    // Check for next page in the Link header
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      url = nextMatch ? nextMatch[1] : null;
    } else {
      url = null;
    }
  }
  return allFiles;
}

async function fetchRepoIcons({ name, owner, repo, folder }) {
  console.log(`\n📦 Processing ${name} (${owner}/${repo})...`);

  const headers = { 'User-Agent': 'node.js' };
  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  const listUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;
  const files = await fetchAllFiles(listUrl, headers);

  if (!files.length) {
    console.error(`  ❌ No files found in folder.`);
    return { success: 0, fail: 0 };
  }

  const svgFiles = files.filter(f => f.name.endsWith('.svg'));
  console.log(`  Found ${svgFiles.length} SVG files.`);

  let success = 0;
  let fail = 0;

  for (const file of svgFiles) {
    try {
      const downloadRes = await fetch(file.download_url, { headers });
      if (!downloadRes.ok) {
        console.error(`  ⚠️ ${file.name}: download failed (${downloadRes.status})`);
        fail++;
        await delay(200);
        continue;
      }

      const svgContent = await downloadRes.text();

      if (!svgContent.trim().startsWith('<svg')) {
        console.error(`  ⚠️ ${file.name}: content is not SVG, skipping`);
        fail++;
        await delay(200);
        continue;
      }

      const optimized = optimize(svgContent, {
        plugins: [
          'removeDimensions',
          'removeComments',
          'removeMetadata',
          'cleanupAttrs',
          'convertStyleToAttrs',
          'minifyStyles',
          'removeEmptyContainers',
          'removeUnusedNS',
          'sortAttrs',
        ],
      });
      const cleanSvg = optimized.data;
      const iconName = file.name.replace('.svg', '');

      const { error } = await supabase
        .from('icons')
        .upsert(
          { name: iconName, source_repo: name, svg: cleanSvg },
          { onConflict: 'source_repo, name' }
        );

      if (error) {
        console.error(`  ❌ ${iconName}: ${error.message}`);
        fail++;
      } else {
        console.log(`  ✔ ${iconName}`);
        success++;
      }
    } catch (err) {
      console.error(`  ❌ ${file.name}: unexpected error - ${err.message}`);
      fail++;
    }

    await delay(200);
  }

  return { success, fail };
}

async function main() {
  let totalSuccess = 0;
  let totalFail = 0;

  for (const repo of REPOS) {
    const { success, fail } = await fetchRepoIcons(repo);
    totalSuccess += success;
    totalFail += fail;
  }

  console.log(`\n🎉 All done! Total imported: ${totalSuccess}, Failed: ${totalFail}`);
}

main().catch(console.error);