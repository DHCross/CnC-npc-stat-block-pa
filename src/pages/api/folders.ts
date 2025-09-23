// src/pages/api/folders.ts
// API endpoint for fetching Adventure and Roster folders
import type { NextApiRequest, NextApiResponse } from 'next';

const folders = [
  // Example data; replace with DB or file source
  { id: 'adv1', kind: 'Adventure', name: 'The Sapphire Heist', memberIds: ['npc1','npc2','pc1'] },
  { id: 'roster1', kind: 'Roster', name: 'Main Roster', memberIds: ['pc2','pc3','npc3'] },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { kind } = req.query;
  if (kind && (kind === 'Adventure' || kind === 'Roster')) {
    res.status(200).json(folders.filter(f => f.kind === kind));
  } else {
    res.status(200).json(folders);
  }
}
