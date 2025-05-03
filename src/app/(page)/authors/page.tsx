'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { Author } from '@/app/constants/interface';
import { getAuthors } from '@/app/service';
import AuthorModal from '@/app/components/AuthorModal';

export default function AuthorListPage() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);  // Điều khiển trạng thái modal
    const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);  // Lưu tác giả khi chỉnh sửa

    const fetchData = async () => {
        const data = await getAuthors();
        setAuthors(data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (id: string) => {
        const authorToEdit = authors.find(author => author.id === id);
        if (authorToEdit) {
            setSelectedAuthor(authorToEdit);  // Lưu thông tin tác giả cần chỉnh sửa
            setIsModalOpen(true);  // Mở modal khi chọn chỉnh sửa
        }
    };

    const handleDelete = (id: string) => {
        console.log('Delete author with ID:', id);
        // TODO: Gọi API xóa và cập nhật state
    };

    const handleModalClose = () => {
        setIsModalOpen(false);  // Đóng modal khi nhấn "Cancel" hoặc hoàn thành hành động
        setSelectedAuthor(null); // Reset selected author
    };

    const handleModalSubmit = () => {
        fetchData();
        setIsModalOpen(false);  // Đóng modal sau khi submit
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#00ADEF]">Authors Management</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}  // Mở modal để thêm tác giả mới
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Author
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {authors.map((author) => (
                    <div
                        key={author.id}
                        className="bg-white p-4 rounded shadow hover:shadow-md transition"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-16 h-16 relative rounded overflow-hidden">
                                <Image
                                    src={author.image}
                                    alt={author.author_name}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(author.id)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(author.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-lg font-bold">{author.author_name}</h2>
                            <p className="text-sm text-gray-500">{author.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {author.type.map((t, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Add/Edit */}
            <AuthorModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                initialData={selectedAuthor}  // Truyền dữ liệu tác giả vào modal khi chỉnh sửa
            />
        </div>
    );
}
