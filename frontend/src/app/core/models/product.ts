export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];
  sku: string;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
