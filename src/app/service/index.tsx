import { addDoc, collection, doc, getDocs, increment, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Author, Book, Vendor } from "../constants/interface";

// Books
export const getBooks = async () => {
    try {
        const q = query(
            collection(db, 'book'),
            orderBy('created_at', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const list: Book[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Book[];
        return list;
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
};

export const addBook = async (bookData: Omit<Book, 'id'>) => {
    try {
        const newBookRef = await addDoc(collection(db, 'book'), {
            book_name: bookData.book_name,
            description: bookData.description,
            poster: bookData.poster,
            cost: bookData.cost,
            file_pdf: bookData.file_pdf,
            file_epub: bookData.file_epub,
            type: bookData.type,
            author_id: bookData.author_id,
            vendor_id: bookData.vendor_id,
            buyed: 0,
            created_at: new Date(),  
        });

 
        return {
            id: newBookRef.id,  
            ...bookData,
        };
    } catch (error) {
        console.error('Error adding book:', error);
        throw new Error('Failed to add book');
    }
};

export const updateBook = async (id: string, bookData: Omit<Book, 'id'>): Promise<Book> => {
    try {
        const bookRef = doc(db, 'book', id);

        await updateDoc(bookRef, {
            book_name: bookData.book_name,
            description: bookData.description,
            poster: bookData.poster,
            cost: bookData.cost,
            file_pdf: bookData.file_pdf,
            file_epub: bookData.file_epub,
            type: bookData.type,
            author_id: bookData.author_id,
            vendor_id: bookData.vendor_id
        });

        return { id, ...bookData };
    } catch (error) {
        console.error('Error updating book:', error);
        throw new Error('Unable to update book');
    }
};

export const updateBookBuyed = async (bookId: string) => {
    try {
        const bookRef = doc(db, 'book', bookId);
        await updateDoc(bookRef, {
            buyed: increment(1),
        });
        console.log('Buyed count updated successfully.');
    } catch (error) {
        console.error('Error updating buyed count:', error);
    }
};

// Authors
export const getAuthors = async () => {
    try {
        const q = query(
            collection(db, 'author'),
            orderBy('created_at', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const list: Author[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Author[];
        return list;
    } catch (error) {
        console.error('Error fetching authors:', error);
        return [];
    }
};

export const addAuthor = async (authorData: Omit<Author, 'id'>) => {
    try {
        const newAuthorRef = await addDoc(collection(db, 'author'), {
            author_name: authorData.author_name,
            type: authorData.type,
            image: authorData.image,
            description: authorData.description,
            created_at: new Date(),  
        });

        return {
            id: newAuthorRef.id,  
            ...authorData,
        };
    } catch (error) {
        console.error('Error adding author:', error);
        throw new Error('Failed to add author');
    }
};

export const updateAuthor = async (id: string, authorData: Omit<Author, 'id'>): Promise<Author> => {
    try {
        const authorRef = doc(db, 'author', id);

        await updateDoc(authorRef, {
            author_name: authorData.author_name,
            type: authorData.type,
            image: authorData.image,
            description: authorData.description,
        });

        return { id, ...authorData };
    } catch (error) {
        console.error('Error updating author: ', error);
        throw new Error('Unable to update author');
    }
};

// Vendor
export const getVendors = async () => {
    try {
        const q = query(
            collection(db, 'vendor'),
            orderBy('created_at', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const list: Vendor[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Vendor[];
        return list;
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return [];
    }
};

export const addVendor = async (vendorData: Omit<Vendor, 'id'>) => {
    try {
        const newVendorRef = await addDoc(collection(db, 'vendor'), {
            vendor_name: vendorData.vendor_name,
            type: vendorData.type,
            image: vendorData.image,
            created_at: new Date(),  
        });

        return {
            id: newVendorRef.id,  
            ...vendorData,
        };
    } catch (error) {
        console.error('Error adding author:', error);
        throw new Error('Failed to add author');
    }
};

export const updateVendor = async (id: string, vendorData: Omit<Vendor, 'id'>): Promise<Vendor> => {
    try {
        const vendorRef = doc(db, 'vendor', id);

        await updateDoc(vendorRef, {
            vendor_name: vendorData.vendor_name,
            type: vendorData.type,
            image: vendorData.image,
        });

        return { id, ...vendorData };
    } catch (error) {
        console.error('Error updating vendor: ', error);
        throw new Error('Unable to update vendor');
    }
};

// Cloudinary
export const uploadToCloudinary = async (file: File, fileType: 'image' | 'raw') => {
    const CLOUD_NAME = 'dp6hjihhh';
    const UPLOAD_PRESET = '_BookApp';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${fileType}/upload`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
        console.error("Cloudinary upload error:", data);
        throw new Error(data.error?.message || "Upload failed");
    }

    return data.secure_url;
};

export const getBooksByAuthorId = async (authorId: string) => {
    try {
        const booksRef = collection(db, "book");
        const q = query(booksRef, where("author_id", "==", authorId));

        const querySnapshot = await getDocs(q);

        const books = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }) as Book);

        return books;
    } catch (error) {
        console.error("Lỗi khi lấy sách theo author_id:", error);
        return [];
    }
}