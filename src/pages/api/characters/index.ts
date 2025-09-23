// src/pages/api/characters/index.ts
// API endpoint for fetching lightweight character index items
import type { NextApiRequest, NextApiResponse } from 'next';

const characters = [
  // Example data; replace with DB or file source
  { id: 'pc1', kind: 'PC', name: 'Aria', defense: 18, tier: 2, updatedAt: '2025-09-20T12:00:00Z' },
  { id: 'npc1', kind: 'NPC', name: 'Victor Oldham', defense: 22, tier: 4, updatedAt: '2025-09-19T10:00:00Z' },
  { id: 'npc2', kind: 'NPC', name: 'Sir Reynard', defense: 19, tier: 3, updatedAt: '2025-09-19T11:00:00Z' },
  { id: 'pc2', kind: 'PC', name: 'Jax', defense: 16, tier: 1, updatedAt: '2025-09-18T09:00:00Z' },
  { id: 'pc3', kind: 'PC', name: 'Mira', defense: 20, tier: 2, updatedAt: '2025-09-18T09:30:00Z' },
  { id: 'npc3', kind: 'NPC', name: 'Thaddeus', defense: 15, tier: 1, updatedAt: '2025-09-17T08:00:00Z' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ids } = req.query;
  if (ids) {
    const idArr = Array.isArray(ids) ? ids : ids.split(',');
    res.status(200).json(characters.filter(c => idArr.includes(c.id)));
  } else {
    res.status(200).json(characters);
  }
}
