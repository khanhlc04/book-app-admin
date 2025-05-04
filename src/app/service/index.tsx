import { addDoc, collection, deleteDoc, doc, getCountFromServer, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Author, Book } from "../constants/interface";

export const getTotalAuthors = async () => {
    const snapshot = await getCountFromServer(collection(db, 'author'));
    return snapshot.data().count;
};

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
        // Thêm tác giả vào Firestore
        const newAuthorRef = await addDoc(collection(db, 'author'), {
            author_name: authorData.author_name,
            type: authorData.type,
            image: authorData.image,
            description: authorData.description,
            created_at: new Date(),  // Thêm trường created_at để ghi nhận thời gian tạo
        });

        // Trả về tác giả với ID tự động được tạo từ Firestore
        return {
            id: newAuthorRef.id,  // ID tự động được Firebase gán
            ...authorData,
        };
    } catch (error) {
        console.error('Error adding author:', error);
        throw new Error('Failed to add author');
    }
};

export const updateAuthor = async (id: string, authorData: Omit<Author, 'id'>): Promise<Author> => {
    try {
        // Lấy document cụ thể từ Firestore bằng id
        const authorRef = doc(db, 'author', id);

        // Cập nhật dữ liệu của tác giả
        await updateDoc(authorRef, {
            author_name: authorData.author_name,
            type: authorData.type,
            image: authorData.image,
            description: authorData.description,
        });

        // Trả về dữ liệu đã cập nhật (có thể là dữ liệu cũ hoặc mới tùy yêu cầu của bạn)
        return { id, ...authorData };
    } catch (error) {
        console.error('Error updating author: ', error);
        throw new Error('Unable to update author');
    }
};

export const deleteAuthor = async (id: string) => {
    try {
        const authorRef = doc(db, 'author', id);
        await deleteDoc(authorRef);
        return id;  // Trả lại id tác giả đã bị xóa
    } catch (error) {
        console.error('Error deleting author:', error);
        throw new Error('Failed to delete author');
    }
};

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
        // Thêm sách vào Firestore
        const newBookRef = await addDoc(collection(db, 'book'), {
            book_name: bookData.book_name,
            description: bookData.description,
            poster: bookData.poster,
            cost: bookData.cost,
            file_pdf: bookData.file_pdf,
            file_epub: bookData.file_epub,
            type: bookData.type,
            author_id: bookData.author_id,
            created_at: new Date(),  // Thêm trường created_at để ghi nhận thời gian tạo
        });

        // Trả về sách với ID tự động được tạo từ Firestore
        return {
            id: newBookRef.id,  // ID tự động được Firebase gán
            ...bookData,
        };
    } catch (error) {
        console.error('Error adding book:', error);
        throw new Error('Failed to add book');
    }
};

export const updateBook = async (id: string, bookData: Omit<Book, 'id'>): Promise<Book> => {
    try {
        // Lấy document cụ thể từ Firestore bằng id
        const bookRef = doc(db, 'book', id);

        // Cập nhật dữ liệu của sách
        await updateDoc(bookRef, {
            book_name: bookData.book_name,
            description: bookData.description,
            poster: bookData.poster,
            cost: bookData.cost,
            file_pdf: bookData.file_pdf,
            file_epub: bookData.file_epub,
            type: bookData.type,
            author_id: bookData.author_id,
        });

        // Trả về dữ liệu đã cập nhật
        return { id, ...bookData };
    } catch (error) {
        console.error('Error updating book:', error);
        throw new Error('Unable to update book');
    }
};

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