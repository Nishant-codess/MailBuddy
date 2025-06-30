
"use client"

import React, { useState, useRef } from 'react';
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
import { customers as initialCustomers, Customer } from "@/data/customers"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const parsedCustomers = parseCsvToCustomers(csvText);
          
          if (parsedCustomers.length > 0) {
            setCustomers(parsedCustomers);
            toast({ title: "Customers Updated", description: `${parsedCustomers.length} customers were loaded from your CSV.` });
          } else if (parsedCustomers.length === 0 && csvText.length > 0) {
            // This case handles when parsing returns empty, possibly due to header error toast already shown.
            // Or if the content is invalid.
            toast({ variant: "destructive", title: "No Customers Found", description: "Could not parse valid customer data from the CSV." });
          }
        } catch (error) {
            console.error("Failed to parse CSV:", error);
            toast({ variant: "destructive", title: "CSV Parsing Error", description: "The file could not be read or processed." });
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
          <Button onClick={handleUploadClick}>
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
              {customers.map((customer) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
