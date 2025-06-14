export type OrderItem = {
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
    subtotal: number;
}

export type Order = {
    _id?: string;
    userId: string;
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    orderDate: Date;
    deliveryAddress?: string;
    phone?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}