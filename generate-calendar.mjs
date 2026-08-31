import fs from 'node:fs/promises';

const USERNAME = process.env.GITHUB_USERNAME || 'mhmadrezapahlevi';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  throw new Error('GITHUB_TOKEN is required');
}

const query = `
query($login:String!) {
  user(login:$login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        colors
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
            color
          }
        }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'mhmadrezapahlevi-contribution-calendar'
  },
  body: JSON.stringify({ query, variables: { login: USERNAME } })
});

if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}: ${await res.text()}`);
const payload = await res.json();
if (payload.errors?.length) throw new Error(payload.errors.map(e => e.message).join('; '));

const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) throw new Error(`GitHub user not found or contribution calendar unavailable: ${USERNAME}`);

const weeks = calendar.weeks;
const total = calendar.totalContributions;
const cell = 11;
const gap = 3;
const step = cell + gap;
const left = 34;
const top = 40;
const weekCount = weeks.length;
const width = left + weekCount * step + 18;
const height = 142;

const months = [];
let lastMonth = '';
for (let i = 0; i < weeks.length; i++) {
  const first = weeks[i].contributionDays[0];
  if (!first) continue;
  const d = new Date(`${first.date}T00:00:00Z`);
  const label = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
  if (key !== lastMonth) {
    months.push({ x: left + i * step, label });
    lastMonth = key;
  }
}

const svgEsc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`;
svg += `<title id="title">GitHub contribution calendar for ${svgEsc(USERNAME)}</title>`;
svg += `<desc id="desc">${total} contributions in the last year.</desc>`;
svg += `<rect width="100%" height="100%" rx="14" fill="#0d1117"/>`;
svg += `<text x="${left}" y="18" fill="#f0f6fc" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="14" font-weight="700">${svgEsc(USERNAME)} · ${total} contributions</text>`;

for (const m of months) {
  svg += `<text x="${m.x}" y="32" fill="#8b949e" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="9">${svgEsc(m.label)}</text>`;
}

const dayLabels = [
  { row: 1, label: 'Mon' },
  { row: 3, label: 'Wed' },
  { row: 5, label: 'Fri' }
];
for (const d of dayLabels) {
  svg += `<text x="4" y="${top + d.row * step + 8}" fill="#8b949e" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="9">${d.label}</text>`;
}

for (let w = 0; w < weeks.length; w++) {
  for (const day of weeks[w].contributionDays) {
    const x = left + w * step;
    const y = top + day.weekday * step;
    const color = /^#[0-9a-fA-F]{6}$/.test(day.color) ? day.color : '#161b22';
    const label = `${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'} on ${day.date}`;
    svg += `<title>${svgEsc(label)}</title>`;
    svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5" fill="${color}"/>`;
  }
}

const legendY = height - 18;
svg += `<text x="${left}" y="${legendY + 3}" fill="#8b949e" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="8">Less</text>`;
const colors = calendar.colors;
for (let i = 0; i < colors.length; i++) {
  const x = left + 28 + i * 15;
  svg += `<rect x="${x}" y="${legendY - 7}" width="10" height="10" rx="2" fill="${colors[i]}"/>`;
}
svg += `<text x="${left + 28 + colors.length * 15 + 4}" y="${legendY + 3}" fill="#8b949e" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="8">More</text>`;
svg += `<text x="${width - 18}" y="${legendY + 3}" text-anchor="end" fill="#8b949e" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="8">github.com/${svgEsc(USERNAME)}</text>`;
svg += `</svg>`;

await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/github-contribution-calendar.svg', svg, 'utf8');
console.log(`Generated ${total} contributions for ${USERNAME}`);
