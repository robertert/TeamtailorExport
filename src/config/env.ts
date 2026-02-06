import dotenv from 'dotenv';

dotenv.config();

if (!process.env.TEAMTAILOR_API_KEY) {
  throw new Error('TEAMTAILOR_API_KEY is not set');
}

export const config = {
  TEAMTAILOR_API_KEY: process.env.TEAMTAILOR_API_KEY,
};