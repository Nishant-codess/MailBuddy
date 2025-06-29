'use server';

/**
 * @fileOverview A flow for sending an email and logging it to Firestore.
 * - sendEmail - Sends an email using SendGrid and logs the action.
 * - SendEmailInput - The input type for the sendEmail function.
 * - SendEmailOutput - The return type for the sendEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import sgMail from '@sendgrid/mail';
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
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!sendgridApiKey || !fromEmail) {
      const errorMessage = 'SendGrid API Key or From Email is not configured in .env file.';
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    sgMail.setApiKey(sendgridApiKey);

    const msg = {
      to: recipientEmail,
      from: fromEmail,
      subject: subject,
      html: htmlContent,
    };

    try {
      // Send the email
      await sgMail.send(msg);

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
      console.error('SendGrid or Firestore Error:', error);
       if (error.response) {
         console.error(error.response.body)
       }
      return {
        success: false,
        message: 'Failed to send or log email.',
      };
    }
  }
);
