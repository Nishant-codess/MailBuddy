
"use client"
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart, History, Home, Mails, Settings, Users, Loader2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import Logo from '@/components/logo';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { sendEmail } from '@/ai/flows/send-email';
import { useToast } from "@/hooks/use-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const checkAndSendScheduledEmails = async () => {
      try {
        const scheduledEmailsCollection = collection(db, 'scheduledEmails');
        // Simplified query to avoid composite index requirement
        const q = query(
          scheduledEmailsCollection,
          where('userId', '==', user.uid),
          where('status', '==', 'Scheduled')
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          return;
        }

        const now = Timestamp.now();
        // Filter for time on the client-side
        const dueDocs = querySnapshot.docs.filter(doc => {
            const email = doc.data();
            return email.sendAt && (email.sendAt as Timestamp) <= now;
        });

        if (dueDocs.length === 0) {
            return;
        }

        dueDocs.forEach(async (docSnapshot) => {
          const email = docSnapshot.data();
          const emailId = docSnapshot.id;

          try {
            // Mark as 'Sending' to prevent duplicate sends from multiple tabs
            const emailDocRef = doc(db, 'scheduledEmails', emailId);
            await updateDoc(emailDocRef, { status: 'Sending' });

            const sendResult = await sendEmail({
              recipientEmail: email.recipientEmail,
              subject: email.subject,
              htmlContent: email.content,
            });

            if (sendResult.success) {
              await updateDoc(emailDocRef, { status: 'Sent' });

              await addDoc(collection(db, 'emailLogs'), {
                recipientEmail: email.recipientEmail,
                subject: email.subject,
                content: email.content,
                sentAt: Timestamp.now(),
                status: 'Sent',
                userId: user.uid,
              });
              
              toast({
                title: "Campaign Sent!",
                description: `Your scheduled campaign "${email.subject}" was just sent.`,
              });

            } else {
              await updateDoc(emailDocRef, { status: 'Failed', errorMessage: sendResult.message });
              console.error(`Failed to send scheduled email: ${emailId}. Reason: ${sendResult.message}`);
               toast({
                variant: "destructive",
                title: "Campaign Failed to Send",
                description: `Scheduled campaign "${email.subject}" could not be sent. Reason: ${sendResult.message}`,
              });
            }
          } catch (error: any) {
              const emailDocRef = doc(db, 'scheduledEmails', emailId);
              await updateDoc(emailDocRef, { status: 'Failed', errorMessage: error.message || 'An unexpected error occurred during processing.' });
              console.error(`Error processing scheduled email ${emailId}:`, error);
          }
        });
      } catch (error: any) {
        if ((error as any).code === 'failed-precondition') {
            console.error("Firestore query failed. It might require an index on 'userId' and 'status'. Please check the Firebase console for an index creation link.", error);
        } else {
            console.error("Error checking for scheduled emails:", error);
        }
      }
    };

    const timeoutId = setTimeout(checkAndSendScheduledEmails, 3000); 
    const intervalId = setInterval(checkAndSendScheduledEmails, 60000);

    return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
    }

  }, [user, toast]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <Logo />
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-sidebar-foreground">MailBuddy</h2>
                </div>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                <Link href="/dashboard">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/customers')}>
                <Link href="/dashboard/customers">
                  <Users />
                  Customers
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/campaigns')}>
                <Link href="/dashboard/campaigns">
                  <Mails />
                  Campaigns
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/analytics')}>
                <Link href="/dashboard/analytics">
                  <BarChart />
                  Analytics
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/logs')}>
                <Link href="/dashboard/logs">
                  <History />
                  Logs
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/settings')}>
                <Link href="/dashboard/settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="ml-auto flex items-center gap-4">
                <UserNav />
            </div>
        </header>
        <main className="flex-1 overflow-auto">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
