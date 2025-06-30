
"use client"

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

// Define the Campaign type based on Firestore document
interface Campaign {
  id: string;
  name: string;
  status: 'Sent' | 'Draft' | 'Scheduled';
  createdAt: Date;
  recipientCount: number;
  openRate: number;
  userId?: string; // Add userId to the interface
}


export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch all campaigns and filter on the client to avoid indexing issues
        const querySnapshot = await getDocs(collection(db, 'campaigns'));

        const allCampaigns = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            status: data.status,
            createdAt: (data.createdAt as Timestamp).toDate(),
            recipientCount: data.recipientCount,
            openRate: data.openRate,
            userId: data.userId,
          } as Campaign;
        });

        // Filter campaigns for the current user
        const userCampaigns = allCampaigns.filter(campaign => campaign.userId === user.uid);
        
        // Sort campaigns by creation date
        userCampaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setCampaigns(userCampaigns);

      } catch (error) {
        // This might happen if the 'campaigns' collection doesn't exist yet
        // or if security rules are not set up. We'll log it and show an empty list.
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  const getStatusVariant = (status: 'Sent' | 'Draft' | 'Scheduled'): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'Sent':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'Scheduled':
        return 'outline';
      default:
        return 'default';
    }
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
          <p className="text-muted-foreground">
            View and manage your email campaigns.
          </p>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>An overview of all your past and present campaigns.</CardDescription>
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
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No campaigns found. Create one from the dashboard to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
                      </TableCell>
                      <TableCell>{format(campaign.createdAt, 'PP')}</TableCell>
                      <TableCell className="text-right">{campaign.openRate}%</TableCell>
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
