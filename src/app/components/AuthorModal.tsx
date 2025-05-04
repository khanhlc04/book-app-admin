import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Author } from '../constants/interface';
import { addAuthor, getBooksByAuthorId, updateAuthor, uploadToCloudinary } from '../service';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    initialData?: Author | null;
};

export default function AuthorModal({ isOpen, onClose, onSubmit, initialData }: Props) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<Author>({
        defaultValues: {
            id: '',
            author_name: '',
            image: '',
            type: [],
            description: '',
        },
    });

    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const image = watch('image');
    const type = watch('type');

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                id: '',
                author_name: '',
                image: '',
                type: [],
                description: '',
            });
        }
    }, [initialData, reset]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setValue('image', URL.createObjectURL(file));
        }
    };

    const onFormSubmit = async (data: Author) => {
        setLoading(true);

        try {
            let imageUrl = data.image;

            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile, 'image');
            }

            const payload = {
                ...data,
                image: imageUrl,
            };

            const previousAuthorName = initialData?.author_name;

            if (data.id) {
                // Nếu tên tác giả thay đổi, gọi API tìm kiếm sách trong Elasticsearch
                if (previousAuthorName !== data.author_name) {
                    const books = await getBooksByAuthorId(data.id);

                    for (const book of books) {
                        await fetch('/api/sync-elastic', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                operation: 'update',
                                docId: book.id,
                                book_name: book.book_name,     
                                author: data.author_name       
                            }),
                        });
                    }
                }

                await updateAuthor(data.id, payload);
            } else {
                await addAuthor(payload);
            }

            onSubmit();

            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (value: string) => {
        const currentTypes = type || [];
        const newTypes = currentTypes.includes(value)
            ? currentTypes.filter(t => t !== value)
            : [...currentTypes, value];
        setValue('type', newTypes);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title className="text-lg font-medium">
                                    {initialData ? 'Edit Author' : 'Add Author'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Author Name"
                                            className="w-full border rounded p-2"
                                            {...register('author_name', { required: true })}
                                        />
                                        {errors.author_name && (
                                            <p className="text-sm text-red-500 mt-1">Author name is required</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm">Upload Image</label>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                                            onClick={() => document.getElementById('imageInput')?.click()}
                                        >
                                            Choose Image
                                        </button>
                                        <input
                                            id="imageInput"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                        {image && (
                                            <img
                                                src={image}
                                                alt="Selected"
                                                className="mt-2 w-32 h-32 object-cover rounded"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm">Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Writer', 'Novelist', 'Journalist', 'Poet', 'Playwright'].map(option => (
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
                                        {errors.type && (
                                            <p className="text-sm text-red-500 mt-1">At least one type is required</p>
                                        )}
                                    </div>

                                    <div>
                                        <textarea
                                            placeholder="Description"
                                            className="w-full border rounded p-2"
                                            rows={3}
                                            {...register('description', { required: true })}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-500 mt-1">Description is required</p>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end gap-2">
                                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">
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