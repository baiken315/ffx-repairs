import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { config } from '../config';

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const base64 = authHeader.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) {
    res.status(401).json({ error: 'Invalid credentials format' });
    return;
  }

  const username = decoded.slice(0, colonIdx);
  const password = decoded.slice(colonIdx + 1);

  if (username !== config.adminUsername) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!config.adminPasswordHash) {
    // Dev mode: accept any password if hash not set
    if (config.nodeEnv === 'development') {
      next();
      return;
    }
    res.status(500).json({ error: 'Admin auth not configured' });
    return;
  }

  const valid = await bcrypt.compare(password, config.adminPasswordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  next();
}
