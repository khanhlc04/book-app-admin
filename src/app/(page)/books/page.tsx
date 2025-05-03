'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { Book } from '@/app/constants/interface';
import { getBooks } from '@/app/service';
import BookModal from '@/app/components/BookModal';

export default function BookListPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    const fetchData = async () => {
        const data = await getBooks();
        setBooks(data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (id: string) => {
        const bookToEdit = books.find(book => book.id === id);
        if (bookToEdit) {
            setSelectedBook(bookToEdit);
            setIsModalOpen(true);
        }
    };

    const handleDelete = (id: string) => {
        console.log('Delete book with ID:', id);
        // TODO: Gọi API xóa và cập nhật lại danh sách
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedBook(null);
    };

    const handleModalSubmit = () => {
        fetchData();
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#00ADEF]">Books Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Book
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                    <div
                        key={book.id}
                        className="bg-white p-4 rounded shadow hover:shadow-md transition"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-16 h-16 relative rounded overflow-hidden">
                                <Image
                                    src={book.poster}
                                    alt={book.book_name}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(book.id)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(book.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-lg font-bold">{book.book_name}</h2>

                            {/* Nút mở PDF */}
                            {book.file_pdf && (
                                <a
                                    href={book.file_pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block text-[red] hover:underline text-sm"
                                >
                                    Link PDF
                                </a>
                            )}

                            {book.file_epub && (
                                <a
                                    href={book.file_epub}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block text-blue-600 hover:underline text-sm ml-[10px]"
                                >
                                    Link Epub
                                </a>
                            )}

                            {/* Giá tiền */}
                            <p className="text-sm text-green-600 font-semibold mt-1">
                                {book.cost ? `${book.cost} VND` : 'Free'}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">{book.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {book.type.map((type, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                                    >
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BookModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                initialData={selectedBook}
            />
        </div>
    );
}
