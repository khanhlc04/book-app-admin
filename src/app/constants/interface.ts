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