"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';

interface EmailLog {
  id: string;
  recipientEmail: string;
  subject: string;
  content: string;
  sentAt: Date;
  userId: string;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const logsCollection = collection(db, 'emailLogs');
        const q = query(logsCollection, where('userId', '==', user.uid), orderBy('sentAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const logsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            sentAt: (data.sentAt as Timestamp).toDate(),
          } as EmailLog;
        });
        setLogs(logsData);
      } catch (error) {
        console.error("Error fetching email logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Logs</h2>
          <p className="text-muted-foreground">
            A history of all emails sent from your dashboard.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sent Emails</CardTitle>
          <CardDescription>Browse and review sent campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No logs found. Send an email from the dashboard to see it here.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.recipientEmail}</TableCell>
                      <TableCell>{log.subject}</TableCell>
                      <TableCell>{format(log.sentAt, 'PPP p')}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                              <DialogTitle>{log.subject}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-96">
                                <div className="p-4 border rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: log.content }}></div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
