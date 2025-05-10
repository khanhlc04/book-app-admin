'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { Vendor } from '@/app/constants/interface';
import { deleteVendor, getVendors } from '@/app/service';
import VendorModal from '@/app/components/VendorModal';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function VendorListPage() {
    const router = useRouter();

    const [vendors, setVendors] = useState<Vendor[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    const fetchVendorData = async () => {
        const data = await getVendors();
        setVendors(data);
    };

    useEffect(() => {
        if (!localStorage.getItem("token")) router.push("/");

        fetchVendorData();
    }, []);

    const handleEdit = (id: string) => {
        const vendorToEdit = vendors.find(vendor => vendor.id === id);
        if (vendorToEdit) {
            setSelectedVendor(vendorToEdit);
            setIsModalOpen(true);
        }
    };

    const handleDelete = async (id: string): Promise<void> => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'This vendor will be permanently deleted!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
            });

            if (result.isConfirmed) {
                await deleteVendor(id);
                Swal.fire('Deleted!', 'The vendor has been deleted.', 'success');
                fetchVendorData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedVendor(null);
    };

    const handleModalSubmit = () => {
        fetchVendorData();
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-[#00ADEF]">Vendors Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Vendor
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {vendors.map((vendor) => (
                    <div
                        key={vendor.id}
                        className="bg-white p-4 rounded shadow hover:shadow-md transition"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-16 h-16 relative rounded overflow-hidden">
                                <Image
                                    src={vendor.image}
                                    alt={vendor.vendor_name}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(vendor.id)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(vendor.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h2 className="text-lg font-bold">{vendor.vendor_name}</h2>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {vendor.type.map((t, idx) => (
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

            <VendorModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                initialData={selectedVendor}
            />
        </div>
    );
}