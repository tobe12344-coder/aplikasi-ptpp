import { config } from 'dotenv';
config();

import '@/ai/flows/generate-daily-report.ts';
import '@/ai/flows/update-user.ts';
import '@/ai/flows/create-user.ts';
