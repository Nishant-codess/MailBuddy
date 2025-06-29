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

const campaigns = [
  {
    name: "Summer Sale Kickoff",
    status: "Sent",
    sentDate: "2023-06-15",
    openRate: "28.5%",
  },
  {
    name: "New Arrivals: Gen-Z Edition",
    status: "Sent",
    sentDate: "2023-07-01",
    openRate: "35.2%",
  },
  {
    name: "Back to School Special",
    status: "Draft",
    sentDate: "-",
    openRate: "-",
  },
  {
    name: "Holiday Gift Guide",
    status: "Scheduled",
    sentDate: "2023-11-20",
    openRate: "-",
  },
  {
    name: "Weekly Newsletter #42",
    status: "Sent",
    sentDate: "2023-07-12",
    openRate: "22.1%",
  },
];

export default function CampaignsPage() {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.name}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(campaign.status as any)}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>{campaign.sentDate}</TableCell>
                  <TableCell className="text-right">{campaign.openRate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
