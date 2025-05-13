export interface Book {
    id: string;
    book_name: string;
    description: string,
    poster: string;
    cost: number;
    file_pdf: string;
    file_epub: string;
    type: string[];
    author_id: string;
    vendor_id: string;
}

export interface Author {
    id: string;
    author_name: string;
    type: string[];
    image: string;
    description: string;
}

export interface Vendor {
    id: string;
    vendor_name: string;
    image: string;
    type: string[];
}

export interface Transaction {
    id: string;
    amount: number;
    bookId: string;
    checkoutUrl: string;
    createdAt: string;
    description: string;
    orderCode: number
    status: string;
    userId: string;
}

export interface Role {
    role: string;
}