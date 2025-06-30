import { EmailCampaignBuilder } from "@/components/email-campaign-builder";

export default function DashboardPage({ searchParams }: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const draftId = searchParams?.draftId as string | undefined;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Email Campaign Builder</h2>
          <p className="text-muted-foreground">
            {draftId ? "Editing your draft campaign." : "Create your next viral marketing email in seconds."}
          </p>
        </div>
      </div>
      <EmailCampaignBuilder draftId={draftId} />
    </div>
  );
}
