
"use client";

import { useState, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Copy, Loader2, Send, Sparkles, Upload, FileText, Calendar as CalendarIconLucide, Smile } from 'lucide-react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

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
import { sendEmail } from '@/ai/flows/send-email';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  template: z.string().min(1, { message: "Please select a template." }),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  customPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailCampaignBuilder() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState('');
  const [dataSummary, setDataSummary] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);

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
    setGeneratedSubject('');
    try {
      const prompt = `Template: ${values.template}. Product: ${values.productName}. Additional details: ${values.customPrompt || 'None'}`;
      const result = await generateEmail({ prompt, customerData: customerData || 'No customer data provided.' });
      setGeneratedEmail(result.emailContent);
      setGeneratedSubject(result.subject);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate email." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedEmail || generatedSubject) {
      const fullHtml = `<b>${generatedSubject}</b><br/><br/>${generatedEmail.replace(/\n/g, '<br>')}`;
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      navigator.clipboard.write([clipboardItem]);
      toast({ title: "Copied!", description: "Email subject and content copied to clipboard." });
    }
  };
  
  const handleSend = async () => {
     if (!generatedEmail || !user?.email) return;
     setIsSending(true);
     try {
       const result = await sendEmail({
         recipientEmail: user.email, // Sending test to self
         subject: generatedSubject,
         htmlContent: generatedEmail.replace(/\n/g, '<br>'),
       });

       if (result.success) {
         // Log to firestore on success
         await addDoc(collection(db, 'emailLogs'), {
           recipientEmail: user.email,
           subject: generatedSubject,
           content: generatedEmail.replace(/\n/g, '<br>'),
           sentAt: Timestamp.now(),
           status: 'Sent',
           userId: user.uid,
         });

         toast({ title: "Email Sent!", description: `Test email sent to ${user.email} and logged.` });
       } else {
         throw new Error(result.message);
       }
     } catch (error: any) {
       console.error("Send/Log Error:", error);
       toast({ variant: "destructive", title: "Failed to Send", description: error.message || "An unknown error occurred." });
     } finally {
       setIsSending(false);
     }
  }

  const handleSchedule = async () => {
    if(!selectedDate){
        toast({ variant: "destructive", title: "No date selected", description: "Please select a date to schedule." });
        return;
    }
    if (!generatedEmail || !user?.email) {
        toast({ variant: "destructive", title: "Nothing to schedule", description: "Please generate an email first." });
        return;
    }

    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduleDateTime = new Date(selectedDate);
    scheduleDateTime.setHours(hours, minutes, 0, 0); // set seconds and ms to 0

    try {
        await addDoc(collection(db, 'scheduledEmails'), {
            recipientEmail: user.email, // For this demo, we schedule a test for the user
            subject: generatedSubject,
            content: generatedEmail.replace(/\n/g, '<br>'),
            sendAt: Timestamp.fromDate(scheduleDateTime),
            status: 'Scheduled',
            userId: user.uid,
        });
        toast({ title: "Email Scheduled!", description: `Your campaign is scheduled for ${scheduleDateTime.toLocaleString()}.` });
    } catch(error) {
        console.error("Scheduling error:", error);
        toast({ variant: "destructive", title: "Scheduling Failed", description: "Could not save the scheduled email." });
    }
  }
  
  const handleEmojiClick = (emoji: string) => {
    const textarea = emailTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setGeneratedEmail(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
    }
  };

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
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2"><Send className="size-5" /> 3. Preview & Send</CardTitle>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon"><Smile className="size-5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                    <div className="grid grid-cols-6 gap-2">
                        {['😀', '😂', '😍', '🤔', '🔥', '🎉', '💯', '🙏', '👀', '👇', '👉', '💸'].map(emoji => (
                            <Button key={emoji} variant="ghost" size="icon" onClick={() => handleEmojiClick(emoji)}>{emoji}</Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
          </div>
          <CardDescription>Review, edit, and send the generated email.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="bg-background rounded-lg border p-4 min-h-[300px] text-sm flex flex-col gap-2">
            {isGenerating && <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full mt-4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
             </div>}
            {!isGenerating && !generatedEmail && !generatedSubject && <div className="text-muted-foreground flex items-center justify-center h-full">Your generated email will appear here.</div>}
            {(!isGenerating && (generatedEmail || generatedSubject || form.formState.isDirty)) && (
                <>
                    <Input 
                        placeholder="Email Subject"
                        value={generatedSubject}
                        onChange={(e) => setGeneratedSubject(e.target.value)}
                        className="font-bold text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                    />
                    <Textarea 
                        ref={emailTextareaRef}
                        placeholder="Email Body..."
                        value={generatedEmail}
                        onChange={(e) => setGeneratedEmail(e.target.value)}
                        className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 font-body whitespace-pre-wrap"
                    />
                </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleSend} disabled={!generatedEmail || isGenerating || isSending} className="w-full">
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test
            </Button>
            <Button onClick={handleCopy} variant="secondary" disabled={!generatedEmail || isGenerating} className="w-full"><Copy className="size-4 mr-2"/>Copy</Button>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")} disabled={!generatedEmail || isGenerating} >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {selectedDate ? `${selectedDate.toLocaleDateString()} at ${scheduleTime}` : <span>Schedule</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    <div className="p-2 border-t space-y-2">
                         <div className="grid gap-1.5">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                        </div>
                        <Button onClick={handleSchedule} size="sm" className="w-full">Confirm Schedule</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </CardFooter>
      </Card>
    </div>
  );
}
