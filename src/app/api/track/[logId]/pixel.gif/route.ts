
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, Timestamp } from 'firebase/firestore';

// 1x1 transparent GIF
const pixel = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: Request,
  { params }: { params: { logId: string } }
) {
  const headers = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };

  try {
    const { logId } = params;

    if (!logId) {
      return new NextResponse(pixel, { headers });
    }

    const logRef = doc(db, 'emailLogs', logId);
    
    // Using a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
        const logSnap = await transaction.get(logRef);

        // Only process if the log exists and hasn't been opened yet
        if (logSnap.exists() && logSnap.data().status !== 'Opened') {
            const campaignId = logSnap.data().campaignId;
            
            // Mark the email as opened
            transaction.update(logRef, {
                status: 'Opened',
                openedAt: Timestamp.now(),
            });
            
            // If there's an associated campaign, update its open count
            if (campaignId) {
                const campaignRef = doc(db, 'campaigns', campaignId);
                const campaignDoc = await transaction.get(campaignRef);

                if (campaignDoc.exists()) {
                    const currentOpens = campaignDoc.data().openedCount || 0;
                    transaction.update(campaignRef, { openedCount: currentOpens + 1 });
                }
            }
        }
    });

  } catch (error) {
    // We catch errors but still return the pixel. 
    // We don't want to show a broken image in the email.
    console.error(`Error tracking email open for logId ${params.logId}:`, error);
  }

  return new NextResponse(pixel, { headers });
}
