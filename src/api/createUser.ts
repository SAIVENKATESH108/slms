import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserWithRole } from '../firebase/addUsers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { email, phone, password, name, role } = req.body;

  if (!email || !phone || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userRecord = await createUserWithRole(email, phone, password, name, role);
    return res.status(201).json({ uid: userRecord.uid, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}
