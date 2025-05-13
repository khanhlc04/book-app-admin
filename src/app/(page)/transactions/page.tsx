'use client';

import { useEffect, useState } from 'react';
import { getBookById, getRoleById, getTransactions } from '@/app/service';
import { Transaction } from '@/app/constants/interface';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/firebaseConfig';
import Swal from 'sweetalert2';

export default function TransactionListPage() {
    const router = useRouter();

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [bookNames, setBookNames] = useState<{ [bookId: string]: string }>({});

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const role = await getRoleById(user.uid);

                if (!role || role.role !== "admin") {
                    Swal.fire('Oops!', 'Bạn không có quyền truy cập trang web.');
                    router.push("/");
                } else {
                    fetchTransactionData();
                }
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchTransactionData = async () => {
        const txData = await getTransactions();
        setTransactions(txData);

        const uniqueBookIds = [...new Set(txData.map(tx => tx.bookId))];

        const bookNameMap: { [bookId: string]: string } = {};

        await Promise.all(
            uniqueBookIds.map(async (id) => {
                const book = await getBookById(id);
                if (book) {
                    bookNameMap[id] = book.book_name;
                }
            })
        );

        setBookNames(bookNameMap);
    };

    return (
        <>
            {isLoading &&
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-[#00ADEF]">Transactions Management</h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {transactions.map((tx: Transaction) => (
                            <div key={tx.id} className="bg-white p-4 rounded shadow hover:shadow-md transition">
                                <div className="mt-1">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">UID:</span> {tx.userId}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Book:</span>{' '}
                                        {bookNames[tx.bookId] || tx.bookId}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Amount:</span> {tx.amount} VND
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Status:</span>{' '}
                                        <span className={`font-semibold ${tx.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {tx.status}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Description:</span> {tx.description}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Created At:</span>{' '}
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </p>
                                    <Link
                                        href={tx.checkoutUrl}
                                        target="_blank"
                                        className="text-blue-600 hover:underline text-sm inline-block mt-2"
                                    >
                                        View Checkout
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </>
    );
}