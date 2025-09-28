// src/pages/api/encounters/[id]/party/preview.ts
// API endpoint for previewing merged, deduped party selection and totals
import type { NextApiRequest, NextApiResponse } from 'next';

// Example data sources (replace with DB or file source)
// Note: Since the actual API endpoints export handlers, we'll use mock data here
const folders = [
  { id: 'adv1', kind: 'Adventure', name: 'The Sapphire Heist', memberIds: ['npc1','npc2','pc1'] },
  { id: 'roster1', kind: 'Roster', name: 'Main Roster', memberIds: ['pc2','pc3','npc3'] },
];

const characters = [
  { id: 'pc1', kind: 'PC', name: 'Aria', defense: 18, tier: 2, threat: 0, updatedAt: '2025-09-20T12:00:00Z' },
  { id: 'npc1', kind: 'NPC', name: 'Victor Oldham', defense: 22, tier: 4, threat: 5, updatedAt: '2025-09-19T10:00:00Z' },
  { id: 'npc2', kind: 'NPC', name: 'Sir Reynard', defense: 19, tier: 3, threat: 3, updatedAt: '2025-09-19T11:00:00Z' },
  { id: 'pc2', kind: 'PC', name: 'Jax', defense: 16, tier: 1, threat: 0, updatedAt: '2025-09-18T09:00:00Z' },
  { id: 'pc3', kind: 'PC', name: 'Mira', defense: 20, tier: 2, threat: 0, updatedAt: '2025-09-18T09:30:00Z' },
  { id: 'npc3', kind: 'NPC', name: 'Thaddeus', defense: 15, tier: 1, threat: 2, updatedAt: '2025-09-17T08:00:00Z' },
];

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
  const picks = uniq([...folderMembers, ...members]).filter((id: string) => !excluded.includes(id));

  // Fetch character records
  const merged = characters.filter((c: any) => picks.includes(c.id));

  const headcount = merged.length;
  const sumDefense = merged.reduce((a: number, b: any) => a + (b.defense ?? 0), 0);
  const avgDefense = headcount ? +(sumDefense / headcount).toFixed(1) : 0;
  const avgTier = headcount ? +(merged.reduce((a: number, b: any) => a + b.tier, 0) / headcount).toFixed(1) : 0;
  const sumThreat = merged.reduce((a: number, b: any) => a + (b.threat ?? 0), 0);

  res.status(200).json({ merged, dedupedCount: picks.length - merged.length, totals: { headcount, sumDefense, avgDefense, avgTier, sumThreat } });
}
