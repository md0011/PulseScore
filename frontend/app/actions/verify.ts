'use server';

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { TelegramUser } from 'telegram-login-button';

// Load the private key from private_key.pem
const privateKeyPath = path.join(process.cwd(), 'private_key.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Telegram bot token for verifying the hash
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your-telegram-bot-token';

const verifyTelegramUser = (user: TelegramUser): boolean => {
  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const dataCheckString = Object.keys(user)
    .filter((key) => key !== 'hash')
    .map((key) => `${key}=${user[key as keyof TelegramUser]}`)
    .sort()
    .join('\n');

  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return hash === user.hash;
};

const issueJwt = (user: TelegramUser): string => {
  return jwt.sign({ sub: user.id.toString(), "aud": "user:frontend" }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '1h',
  });
};

export const verifyAndIssueJwt = (user: TelegramUser): string | null => {
  // Verify the Telegram user
  if (!verifyTelegramUser(user)) {
    return null;
  }

  // Issue and return JWT
  return issueJwt(user);
};
