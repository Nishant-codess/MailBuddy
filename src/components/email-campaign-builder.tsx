"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Copy, Loader2, Send, Sparkles, Upload, FileText, Calendar as CalendarIconLucide } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils';
import { summarizeCustomerData } from '@/ai/flows/summarize-customer-data';
import { generateEmail } from '@/ai/flows/generate-email-from-prompt';

const formSchema = z.object({
  template: z.string().min(1, { message: "Please select a template." }),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  customPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailCampaignBuilder() {
  const [customerData, setCustomerData] = useState('');
  const [dataSummary, setDataSummary] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: "gen-z-promo",
      productName: "",
      customPrompt: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomerData(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSummarize = async () => {
    if (!customerData) {
      toast({ variant: "destructive", title: "No customer data", description: "Please upload or enter customer data first." });
      return;
    }
    setIsSummarizing(true);
    setDataSummary('');
    try {
      const result = await summarizeCustomerData({ customerData });
      setDataSummary(result.summary);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to summarize data." });
    } finally {
      setIsSummarizing(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsGenerating(true);
    setGeneratedEmail('');
    try {
      const prompt = `Template: ${values.template}. Product: ${values.productName}. Additional details: ${values.customPrompt || 'None'}`;
      const result = await generateEmail({ prompt, customerData: customerData || 'No customer data provided.' });
      setGeneratedEmail(result.emailContent);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate email." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(generatedEmail);
      toast({ title: "Copied!", description: "Email content copied to clipboard." });
    }
  };
  
  const handleSend = () => {
     toast({ title: "Email Sent!", description: "Your campaign has been sent (simulated)." });
  }

  const handleSchedule = () => {
    if(selectedDate){
        toast({ title: "Email Scheduled!", description: `Your campaign is scheduled for ${selectedDate.toLocaleDateString()} (simulated).` });
    } else {
        toast({ variant: "destructive", title: "No date selected", description: "Please select a date to schedule." });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Column 1: Data & Summary */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="size-5" /> 1. Add Customer Data</CardTitle>
            <CardDescription>Upload a CSV or paste raw data. Then get an AI summary.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="csv">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv"><Upload className="size-4 mr-2"/>Upload CSV</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="csv" className="mt-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} />
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <Textarea placeholder="Paste CSV data here..." value={customerData} onChange={(e) => setCustomerData(e.target.value)} rows={8} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSummarize} disabled={isSummarizing || !customerData} className="w-full">
              {isSummarizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Summarize Data
            </Button>
          </CardFooter>
        </Card>

        { (isSummarizing || dataSummary) && (
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground whitespace-pre-wrap">
             {isSummarizing && <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
             </div>}
            {dataSummary}
          </CardContent>
        </Card>
        )}
      </div>

      {/* Column 2: Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="size-5" /> 2. Compose Email</CardTitle>
          <CardDescription>Select a template and provide product details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="template" render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select an email template" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gen-z-promo">Gen-Z Promo</SelectItem>
                      <SelectItem value="flash-sale">Flash Sale</SelectItem>
                      <SelectItem value="friendly-reminder">Friendly Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="productName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Super-Duper Coffee Beans" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customPrompt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Mention our new loyalty program..." {...field} rows={4} className="font-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isGenerating} className="w-full">
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Column 3: Preview */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="size-5" /> 3. Preview & Send</CardTitle>
          <CardDescription>Review the generated email and send it to your customers.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="bg-background rounded-lg border p-4 min-h-[300px] text-sm whitespace-pre-wrap font-body">
            {isGenerating && <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-1/2" />
             </div>}
            {!isGenerating && !generatedEmail && <div className="text-muted-foreground flex items-center justify-center h-full">Your generated email will appear here.</div>}
            {generatedEmail}
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleSend} disabled={!generatedEmail || isGenerating} className="w-full">Send Now</Button>
            <Button onClick={handleCopy} variant="secondary" disabled={!generatedEmail || isGenerating} className="w-full"><Copy className="size-4 mr-2"/>Copy</Button>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")} disabled={!generatedEmail || isGenerating} >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {selectedDate ? selectedDate.toLocaleDateString() : <span>Schedule</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    <div className="p-2 border-t">
                        <Button onClick={handleSchedule} size="sm" className="w-full">Confirm Schedule</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </CardFooter>
      </Card>
    </div>
  );
}
