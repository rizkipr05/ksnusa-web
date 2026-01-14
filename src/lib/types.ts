export interface Part {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  supplier: string;
  compatibility: string[];
  brand: string;
  partNumber: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  status: 'active' | 'discontinued' | 'out-of-stock';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  id: string;
  partId: string;
  part: Part;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: 'individual' | 'business';
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  address: Address;
  paymentTerms: string;
  leadTime: number; // in days
  minimumOrder: number;
  rating: number;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  subcategories?: Category[];
}

export interface StockMovement {
  id: string;
  partId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string; // order number, supplier invoice, etc.
  createdAt: string;
  createdBy: string;
}

export interface DashboardStats {
  totalParts: number;
  lowStock: number;
  pendingOrders: number;
  monthlyRevenue: number;
  totalSuppliers: number;
  inventoryValue: number;
  topSellingCategories: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'stock' | 'inventory' | 'supplier';
    description: string;
    time: string;
    status: 'pending' | 'warning' | 'completed' | 'success';
  }>;
}