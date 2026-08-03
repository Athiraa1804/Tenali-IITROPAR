#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * update-readme-contributors.js
 *
 * Regenerates the contributor section of README.md from:
 *   1. The GitHub Contributors API   → profile photos, real names, GitHub IDs
 *   2. Local git log                 → commit counts (always accurate even when API lags)
 *   3. Merge-commit scan             → merged PR numbers
 *
 * Marker block in README.md:
 *   <!-- live-rank:start --> ... <!-- live-rank:end -->
 *   <!-- live-cards:start --> ... <!-- live-cards:end -->
 *
 * The script is idempotent — running it twice produces the same file.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_... node scripts/update-readme-contributors.js
 *   node scripts/update-readme-contributors.js --dry-run
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Canonical upstream — the README bot pulls contributor data from here
const REPO = process.env.TENALI_REPO || 'vicharanashala/tenali';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const README = path.resolve(PROJECT_ROOT, 'README.md');
const DRY_RUN = process.argv.includes('--dry-run');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

// ─── helpers ────────────────────────────────────────────────────────────────

function log(...args) { console.log('[readme-bot]', ...args); }

function sh(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: PROJECT_ROOT,
    }).trim();
  } catch (_e) {
    return '';
  }
}

function ghFetch(urlPath) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'tenali-readme-bot',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else if (res.statusCode === 403 || res.statusCode === 429) {
          // Rate limit — fall back to local data
          log(`⚠ rate-limited (${res.statusCode}) on ${urlPath} — falling back`);
          resolve(null);
        } else {
          reject(new Error(`GitHub API ${res.statusCode} ${res.statusCodeText || ''} for ${urlPath}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function ghFetchAll(urlPath, acc = []) {
  const page = await ghFetch(urlPath);
  if (!page) return acc;
  const next = Array.isArray(page) ? acc.concat(page) : acc.concat([page]);
  // Link header is not exposed here; fetch paginated pages by ?per_page=100 then loop with page=#
  return next;
}

// ─── data gathering ─────────────────────────────────────────────────────────

function gatherGitLog() {
  const total = parseInt(sh(`git log --pretty=format:"%H" | wc -l`), 10) || 0;
  const authorCount = parseInt(
    sh(`git log --pretty=format:"%ae" | sort -u | wc -l`), 10) || 0;

  // Commits per author (by name as it appears in git log)
  const byAuthor = {};
  sh(`git log --pretty=format:"%an|%ae"`).split('\n').forEach((line) => {
    if (!line) return;
    const [name, email] = line.split('|');
    byAuthor[name] = (byAuthor[name] || 0) + 1;
  });

  // PRs per author (parsed from "Merge pull request #N from <user>/<branch>")
  const prsByAuthor = {};
  const allPRs = new Set();
  sh(`git log --merges --pretty=format:"%s"`).split('\n').forEach((msg) => {
    const m = msg.match(/Merge pull request #(\d+) from ([^/]+)\//);
    if (!m) return;
    const [, num, user] = m;
    allPRs.add(num);
    prsByAuthor[user] = prsByAuthor[user] || new Set();
    prsByAuthor[user].add(num);
  });

  return {
    totalCommits: total,
    uniqueAuthors: authorCount,
    commitsByName: byAuthor,
    prsByUser: Object.fromEntries(
      Object.entries(prsByAuthor).map(([k, v]) => [k, v.size])
    ),
    totalPRs: allPRs.size,
    allPRNumbers: [...allPRs].sort((a, b) => +a - +b),
  };
}

async function fetchContributors() {
  log('Fetching contributors from GitHub API…');
  const contributors = [];
  for (let page = 1; page <= 5; page++) {
    const list = await ghFetch(
      `/repos/${REPO}/contributors?per_page=100&page=${page}&anon=false`
    );
    if (!list || !Array.isArray(list) || list.length === 0) break;
    for (const c of list) {
      contributors.push({
        login: c.login,
        avatar: c.avatar_url,
        contributions: c.contributions,
        html_url: c.html_url,
      });
    }
    if (list.length < 100) break;
  }

  // Enrich with real name + bio + location via /users/{login}
  const enriched = await Promise.all(
    contributors.map(async (c) => {
      const profile = await ghFetch(`/users/${c.login}`);
      return {
        ...c,
        name: profile?.name || c.login,
        bio: profile?.bio || '',
        location: profile?.location || '',
        blog: profile?.blog || '',
        twitter: profile?.twitter_username || '',
        followers: profile?.followers || 0,
        public_repos: profile?.public_repos || 0,
      };
    })
  );
  return enriched;
}

// Manual fallback profile data — used when GitHub API is rate-limited.
// Keys are GitHub logins as they appear in `git log` and the contributor graph.
const FALLBACK_PROFILES = {
  sudarshansudarshan: {
    name: 'S. R. S. Iyengar',
    git: 'Sudarshan',
    avatar: 'https://avatars.githubusercontent.com/u/12417057?v=4',
    location: 'Rupnagar, Punjab',
    bio: 'Scientist/Teacher',
    blog: 'http://www.sudarshaniyengar.com',
    color: '#FFD93D',
    role: 'Lead Architect & Curriculum Author',
  },
  muditagrawal2007: {
    name: 'Mudit Agrawal',
    avatar: 'https://avatars.githubusercontent.com/u/228782706?v=4',
    color: '#C0C0C0',
    role: 'Repo Owner · Battle Arena · Linear Algebra',
  },
  'varshini-nandula': {
    name: 'Lakshmi Varshini Nandula',
    avatar: 'https://avatars.githubusercontent.com/u/174730796?v=4',
    color: '#CD7F32',
    role: 'Profile Showcase & Offline Storage',
  },
  'jgupta05072003-code': {
    name: 'J. Gupta',
    avatar: 'https://avatars.githubusercontent.com/u/267273120?v=4',
    color: '#4D96FF',
    role: 'Upstream Repo Maintainer & PR Reviewer',
    note: 'merged 30+ PRs',
  },
  '24F3005086': {
    name: 'Sameer Mishra',
    avatar: 'https://avatars.githubusercontent.com/u/189242179?v=4',
    color: '#6BCB77',
    role: 'i18n · Accessibility · Concept Labs',
  },
  'Vaibhav-sa30': {
    name: 'Vaibhav Satish',
    avatar: 'https://avatars.githubusercontent.com/u/86743451?v=4',
    color: '#FF6B6B',
    location: 'India',
    twitter: 'vee42O',
    role: 'Vachana Literacy Lab & Vocabulary',
  },
  'diptosubhro-ctrl': {
    name: 'Diptosubhro Datta',
    avatar: 'https://avatars.githubusercontent.com/u/248255769?v=4',
    color: '#9B59B6',
    location: 'COOCH BEHAR',
    role: 'Tutorial System + Noise Filter Refactor',
  },
  'Ritish007-svg': {
    name: 'Ritish Karmakar',
    avatar: 'https://avatars.githubusercontent.com/u/214147769?v=4',
    color: '#E67E22',
    role: 'Percentages Level-wise Explanation',
  },
  KCDharshan9: {
    name: 'K C Dharshan',
    avatar: 'https://avatars.githubusercontent.com/u/196636372?v=4',
    color: '#1ABC9C',
    location: 'India',
    role: 'Tap-to-Define Word Glossary',
  },
  ahana4banerjee: {
    name: 'Ahana Banerjee',
    avatar: 'https://avatars.githubusercontent.com/u/166562662?v=4',
    color: '#E91E63',
    location: 'Hyderabad, India',
    role: 'Goal Practice & Learning Journey',
  },
  Shubhdix9: {
    name: 'Shubh Dixit',
    avatar: 'https://avatars.githubusercontent.com/u/212879841?v=4',
    color: '#34495E',
    location: 'Jaipur',
    role: 'Premium UI Suite + Word Games',
  },
  'sharonyamita-spec': {
    name: 'Sharonya Banerjee',
    git: 'Sharonya Banerjee',
    avatar: 'https://avatars.githubusercontent.com/u/261205962?v=4',
    color: '#16A085',
    note: 'SemiColonSlayer',
    role: 'Math Detective Agency',
  },
  poorvipravallika06: {
    name: 'Pandraju Poorvi Pravallika',
    avatar: 'https://avatars.githubusercontent.com/u/207549779?v=4',
    color: '#F39C12',
    role: 'HCF/LCM Interactive Module',
  },
  RukmenderT: {
    name: 'Rukmender T',
    avatar: 'https://avatars.githubusercontent.com/u/206398340?v=4',
    color: '#8E44AD',
    role: 'Curiosity Mode',
  },
  'KrishnaG-101': {
    name: 'Krishna Gelra',
    avatar: 'https://avatars.githubusercontent.com/u/155518412?v=4',
    color: '#27AE60',
    role: 'Language Puzzles Framework',
  },
  'S-Hamsalekha-annamai': {
    name: 'S. Hamsalekha',
    avatar: 'https://avatars.githubusercontent.com/u/247533500?v=4',
    color: '#2C3E50',
    role: 'Track User Progress',
  },
  AnshulKanodia: {
    name: 'Anshul Kanodia',
    avatar: 'https://avatars.githubusercontent.com/u/113899062?v=4',
    color: '#7F8C8D',
    blog: 'https://anshulkanodia.vercel.app',
    role: 'Geometry Game Restoration',
  },
};

// Map git-log author-name → GitHub login so we can join local commits to GH profiles.
const GIT_NAME_TO_LOGIN = {
  Sudarshan: 'sudarshansudarshan',
  'S. R. S. Iyengar': 'sudarshansudarshan',
  muditagrawal2007: 'muditagrawal2007',
  'varshini-nandula': 'varshini-nandula',
  'jgupta05072003-code': 'jgupta05072003-code',
  Jinal: 'jgupta05072003-code', // Jinal Gupta's auth-hardening PRs merged by jgupta05072003-code
  'Jinal Gupta': 'jgupta05072003-code',
  '24F3005086': '24F3005086',
  Vaibhav: 'Vaibhav-sa30',
  'Dipto Subhro': 'diptosubhro-ctrl',
  'Ritish Karmakar': 'Ritish007-svg',
  Ritish: 'Ritish007-svg',
  'K C Dharshan': 'KCDharshan9',
  KCDharshan9: 'KCDharshan9',
  'Ahana Banerjee': 'ahana4banerjee',
  'Sharonya Banerjee': 'sharonyamita-spec',
  Sharonya: 'sharonyamita-spec',
  poorvipravallika06: 'poorvipravallika06',
  Poorvipravallika: 'poorvipravallika06',
  RukmenderT: 'RukmenderT',
  'Krishna Gelra': 'KrishnaG-101',
  'Krishna': 'KrishnaG-101',
  'S Hamsalekha': 'S-Hamsalekha-annamai',
  'S-Hamsalekha-annamai': 'S-Hamsalekha-annamai',
  Hamsalekha: 'S-Hamsalekha-annamai',
  'Anshul Kanodia': 'AnshulKanodia',
  AnshulKanodia: 'AnshulKanodia',
  'Shubh dixit': 'Shubhdix9',
  Shubh: 'Shubhdix9',
};

// ─── rendering ──────────────────────────────────────────────────────────────

function mergeData(git, apiContribs) {
  // Join git commits by author name → login → API profile (or fallback)
  const byLogin = {};
  for (const [gitName, count] of Object.entries(git.commitsByName)) {
    const login = GIT_NAME_TO_LOGIN[gitName];
    if (!login) continue; // skip emails that don't map (e.g. Vasuki)
    byLogin[login] = byLogin[login] || { login, gitNames: [], commits: 0 };
    byLogin[login].gitNames.push(gitName);
    byLogin[login].commits += count;
  }

  // PR counts: keyed by github login (source branch prefix)
  const prsByLogin = git.prsByUser; // already keyed by login

  // Merge API profile data
  for (const login of Object.keys(byLogin)) {
    const api = apiContribs.find((c) => c.login === login);
    const fb = FALLBACK_PROFILES[login] || {};
    byLogin[login] = {
      ...byLogin[login],
      ...fb,
      ...(api || {}),
      // PR count: prefer local git truth, fall back to API
      prs: prsByLogin[login] || 0,
    };
  }

  // Sort by commits desc
  return Object.values(byLogin).sort((a, b) => b.commits - a.commits);
}

function renderLeaderboard(rows, totals) {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = [];
  lines.push('| # | 👤 Real Name | 🔗 GitHub ID | 📝 Commits | 🔀 PRs | 🏷️ Top Features |');
  lines.push('|--:|:-------------|:-------------|----------:|-----:|:----------------|');
  rows.forEach((r, idx) => {
    const medal = medals[idx] || `${idx + 1}.`;
    const displayName = r.name && r.name !== r.login
      ? `**${r.name}**${r.git && r.git !== r.name ? ` *(${r.git})*` : ''}`
      : `**${r.login}**`;
    const ghLink = `[${r.login}](https://github.com/${r.login})`;
    const features = r.role || '—';
    lines.push(
      `| ${medal} | ${displayName} | ${ghLink} | **${r.commits}** | ${r.prs}  | ${features} |`
    );
  });
  return lines.join('\n');
}

function renderSnapshot(totals) {
  return [
    '| 🏆 Commits | 🔀 Merged PRs | 👥 Contributors | 🧩 Puzzles | 📚 Vocab | 🌍 GK |',
    '|----------:|------------:|--------------:|---------:|-------:|----:|',
    `| **${totals.totalCommits}** | **${totals.totalPRs}** | **${Object.keys(totals.byLogin || {}).length || 16}** | **69** | **7,662** | **991** |`,
  ].join('\n');
}

// ─── README mutation ────────────────────────────────────────────────────────

function replaceMarkerBlock(readme, startMarker, endMarker, newContent) {
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);
  if (start === -1 || end === -1) {
    throw new Error(`Markers not found: ${startMarker} / ${endMarker}`);
  }
  return (
    readme.slice(0, start + startMarker.length) +
    '\n' + newContent + '\n' +
    readme.slice(end)
  );
}

function updateAtAGlance(readme, totals) {
  // Replace the inline "## 📊 At a Glance" stat numbers (uses simple regex anchors)
  const commits = String(totals.totalCommits);
  const prs = String(totals.totalPRs);
  return readme
    .replace(/<b>43<\/b><br\/><sub>merged PRs<\/sub>/, `<b>${prs}</b><br/><sub>merged PRs</sub>`)
    .replace(/<b>711<\/b><br\/><sub>total commits<\/sub>/, `<b>${commits}</b><br/><sub>total commits</sub>`);
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  log('Gathering git data…');
  const git = gatherGitLog();
  log(`  → ${git.totalCommits} commits · ${git.totalPRs} merged PRs · ${git.uniqueAuthors} unique authors`);

  let apiContribs = [];
  try {
    apiContribs = await fetchContributors();
    log(`  → ${apiContribs.length} GitHub contributors with profile data`);
  } catch (e) {
    log('⚠ API fetch failed entirely, using fallback profiles only:', e.message);
  }

  const rows = mergeData(git, apiContribs);

  // Banner line for the leaderboard caption
  const banner = rows.length > 0
    ? `_Live data — last regenerated ${new Date().toISOString().split('T')[0]} · auto-refreshed by [\`github-actions[bot]\`](https://github.com/features/actions) on every push to \`main\`._`
    : '';

  const leaderboard = banner + '\n\n' + renderLeaderboard(rows, git);
  const snapshot = renderSnapshot({ ...git, byLogin: Object.fromEntries(rows.map(r => [r.login, r])) });

  let readme = fs.readFileSync(README, 'utf8');

  readme = replaceMarkerBlock(readme, '<!-- live-rank:start -->', '<!-- live-rank:end -->', leaderboard);
  readme = replaceMarkerBlock(readme, '<!-- live-snapshot:start -->', '<!-- live-snapshot:end -->', snapshot);
  readme = updateAtAGlance(readme, git);

  if (DRY_RUN) {
    log('--dry-run — not writing file. Diff would be:');
    console.log('─'.repeat(60));
    console.log(readme.split('<!-- live-rank:start -->')[1]?.split('<!-- live-rank:end -->')[0] || '');
    console.log('─'.repeat(60));
    return;
  }

  fs.writeFileSync(README, readme);
  log(`✅ ${path.relative(process.cwd(), README)} updated (${rows.length} contributors rendered)`);
}

main().catch((e) => {
  console.error('[readme-bot] ❌', e.message);
  process.exit(1);
});