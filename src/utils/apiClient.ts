import axios from 'axios';
import { config } from '../config/env';

const baseURL = 'https://api.teamtailor.com/v1';

export const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    Authorization: `Token token=${config.TEAMTAILOR_API_KEY}`,
    'X-Api-Version': '20240404',
  },
});
