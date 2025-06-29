'use server';

/**
 * @fileOverview A flow for sending an email and logging it to Firestore.
 * - sendEmail - Sends an email using Nodemailer (SMTP) and logs the action.
 * - SendEmailInput - The input type for the sendEmail function.
 * - SendEmailOutput - The return type for the sendEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SendEmailInputSchema = z.object({
  recipientEmail: z.string().email().describe('The email address of the recipient.'),
  subject: z.string().describe('The subject line of the email.'),
  htmlContent: z.string().describe('The HTML content of the email body.'),
  userId: z.string().describe('The UID of the user sending the email.'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

const SendEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A message indicating the result of the send operation.'),
  logId: z.string().optional().describe('The ID of the log document in Firestore.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async ({ recipientEmail, subject, htmlContent, userId }) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      const errorMessage = 'SMTP configuration is missing in .env file.';
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // Use true for port 465, false for others
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"MailBuddy" <${SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    try {
      // Send the email
      await transporter.sendMail(mailOptions);

      // Log the email to Firestore
      const logRef = await addDoc(collection(db, 'emailLogs'), {
        recipientEmail,
        subject,
        content: htmlContent,
        sentAt: Timestamp.now(),
        status: 'Sent',
        userId: userId,
      });

      return {
        success: true,
        message: 'Email sent and logged successfully.',
        logId: logRef.id,
      };
    } catch (error: any) {
      console.error('Nodemailer or Firestore Error:', error);
      
      let errorMessage = error.message || 'An unexpected error occurred.';

      return {
        success: false,
        message: `Failed to send email. Reason: ${errorMessage}`,
      };
    }
  }
);
