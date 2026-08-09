export interface Product {
  id?: number;

  barcode: string;

  name: string;

  description?: string;

  categoryId: number;

  costPrice: number;

  sellingPrice: number;

  minimumStock: number;

  unit: string;

  image?: string;

  active: boolean;

  createdAt?: string;

  updatedAt?: string;
}