
"use client";

import { useState, useEffect, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Copy, Loader2, Send, Sparkles, Upload, FileText, Calendar as CalendarIconLucide, Smile } from 'lucide-react';
import { addDoc, collection, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import React from 'react';

const formSchema = z.object({
  template: z.string().min(1, { message: "Please select a template." }),
  productName: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  customPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaignEmail {
  recipientEmail: string;
  subject: string;
  content: string;
  customer: any;
}

export function EmailCampaignBuilder({ draftId }: { draftId?: string }) {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [dataSummary, setDataSummary] = useState('');

  const [generatedCampaign, setGeneratedCampaign] = useState<CampaignEmail[]>([]);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [slideCount, setSlideCount] = React.useState(0)

  const [draftIdToUpdate, setDraftIdToUpdate] = useState<string | null>(draftId || null);

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: "gen-z-promo",
      productName: "",
      customPrompt: "",
    },
  });

  useEffect(() => {
    const loadDraft = async (id: string) => {
      if (!user) return;
      try {
        const draftDocRef = doc(db, 'campaigns', id);
        const draftDocSnap = await getDoc(draftDocRef);

        if (draftDocSnap.exists() && draftDocSnap.data().userId === user.uid) {
          const draftData = draftDocSnap.data();
          
          form.reset({
            template: draftData.template || "gen-z-promo",
            productName: draftData.productName || "",
            customPrompt: draftData.customPrompt || "",
          });

          if (draftData.customerData) {
            handleManualDataChange(draftData.customerData);
          }
          
          setDraftIdToUpdate(id); 
          
          toast({
            title: "Draft Loaded",
            description: "Your campaign draft has been loaded successfully.",
          });

        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not load the specified draft." });
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load the draft campaign." });
      }
    };

    if (draftId) {
      loadDraft(draftId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, user, form, toast]);


  React.useEffect(() => {
    if (!carouselApi) return;
    setSlideCount(carouselApi.scrollSnapList().length)
    setCurrentSlide(carouselApi.selectedScrollSnap() + 1)
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap() + 1)
    })
  }, [carouselApi])

  const parseCsv = (csvText: string): any[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const entry: {[key: string]: string} = {};
        headers.forEach((header, index) => {
            entry[header] = values[index];
        });
        return entry;
    });
    return data;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        handleManualDataChange(csvText);
        if(parseCsv(csvText).length > 0) {
            toast({ title: "Customers Loaded", description: `${parseCsv(csvText).length} customers found in your CSV.` });
        } else {
            toast({ variant: "destructive", title: "No Customers Found", description: "Could not parse any customer data from the CSV."})
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleManualDataChange = (csvText: string) => {
    setCustomerData(csvText);
    const parsedCustomers = parseCsv(csvText);
    setCustomers(parsedCustomers);
  }

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
    if (customers.length === 0) {
      toast({ variant: "destructive", title: "No Customers", description: "Please upload a CSV with customer data first." });
      return;
    }
    setIsGenerating(true);
    setGeneratedCampaign([]);
    try {
      const promptTemplate = `Template: ${values.template}. Product: ${values.productName}. Additional details: ${values.customPrompt || 'None'}`;
      
      const generationPromises = customers.map(customer => {
        const customerDataString = `Customer Details: ${JSON.stringify(customer, null, 2)}`;
        return generateEmail({ prompt: promptTemplate, customerData: customerDataString })
          .then(result => ({ 
              recipientEmail: customer.email,
              subject: result.subject,
              content: result.emailContent,
              customer 
            }));
      });

      const results = await Promise.all(generationPromises);

      setGeneratedCampaign(results);
      toast({ title: "Campaign Generated!", description: `Personalized emails created for ${results.length} customers.` });

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate the email campaign." });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSendAll = async () => {
    if (generatedCampaign.length === 0 || !user) return;
    setIsSending(true);

    const sendPromises = generatedCampaign.map(email => {
      return sendEmail({
        recipientEmail: email.recipientEmail,
        subject: email.subject,
        htmlContent: email.content.replace(/\n/g, '<br>'),
      }).then(async (sendResult) => {
        if (sendResult.success) {
          await addDoc(collection(db, 'emailLogs'), {
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            content: email.content.replace(/\n/g, '<br>'),
            sentAt: Timestamp.now(),
            status: 'Sent',
            userId: user.uid,
          });
          return { status: 'fulfilled', value: email.recipientEmail };
        } else {
          return { status: 'rejected', reason: sendResult.message, recipient: email.recipientEmail };
        }
      });
    });

    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(r => r.status === 'fulfilled').length;
    const failedSends = results.filter(r => r.status === 'rejected');
    
    if (successfulSends > 0) {
      toast({ title: "Campaign Sent!", description: `${successfulSends} emails sent successfully.` });
       // Create a single campaign record in Firestore for history
      try {
        await addDoc(collection(db, 'campaigns'), {
          name: generatedCampaign[0].subject,
          status: 'Sent',
          createdAt: Timestamp.now(),
          recipientCount: successfulSends,
          openRate: 0, // Placeholder for open rate tracking
          userId: user.uid,
        });
      } catch (error) {
        console.error("Error creating campaign record:", error);
        // Silently fail, as the core function (sending email) succeeded.
      }
    }

    if (failedSends.length > 0) {
      toast({ variant: "destructive", title: "Sending Failed", description: `${failedSends.length} emails could not be sent. Check console for details.` });
      console.error("Failed sends:", failedSends);
    }

    setIsSending(false);
  }

  const handleScheduleAll = async () => {
    if(!selectedDate){
        toast({ variant: "destructive", title: "No date selected", description: "Please select a date to schedule." });
        return;
    }
    if (generatedCampaign.length === 0 || !user) {
        toast({ variant: "destructive", title: "Nothing to schedule", description: "Please generate an email first." });
        return;
    }

    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduleDateTime = new Date(selectedDate);
    scheduleDateTime.setHours(hours, minutes, 0, 0); // set seconds and ms to 0

    try {
      const schedulePromises = generatedCampaign.map(email => {
         return addDoc(collection(db, 'scheduledEmails'), {
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            content: email.content.replace(/\n/g, '<br>'),
            sendAt: Timestamp.fromDate(scheduleDateTime),
            status: 'Scheduled',
            userId: user.uid,
        });
      });
      await Promise.all(schedulePromises);

      // Create a single campaign record in Firestore for history
      await addDoc(collection(db, 'campaigns'), {
        name: generatedCampaign[0].subject,
        status: 'Scheduled',
        createdAt: Timestamp.fromDate(scheduleDateTime),
        recipientCount: generatedCampaign.length,
        openRate: 0, // Placeholder
        userId: user.uid,
      });

      toast({ title: "Campaign Scheduled!", description: `${generatedCampaign.length} emails scheduled for ${scheduleDateTime.toLocaleString()}.` });
    } catch(error) {
        console.error("Scheduling error:", error);
        toast({ variant: "destructive", title: "Scheduling Failed", description: "Could not save the scheduled campaign." });
    }
  }

  const handleSaveDraft = async () => {
    if (!user) return;

    const values = form.getValues();
    if (!values.productName && !customerData) {
        toast({ variant: "destructive", title: "Cannot Save Empty Draft", description: "Please provide a product name or some customer data." });
        return;
    }

    setIsSavingDraft(true);
    setGeneratedCampaign([]);
    try {
        const draftData = {
            name: values.productName || 'Untitled Draft',
            status: 'Draft' as const,
            createdAt: Timestamp.now(),
            userId: user.uid,
            template: values.template,
            productName: values.productName,
            customPrompt: values.customPrompt,
            customerData: customerData,
            recipientCount: customers.length,
            openRate: 0,
        };

        if (draftIdToUpdate) {
            const draftDocRef = doc(db, 'campaigns', draftIdToUpdate);
            await updateDoc(draftDocRef, draftData);
            toast({ title: "Draft Updated", description: "Your changes have been saved." });
        } else {
            const docRef = await addDoc(collection(db, 'campaigns'), draftData);
            setDraftIdToUpdate(docRef.id);
            toast({ title: "Draft Saved", description: "Your campaign has been saved as a draft." });
        }
    } catch (error) {
        console.error("Error saving draft:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to save draft." });
    } finally {
        setIsSavingDraft(false);
    }
  };


  const handleEmailChange = (index: number, field: 'subject' | 'content', value: string) => {
    const newCampaign = [...generatedCampaign];
    newCampaign[index] = { ...newCampaign[index], [field]: value };
    setGeneratedCampaign(newCampaign);
  };
  
  const handleEmojiClick = (emoji: string) => {
    if (currentSlide > 0 && generatedCampaign[currentSlide - 1]) {
      const currentIndex = currentSlide - 1;
      const currentContent = generatedCampaign[currentIndex].content;
      // This is a simplified way to insert emoji. A ref to the active textarea would be better.
      const newContent = currentContent + emoji;
      handleEmailChange(currentIndex, 'content', newContent);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Column 1: Data & Summary */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="size-5" /> 1. Add Customer Data</CardTitle>
            <CardDescription>Upload a CSV with customer emails and data to personalize your campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="csv">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv"><Upload className="size-4 mr-2"/>Upload CSV</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="csv" className="mt-4">
                <Input type="file" accept=".csv, text/csv" onChange={handleFileChange} />
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <Textarea placeholder="Paste CSV data here (e.g., name,email,product)..." value={customerData} onChange={(e) => handleManualDataChange(e.target.value)} rows={8} />
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
            <CardDescription>An AI-powered overview of your customer data.</CardDescription>
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
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="size-5" /> 2. Compose Campaign</CardTitle>
          <CardDescription>Select a template and provide product details for the AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
              <div className="space-y-6 flex-1">
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
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isGenerating || customers.length === 0} className="w-full">
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Campaign
                </Button>
                <Button variant="outline" type="button" onClick={handleSaveDraft} disabled={isGenerating || isSavingDraft} className="w-full">
                  {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {draftIdToUpdate ? 'Update Draft' : 'Save as Draft'}
                </Button>
              </div>
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
                    <Button variant="ghost" size="icon" disabled={generatedCampaign.length === 0}><Smile className="size-5" /></Button>
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
          <CardDescription>Review, edit, and send the generated campaign emails.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 justify-center">
          {isGenerating && <div className="text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /><p>Generating {customers.length} emails...</p></div>}
          {!isGenerating && generatedCampaign.length === 0 && <div className="text-muted-foreground text-center">Your generated campaign will appear here.</div>}
          
          {generatedCampaign.length > 0 && !isGenerating && (
            <Carousel setApi={setCarouselApi} className="w-full">
              <CarouselContent>
                {generatedCampaign.map((email, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <div className="bg-background rounded-lg border p-4 text-sm flex flex-col gap-2 h-[300px]">
                        <div className="font-medium text-muted-foreground">To: <span className="font-bold text-foreground">{email.recipientEmail}</span></div>
                        <Input 
                            placeholder="Email Subject"
                            value={email.subject}
                            onChange={(e) => handleEmailChange(index, 'subject', e.target.value)}
                            className="font-bold text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                        />
                        <Textarea 
                            placeholder="Email Body..."
                            value={email.content}
                            onChange={(e) => handleEmailChange(index, 'content', e.target.value)}
                            className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 font-body whitespace-pre-wrap"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
              <div className="py-2 text-center text-sm text-muted-foreground">
                Email {currentSlide} of {slideCount}
              </div>
            </Carousel>
          )}

        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleSendAll} disabled={generatedCampaign.length === 0 || isGenerating || isSending} className="w-full">
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send All ({generatedCampaign.length})
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")} disabled={generatedCampaign.length === 0 || isGenerating} >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {selectedDate ? `${selectedDate.toLocaleDateString()} at ${scheduleTime}` : <span>Schedule All</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    <div className="p-2 border-t space-y-2">
                         <div className="grid gap-1.5">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                        </div>
                        <Button onClick={handleScheduleAll} size="sm" className="w-full">Confirm Schedule</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </CardFooter>
      </Card>
    </div>
  );
}
