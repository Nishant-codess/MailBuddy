
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
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';


export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const customersCollection = collection(db, 'customers');
        const q = query(customersCollection, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const customersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            status: data.status,
            totalSpent: data.totalSpent,
          } as Customer;
        });
        setCustomers(customersData);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({
          variant: "destructive",
          title: "Error fetching customers",
          description: "Could not load customer data from the database.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCustomers();
    }
  }, [user, toast]);


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

  const parseCsvToCustomers = (csvText: string): Customer[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['name', 'email', 'status', 'totalSpent'];
    const hasAllHeaders = requiredHeaders.every(h => headers.includes(h));

    if (!hasAllHeaders) {
      toast({
        variant: "destructive",
        title: "Invalid CSV Headers",
        description: `CSV must contain headers: ${requiredHeaders.join(', ')}`,
      });
      return [];
    }
    
    const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const entry: {[key: string]: string} = {};
        headers.forEach((header, i) => {
            entry[header] = values[i];
        });
        
        return {
          id: `csv-${index}-${Date.now()}`,
          name: entry.name || '',
          email: entry.email || '',
          status: ['Active', 'Churned', 'New'].includes(entry.status) ? entry.status as Customer['status'] : 'New',
          totalSpent: parseFloat(entry.totalSpent) || 0,
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
          const newCustomers = parseCsvToCustomers(csvText);
          
          if (newCustomers.length === 0) {
            if(csvText.length > 0) {
              toast({ variant: "destructive", title: "No Customers Found", description: "Could not parse valid customer data from the CSV." });
            }
            return;
          }

          setLoading(true);

          const batch = writeBatch(db);
          const customersCollectionRef = collection(db, 'customers');

          // Replace strategy: delete old customers, add new ones.
          const q = query(customersCollectionRef, where('userId', '==', user.uid));
          const existingCustomersSnapshot = await getDocs(q);
          existingCustomersSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          newCustomers.forEach(customer => {
            const { id, ...customerData } = customer; // Firestore generates its own ID, so we discard the temporary one.
            const newCustomerRef = doc(customersCollectionRef);
            batch.set(newCustomerRef, { ...customerData, userId: user.uid });
          });
          
          await batch.commit();
          
          setCustomers(newCustomers);
          toast({ title: "Customers Updated", description: `${newCustomers.length} customers were imported successfully.` });
        } catch (error) {
            console.error("Failed to process CSV and update Firestore:", error);
            toast({ variant: "destructive", title: "Update Error", description: "Could not update the customer list in the database." });
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
