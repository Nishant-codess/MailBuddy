
"use client"

import React, { useState, useRef, useEffect } from 'react';
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
import { type Customer } from "@/data/customers"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';


export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCustomers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const customersCollectionRef = collection(db, 'customers');
      const q = query(customersCollectionRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const userCustomers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          status: data.status,
          totalSpent: data.totalSpent,
          userId: data.userId, // Keep userId for lookups
        } as Customer;
      });
      setCustomers(userCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        variant: "destructive",
        title: "Error fetching customers",
        description: "Could not load customer data. Please check your Firestore security rules or internet connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);


  const getStatusVariant = (status: 'Active' | 'Churned' | 'New'): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Churned':
        return 'destructive';
      case 'New':
        return 'secondary';
      default:
        return 'default';
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const parseCsvToCustomers = (csvText: string): Omit<Customer, 'id' | 'userId'>[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
  
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
  
    const headerMapping: { [key: string]: string[] } = {
      name: ['name', 'customername'],
      email: ['email', 'emailid', 'emailaddress'],
      status: ['status'],
      totalSpent: ['totalspent', 'totalspentindollars']
    };
  
    const findIndex = (headerOptions: string[]) => {
      for (const option of headerOptions) {
        const index = headers.indexOf(option);
        if (index !== -1) return index;
      }
      return -1;
    };
  
    const indices = {
      name: findIndex(headerMapping.name),
      email: findIndex(headerMapping.email),
      status: findIndex(headerMapping.status),
      totalSpent: findIndex(headerMapping.totalSpent)
    };
  
    if (indices.name === -1 || indices.email === -1) {
      toast({
        variant: "destructive",
        title: "Invalid CSV Headers",
        description: `CSV must contain columns for 'Name' and 'Email'. Please check your file.`,
      });
      return [];
    }
    
    const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const name = values[indices.name] || '';
        const email = values[indices.email] || '';
        const statusStr = indices.status !== -1 ? values[indices.status] : 'New';
        const totalSpentStr = indices.totalSpent !== -1 ? values[indices.totalSpent] : '0';
        
        return {
          name: name,
          email: email,
          status: ['Active', 'Churned', 'New'].includes(statusStr) ? statusStr as Customer['status'] : 'New',
          totalSpent: parseFloat(totalSpentStr) || 0,
        };
    }).filter(c => c.name && c.email);
    
    return data;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const newCustomersFromCsv = parseCsvToCustomers(csvText);
          
          if (newCustomersFromCsv.length === 0) {
            if(csvText.length > 0) {
              // Toast is shown in parseCsvToCustomers if headers are invalid
            }
            return;
          }

          setLoading(true);

          // Create a map of existing customers by email for quick lookup.
          const existingCustomersMap = new Map(customers.map(c => [c.email, c.id]));
          
          const customersCollectionRef = collection(db, 'customers');
          const batch = writeBatch(db);
          let upsertCount = { updated: 0, created: 0 };
          
          for (const customer of newCustomersFromCsv) {
            const dataWithUser = { ...customer, userId: user.uid };
            const existingDocId = existingCustomersMap.get(customer.email);

            if (existingDocId) {
              // Update existing customer
              const customerDocRef = doc(db, 'customers', existingDocId);
              batch.update(customerDocRef, dataWithUser);
              upsertCount.updated++;
            } else {
              // Create new customer
              const newCustomerRef = doc(customersCollectionRef);
              batch.set(newCustomerRef, dataWithUser);
              upsertCount.created++;
            }
          }

          await batch.commit();
          
          toast({ title: "Customers Updated", description: `${upsertCount.created} customers added, ${upsertCount.updated} updated.` });

          // Re-fetch customers to show the latest state in the UI
          await fetchCustomers();

        } catch (error: any) {
            console.error("Failed to process CSV and update Firestore:", error);
            let description = "Could not update the customer list in the database.";
            if (error.code === 'failed-precondition') {
                description = "A required database index is missing. Please check the browser's developer console for a link to create it.";
            } else if (error.code === 'permission-denied') {
                description = "You do not have permission to perform this action. Please check your Firestore security rules."
            }
            toast({ variant: "destructive", title: "Update Error", description });
        } finally {
            setLoading(false);
            // Reset file input so user can upload the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
      }
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Here's a list of your customers.
          </p>
        </div>
        <div>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv, text/csv"
          />
          <Button onClick={handleUploadClick} disabled={loading}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Customer Billing history/Details
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>An overview of all your customers.</CardDescription>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No customers found. Upload a CSV to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(customer.status)}>{customer.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${customer.totalSpent.toFixed(2)}
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
