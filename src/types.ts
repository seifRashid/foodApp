export interface FoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  food_id: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  user_email: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  created_at: string;
  delivery_notes?: string;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
}
