import { get } from 'https';
import { URL } from 'url';

export interface MenuItem {
  name: string;
  description: string;
  price: string;
}

function fetchCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    get(new URL(url), (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSVByIndex(csv: string): any[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  // Skip the header row
  return lines.slice(1).map(line => {
    // Simple CSV split (doesn't handle quoted commas)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return {
      name: values[0] || '',
      price: values[1] || '',
      description: values[2] || '',
    };
  });
}

export async function getMenu(sheetId: string): Promise<{
  plates: MenuItem[];
  sandwiches: MenuItem[];
  salads: MenuItem[];
  sides: MenuItem[];
}> {
  const subsheets = ['plates', 'sandwiches', 'salads', 'sides', 'drinks'];
  const urls = subsheets.map(
    sheetName =>
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
  );

  // Fetch all CSVs in parallel
  const csvResults = await Promise.all(
    urls.map(url =>
      fetchCSV(url).catch(() => null) // Ignore errors for missing sheets
    )
  );

  const result: { [key: string]: MenuItem[] } = {
    plates: [],
    sandwiches: [],
    salads: [],
    sides: [],
  };

  for (let i = 0; i < subsheets.length; i++) {
    const sheet = subsheets[i];
    if (!result.hasOwnProperty(sheet)) continue; // skip 'drinks'
    const csv = csvResults[i];
    if (!csv) continue;
    const records = parseCSVByIndex(csv);
    for (const row of records) {
      result[sheet].push({
        name: row.name,
        description: row.description,
        price: Number.isNaN(parseFloat((row.price || '0').replace(/[^0-9.]/g, '')))
          ? ''
          : parseFloat((row.price || '0').replace(/[^0-9.]/g, '')).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            }),
      });
    }
  }

  return {
    plates: result.plates,
    sandwiches: result.sandwiches,
    salads: result.salads,
    sides: result.sides,
  };
}

let cachedReturn: any = null;
let cacheTimestamp = 0;
export async function withCache(foo: any, duration = 5 * 60 * 1000) {
  const now = Date.now();
  if (cachedReturn && now - cacheTimestamp < duration) {
    return cachedReturn;
  }

  cachedReturn = foo()

  // After fetching:
  cacheTimestamp = now;
  return cachedReturn;
}
