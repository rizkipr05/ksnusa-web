import { Part, Order, Supplier, Category, Customer, DashboardStats } from './types';

export const categories: Category[] = [
  { id: '1', name: 'Engine', description: 'Engine components and performance parts' },
  { id: '2', name: 'Exhaust', description: 'Exhaust systems and components' },
  { id: '3', name: 'Suspension', description: 'Suspension and handling components' },
  { id: '4', name: 'Brakes', description: 'Brake systems and components' },
  { id: '5', name: 'Electronics', description: 'Electronic tuning and monitoring equipment' },
  { id: '6', name: 'Interior', description: 'Interior upgrades and accessories' },
  { id: '7', name: 'Exterior', description: 'Body kits and exterior modifications' },
  { id: '8', name: 'Tools', description: 'Professional tuning and maintenance tools' }
];

export const suppliers: Supplier[] = [
  {
    id: '1',
    name: 'Haltech ECU.',
    contact: {
      email: 'haltech@performanceplus.com',
      phone: '+1-555-0123',
      website: 'https://haltech.com'
    },
    address: {
      street: '123 Industrial Blvd',
      city: 'Detroit',
      state: 'MI',
      zipCode: '48201',
      country: 'USA'
    },
    paymentTerms: 'Net 30',
    leadTime: 7,
    minimumOrder: 500,
    rating: 4.8,
    status: 'active',
    createdAt: '2023-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'LINK ECU',
    contact: {
      email: 'sales@linkecu.com',
      phone: '+1-555-0456',
      website: 'https://linkecu.com'
    },
    address: {
      street: '456 Speed Way',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    paymentTerms: 'Net 15',
    leadTime: 5,
    minimumOrder: 1000,
    rating: 4.9,
    status: 'active',
    createdAt: '2023-02-20T00:00:00Z'
  }
];

export const parts: Part[] = [
  {
    id: '1',
    sku: 'CAI-HON-001',
    name: 'Cold Air Intake System',
    description: 'High-performance cold air intake system for Honda Civic Type R',
    category: 'Engine',
    subcategory: 'Air Intake',
    price: 299.99,
    cost: 180.00,
    stock: 25,
    minStock: 5,
    maxStock: 50,
    supplier: 'Performance Plus Inc.',
    compatibility: ['Honda Civic Type R 2017-2023', 'Honda Civic Si 2017-2023'],
    brand: 'AEM',
    partNumber: 'AEM-21-756C',
    weight: 8.5,
    dimensions: { length: 24, width: 12, height: 8 },
    images: ['https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/9aef549e-5b60-4e43-9b75-5331c24d396e.png'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    sku: 'EXH-BMW-002',
    name: 'Performance Exhaust System',
    description: 'Cat-back exhaust system for BMW M3/M4',
    category: 'Exhaust',
    subcategory: 'Cat-Back Systems',
    price: 1299.99,
    cost: 780.00,
    stock: 8,
    minStock: 3,
    maxStock: 15,
    supplier: 'TurboTech Solutions',
    compatibility: ['BMW M3 F80 2014-2018', 'BMW M4 F82/F83 2014-2020'],
    brand: 'Akrapovic',
    partNumber: 'AKR-S-BM/T/4H',
    weight: 35.2,
    dimensions: { length: 48, width: 18, height: 12 },
    images: ['https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/30719e34-4c45-4218-9aec-210894b01861.png'],
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z'
  },
  {
    id: '3',
    sku: 'SUS-SUB-003',
    name: 'Coilover Suspension Kit',
    description: 'Adjustable coilover suspension for Subaru WRX STI',
    category: 'Suspension',
    subcategory: 'Coilovers',
    price: 1899.99,
    cost: 1140.00,
    stock: 12,
    minStock: 4,
    maxStock: 20,
    supplier: 'Performance Plus Inc.',
    compatibility: ['Subaru WRX STI 2015-2021', 'Subaru WRX 2015-2021'],
    brand: 'KW Suspension',
    partNumber: 'KW-35220061',
    weight: 45.8,
    dimensions: { length: 36, width: 24, height: 18 },
    images: ['https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/907c12cf-f921-464e-ac38-74972c65c681.png'],
    status: 'active',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z'
  },
  {
    id: '4',
    sku: 'BRK-POR-004',
    name: 'Big Brake Kit',
    description: 'High-performance brake kit for Porsche 911',
    category: 'Brakes',
    subcategory: 'Brake Kits',
    price: 3299.99,
    cost: 1980.00,
    stock: 3,
    minStock: 2,
    maxStock: 8,
    supplier: 'TurboTech Solutions',
    compatibility: ['Porsche 911 991.1 2012-2016', 'Porsche 911 991.2 2016-2019'],
    brand: 'Brembo',
    partNumber: 'BRM-GT-R365',
    weight: 68.5,
    dimensions: { length: 18, width: 18, height: 8 },
    images: ['https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/61fa9a81-0f27-4a4a-aba4-f5a2280eeb70.png'],
    status: 'active',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z'
  },
  {
    id: '5',
    sku: 'TUR-BMW-005',
    name: 'Turbo Kit - BMW N54',
    description: 'Single turbo conversion kit for BMW N54 engine',
    category: 'Engine',
    subcategory: 'Turbo Systems',
    price: 4999.99,
    cost: 3000.00,
    stock: 2,
    minStock: 1,
    maxStock: 5,
    supplier: 'Performance Plus Inc.',
    compatibility: ['BMW 335i N54 2007-2010', 'BMW 135i N54 2008-2013'],
    brand: 'Pure Turbos',
    partNumber: 'PT-N54-ST-700',
    weight: 125.0,
    dimensions: { length: 48, width: 36, height: 24 },
    images: ['https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/bdb95bf8-0439-4960-b9e2-ea2631024132.png'],
    status: 'active',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-19T00:00:00Z'
  },
  {
    id: '6',
    sku: 'ECU-UNI-006',
    name: 'ECU Tuning Device',
    description: 'Universal ECU tuning and monitoring device',
    category: 'Electronics',
    subcategory: 'Tuning Equipment',
    price: 899.99,
    cost: 540.00,
    stock: 15,
    minStock: 8,
    maxStock: 30,
    supplier: 'TurboTech Solutions',
    compatibility: ['Universal - Most OBD2 Vehicles'],
    brand: 'Cobb Tuning',
    partNumber: 'COBB-AP3-UNI-001',
    weight: 2.1,
    dimensions: { length: 8, width: 5, height: 2 },
    images: ['https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/e2daacdc-3db9-4cc5-837d-04a905750774.png'],
    status: 'active',
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  }
];

export const customers: Customer[] = [
  {
    id: '1',
    name: 'AutoMax Garage',
    email: 'orders@automaxgarage.com',
    phone: '+1-555-1001',
    company: 'AutoMax Performance',
    type: 'business',
    createdAt: '2023-06-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-1002',
    type: 'individual',
    createdAt: '2023-08-22T00:00:00Z'
  },
  {
    id: '3',
    name: 'SpeedTech Motors',
    email: 'purchasing@speedtechmotors.com',
    phone: '+1-555-1003',
    company: 'SpeedTech Motors LLC',
    type: 'business',
    createdAt: '2023-09-10T00:00:00Z'
  }
];

export const orders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customer: customers[0],
    items: [
      {
        id: '1',
        partId: '1',
        part: parts[0],
        quantity: 2,
        unitPrice: 299.99,
        totalPrice: 599.98
      },
      {
        id: '2',
        partId: '6',
        part: parts[5],
        quantity: 1,
        unitPrice: 899.99,
        totalPrice: 899.99
      }
    ],
    status: 'pending',
    subtotal: 1499.97,
    tax: 119.98,
    shipping: 25.00,
    total: 1644.95,
    paymentStatus: 'pending',
    shippingAddress: {
      street: '789 Garage Street',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'USA'
    },
    billingAddress: {
      street: '789 Garage Street',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'USA'
    },
    notes: 'Rush order - customer needs parts by Friday',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    estimatedDelivery: '2024-01-25T00:00:00Z'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customer: customers[2],
    items: [
      {
        id: '3',
        partId: '3',
        part: parts[2],
        quantity: 1,
        unitPrice: 1899.99,
        totalPrice: 1899.99
      }
    ],
    status: 'shipped',
    subtotal: 1899.99,
    tax: 151.99,
    shipping: 50.00,
    total: 2101.98,
    paymentStatus: 'paid',
    shippingAddress: {
      street: '456 Speed Avenue',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA'
    },
    billingAddress: {
      street: '456 Speed Avenue',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA'
    },
    createdAt: '2024-01-18T14:15:00Z',
    updatedAt: '2024-01-19T09:20:00Z',
    estimatedDelivery: '2024-01-23T00:00:00Z'
  }
];

export const dashboardStats: DashboardStats = {
  totalParts: 1247,
  lowStock: 23,
  pendingOrders: 8,
  monthlyRevenue: 45680,
  totalSuppliers: 15,
  inventoryValue: 234500,
  topSellingCategories: [
    { category: 'Engine', sales: 145, revenue: 32400 },
    { category: 'Exhaust', sales: 89, revenue: 28900 },
    { category: 'Suspension', sales: 67, revenue: 45200 },
    { category: 'Brakes', sales: 54, revenue: 22100 }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'order',
      description: 'New order #ORD-2024-001 from AutoMax Garage',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: '2',
      type: 'stock',
      description: 'Low stock alert: Turbo Kit - BMW N54',
      time: '4 hours ago',
      status: 'warning'
    },
    {
      id: '3',
      type: 'order',
      description: 'Order #ORD-2024-002 shipped to SpeedTech Motors',
      time: '6 hours ago',
      status: 'completed'
    },
    {
      id: '4',
      type: 'inventory',
      description: 'Added 50x Cold Air Intake - Honda Civic',
      time: '1 day ago',
      status: 'success'
    }
  ]
};