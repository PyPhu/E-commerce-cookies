export interface MenuItem {
  id: string;
  name: string;
  type: 'menu' | 'custom';
  price: number;
  texture?: 'hard' | 'soft';
  flavor?: string;
  toppings?: string[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface UserInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: string;
  user: UserInfo;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  createdAt: Date;
}

export interface Product {
  id?: number; 
  item: string; 
  price: number; 
  texture: string; 
  flavor: string; 
  image_url: string; 
  show: boolean; 
  toppings: string[]; 
}