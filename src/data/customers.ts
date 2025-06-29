export type Customer = {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Churned' | 'New';
  totalSpent: number;
};

export const customers: Customer[] = [
  {
    id: 'cus_1',
    name: 'Liam Johnson',
    email: 'liam@example.com',
    status: 'Active',
    totalSpent: 250.75,
  },
  {
    id: 'cus_2',
    name: 'Olivia Smith',
    email: 'olivia@example.com',
    status: 'Active',
    totalSpent: 150.50,
  },
  {
    id: 'cus_3',
    name: 'Noah Williams',
    email: 'noah@example.com',
    status: 'New',
    totalSpent: 0,
  },
  {
    id: 'cus_4',
    name: 'Emma Brown',
    email: 'emma@example.com',
    status: 'Churned',
    totalSpent: 50.00,
  },
  {
    id: 'cus_5',
    name: 'Oliver Jones',
    email: 'oliver@example.com',
    status: 'Active',
    totalSpent: 500.20,
  },
  {
    id: 'cus_6',
    name: 'Ava Garcia',
    email: 'ava@example.com',
    status: 'Active',
    totalSpent: 320.00,
  },
  {
    id: 'cus_7',
    name: 'Elijah Miller',
    email: 'elijah@example.com',
    status: 'New',
    totalSpent: 0,
  },
  {
    id: 'cus_8',
    name: 'Charlotte Davis',
    email: 'charlotte@example.com',
    status: 'Churned',
    totalSpent: 120.99,
  },
];
