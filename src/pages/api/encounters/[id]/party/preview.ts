// src/pages/api/encounters/[id]/party/preview.ts
// API endpoint for previewing merged, deduped party selection and totals
import type { NextApiRequest, NextApiResponse } from 'next';

// Example data sources (replace with DB or file source)
import folders from '../../folders';
import characters from '../../characters/index';

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { wholeFolders = [], members = [], excluded = [] } = req.body;

  // Gather all member IDs from selected folders
  const folderMembers = uniq(
    wholeFolders.flatMap((fid: string) => {
      const folder = folders.find((f: any) => f.id === fid);
      return folder ? folder.memberIds : [];
    })
  );
  let picks = uniq([...folderMembers, ...members]).filter((id: string) => !excluded.includes(id));

  // Fetch character records
  const merged = characters.filter((c: any) => picks.includes(c.id));

  const headcount = merged.length;
  const sumDefense = merged.reduce((a: number, b: any) => a + (b.defense ?? 0), 0);
  const avgDefense = headcount ? +(sumDefense / headcount).toFixed(1) : 0;
  const avgTier = headcount ? +(merged.reduce((a: number, b: any) => a + b.tier, 0) / headcount).toFixed(1) : 0;
  const sumThreat = merged.reduce((a: number, b: any) => a + (b.threat ?? 0), 0);

  res.status(200).json({ merged, dedupedCount: picks.length - merged.length, totals: { headcount, sumDefense, avgDefense, avgTier, sumThreat } });
}
