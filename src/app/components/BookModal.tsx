'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Book, Author, Vendor } from '../constants/interface';
import { addBook, getAuthors, getVendors, updateBook, uploadToCloudinary } from '../service';
import AuthorModal from './AuthorModal';
import VendorModal from './VendorModal';
import Swal from 'sweetalert2';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    initialData?: Book | null;
};

export default function BookModal({ isOpen, onClose, onSubmit, initialData }: Props) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<Book>({
        defaultValues: {
            id: '',
            book_name: '',
            description: '',
            poster: '',
            cost: 0,
            file_pdf: '',
            type: [],
            author_id: '',
            vendor_id: ''
        },
    });

    const [loading, setLoading] = useState(false);

    const [posterFile, setPosterFile] = useState<File | null>(null);

    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const [authors, setAuthors] = useState<Author[]>([]); 
    
    const [vendors, setVendors] = useState<Vendor[]>([]);

    const [isAuthorModalOpen, setAuthorModalOpen] = useState(false);  

    const [isVendorModalOpen, setVendorModalOpen] = useState(false); 

    const poster = watch('poster');
    const type = watch('type');

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                id: '',
                book_name: '',
                description: '',
                poster: '',
                cost: 0,
                file_pdf: '',
                type: [],
                author_id: '',
                vendor_id: '',
            });
        }

        const fetchAuthors = async () => {
            try {
                const authors = await getAuthors();
                setAuthors(authors);

                const vendors = await getVendors();
                setVendors(vendors);
            } catch (error) {
                console.error("Error fetching authors:", error);
            }
        };
        fetchAuthors();
    }, [initialData, reset]);

    const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPosterFile(file);
            setValue('poster', URL.createObjectURL(file));
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPdfFile(file);
            setValue('file_pdf', file.name);
        }
    };

    const handleCheckboxChange = (value: string) => {
        const currentTypes = type || [];
        const newTypes = currentTypes.includes(value)
            ? currentTypes.filter(t => t !== value)
            : [...currentTypes, value];
        setValue('type', newTypes);
    };

    const onFormSubmit = async (data: Book) => {
        setLoading(true);
        try {
            let posterUrl = data.poster;
            let pdfUrl = data.file_pdf;
            let epubUrl = '';

            if (posterFile) {
                posterUrl = await uploadToCloudinary(posterFile, 'image');
            }

            if (pdfFile) {
                pdfUrl = await uploadToCloudinary(pdfFile, 'raw');

                const epubRes = await fetch('/api/pdf2epub', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ pdfUrl })
                });

                if (!epubRes.ok) {
                    throw new Error('Chuyển đổi EPUB thất bại');
                }

                const epubData = await epubRes.json();
                epubUrl = epubData.cloudinary_url; 
            }

            const payload = {
                ...data,
                cost: Number(data.cost),
                poster: posterUrl,
                file_pdf: pdfUrl,
                file_epub: epubUrl
            };

            if (data.id) {
                await updateBook(data.id, payload);
                Swal.fire('Updated Successfull!', 'The book has been updated.', 'success');  
            } else {
                await addBook(payload);  
                Swal.fire('Added Successfull!', 'The book has been added.', 'success');  
            }

            const syncRes = await fetch('/api/sync-elastic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ operation: data.id ? 'update' : 'create' })
            });

            if (!syncRes.ok) {
                throw new Error('Lỗi đồng bộ với Elasticsearch');
            }

            setPosterFile(null);

            setPdfFile(null);
            
            reset();

            onSubmit();

            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog 
                as="div" 
                className="relative z-50" 
                onClose={() => {setPosterFile(null);
                    setPdfFile(null); 
                    onClose();
                }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center px-4 py-6 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-100"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title className="text-lg font-medium">
                                    {initialData ? 'Edit Book' : 'Add Book'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Book Name"
                                        className="w-full border rounded p-2"
                                        {...register('book_name', { required: true })}
                                    />
                                    {errors.book_name && <p className="text-sm text-red-500">Book name is required</p>}

                                    <textarea
                                        placeholder="Description"
                                        className="w-full border rounded p-2"
                                        rows={3}
                                        {...register('description', { required: true })}
                                    />
                                    {errors.description && <p className="text-sm text-red-500">Description is required</p>}

                                    <input
                                        type="number"
                                        placeholder="Cost"
                                        className="w-full border rounded p-2"
                                        {...register('cost', { required: true, min: 0 })}
                                    />
                                    {errors.cost && <p className="text-sm text-red-500">Cost is required</p>}

                                    <div className="space-y-2">
                                        <label className="block text-sm">Author</label>
                                        <select
                                            {...register('author_id', { required: true })}
                                            className="w-full border rounded p-2"
                                        >
                                            <option value="">Select Author</option>
                                            {authors.map((author) => (
                                                <option key={author.id} value={author.id}>
                                                    {author.author_name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setAuthorModalOpen(true)}
                                            className="text-blue-500 mt-2"
                                        >
                                            Add Author
                                        </button>
                                    </div>

                                    <AuthorModal
                                        isOpen={isAuthorModalOpen}
                                        onClose={() => setAuthorModalOpen(false)}
                                        onSubmit={() => { console.log('hi') }}
                                    />

                                    <div className="space-y-2">
                                        <label className="block text-sm">Vendor</label>
                                        <select
                                            {...register('vendor_id', { required: true })}
                                            className="w-full border rounded p-2"
                                        >
                                            <option value="">Select Vendor</option>
                                            {vendors.map((vendor) => (
                                                <option key={vendor.id} value={vendor.id}>
                                                    {vendor.vendor_name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setAuthorModalOpen(true)}
                                            className="text-blue-500 mt-2"
                                        >
                                            Add Vendor
                                        </button>
                                    </div>

                                    <VendorModal
                                        isOpen={isVendorModalOpen}
                                        onClose={() => setVendorModalOpen(false)}
                                        onSubmit={() => { console.log('hi') }}
                                    />

                                    <div className="space-y-2">
                                        <label className="block text-sm">Upload Poster</label>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                                            onClick={() => document.getElementById('posterInput')?.click()}
                                        >
                                            Choose Poster
                                        </button>
                                        <input
                                            id="posterInput"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePosterChange}
                                        />
                                        {poster && (
                                            <img src={poster} alt="Poster" className="mt-2 w-32 h-32 object-cover rounded" />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm">Upload PDF</label>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                                            onClick={() => document.getElementById('pdfInput')?.click()}
                                        >
                                            Choose PDF
                                        </button>
                                        <input
                                            id="pdfInput"
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={handlePdfChange}
                                        />
                                        {pdfFile && (
                                            <p className="text-sm mt-2 text-gray-600">{pdfFile.name}</p>
                                        )}
                                        {initialData?.file_pdf && !pdfFile && (
                                            <p className="text-sm mt-2 text-gray-600">{initialData?.book_name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm">Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Novels', 'Self Love', 'Science', 'Romantic'].map(option => (
                                                <label key={option} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        value={option}
                                                        checked={type?.includes(option)}
                                                        onChange={() => handleCheckboxChange(option)}
                                                        className="accent-blue-600"
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                reset();
                                                setPdfFile(null);
                                                setPosterFile(null);
                                                onClose();
                                            }}
                                            className="px-4 py-2 border rounded text-gray-600">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}