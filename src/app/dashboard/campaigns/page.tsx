
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";

// Define the Campaign type based on Firestore document
interface Campaign {
  id: string;
  name: string;
  status: 'Sent' | 'Draft' | 'Scheduled' | 'Sending';
  createdAt: Date;
  recipientCount: number;
  openedCount?: number;
  openRate: number; // This will be calculated client-side
  userId?: string;
  template?: string;
  productName?: string;
  customPrompt?: string;
  customerData?: string;
}


export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const campaignsCollectionRef = collection(db, 'campaigns');
        const q = query(campaignsCollectionRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const userCampaigns = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            status: data.status,
            createdAt: (data.createdAt as Timestamp).toDate(),
            recipientCount: data.recipientCount || 0,
            openedCount: data.openedCount || 0,
            // openRate is calculated below, not taken from DB
            openRate: 0,
            userId: data.userId,
            template: data.template,
            productName: data.productName,
            customPrompt: data.customPrompt,
            customerData: data.customerData,
          } as Campaign;
        });

        // Sort campaigns by creation date on the client.
        userCampaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setCampaigns(userCampaigns);

      } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        let description = "Could not load your campaigns. Please try again later.";
        
        if (error.code === 'failed-precondition') {
            description = "A required database index is missing. Please check your browser's developer console for a link to create it.";
        } else if (error.code === 'permission-denied') {
            description = "You do not have permission to view campaigns. Please check your Firestore security rules."
        }
        toast({
            variant: "destructive",
            title: "Error Fetching Campaigns",
            description: description,
        });

      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, toast]);

  const getStatusVariant = (status: Campaign['status']): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'Sent':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'Scheduled':
        return 'outline';
      case 'Sending':
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
                  campaigns.map((campaign) => {
                    const openRate = campaign.recipientCount > 0 
                      ? ((campaign.openedCount || 0) / campaign.recipientCount) * 100 
                      : 0;

                    return (
                      <TableRow 
                        key={campaign.id}
                        onClick={() => {
                          if (campaign.status === 'Draft') {
                            router.push(`/dashboard?draftId=${campaign.id}`);
                          }
                        }}
                        className={campaign.status === 'Draft' ? 'cursor-pointer' : ''}
                      >
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
                        </TableCell>
                        <TableCell>{format(campaign.createdAt, 'PP')}</TableCell>
                        <TableCell className="text-right">{openRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
