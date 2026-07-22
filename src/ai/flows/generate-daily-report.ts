'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating daily operational reports.
 *
 * - generateDailyReport - A function that generates a daily operational report.
 * - GenerateDailyReportInput - The input type for the generateDailyReport function.
 * - GenerateDailyReportOutput - The return type for the generateDailyReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyReportInputSchema = z.object({
  date: z
    .string()
    .describe('The date for which to generate the report (YYYY-MM-DD).'),
  activities: z.string().describe('A summary of activities for the day.'),
  attendanceSummary: z
    .string()
    .describe('A summary of employee attendance for the day.'),
  guestAndSecuritySummary: z
    .string()
    .describe('A summary of guests, security logs, gate pass, and item storage (penitipan) for the day.'),
  leaveAndOvertimeSummary: z
    .string()
    .describe('A summary of leave permits and overtime for the day.'),
});
export type GenerateDailyReportInput = z.infer<typeof GenerateDailyReportInputSchema>;

const GenerateDailyReportOutputSchema = z.object({
  report: z.string().describe('The generated daily operational report.'),
});
export type GenerateDailyReportOutput = z.infer<typeof GenerateDailyReportOutputSchema>;

export async function generateDailyReport(
  input: GenerateDailyReportInput
): Promise<GenerateDailyReportOutput> {
  return generateDailyReportFlow(input);
}

const generateDailyReportPrompt = ai.definePrompt({
  name: 'generateDailyReportPrompt',
  input: {schema: GenerateDailyReportInputSchema},
  output: {schema: GenerateDailyReportOutputSchema},
  prompt: `You are an AI assistant tasked with generating a daily operational report.

  Date: {{{date}}}
  Activities Summary: {{{activities}}}
  Attendance Summary: {{{attendanceSummary}}}
  Guest & Security Summary: {{{guestAndSecuritySummary}}}
  Leave & Overtime Summary: {{{leaveAndOvertimeSummary}}}

  Based on the provided summaries of activities, attendance, guest/security logs, and leave/overtime data,
  generate a comprehensive daily operational report. Highlight any salient points
  and ensure that no important information is overlooked.
  The report should be well-structured and easy to read.
  Follow general guidelines for writing operational report.
  Do not include any greetings or salutations.
  `,
});

const generateDailyReportFlow = ai.defineFlow(
  {
    name: 'generateDailyReportFlow',
    inputSchema: GenerateDailyReportInputSchema,
    outputSchema: GenerateDailyReportOutputSchema,
  },
  async input => {
    const {output} = await generateDailyReportPrompt(input);
    return output!;
  }
);
