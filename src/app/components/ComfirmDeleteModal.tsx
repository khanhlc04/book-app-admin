import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm }: Props) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="max-w-sm w-full bg-white rounded shadow p-6">
                        <Dialog.Title className="text-lg font-bold">Confirm Delete</Dialog.Title>
                        <p className="mt-2 text-gray-600">Are you sure you want to delete this author?</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600">
                                Cancel
                            </button>
                            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">
                                Delete
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
}
