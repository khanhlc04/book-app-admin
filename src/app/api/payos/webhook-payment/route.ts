import { NextResponse } from 'next/server';
import axios from 'axios';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseAdminApp } from '@/lib/firebase-admin';
import { updateBookBuyed } from '@/app/service';

interface paymentInfo {
    userId: string;
    bookId: string;
}

const db = getFirestore(firebaseAdminApp);

const getPaymentInfoFromPayOS = async (transactionId: string) => {
    const PAYOS_API_KEY = 'bbf12ca0-9ad7-4d6f-90b9-50d4d367bc37';
    const CLIENT_ID = 'b4085e93-8cf6-4e9c-b1d5-d3351a714ddd';

    const response = await axios.get(
        `https://api-merchant.payos.vn/v2/payment-requests/${transactionId}`,
        {
            headers: {
                'x-client-id': CLIENT_ID,
                'x-api-key': PAYOS_API_KEY
            }
        }
    );

    return response.data.data;
}

const removeFromCart = async (userId: string, bookId: string) => {
    try {
        const cartRef = db.collection('cart').doc(userId);
        const cartDoc = await cartRef.get();

        if (cartDoc.exists) {
            await cartRef.update({
                bookIds: FieldValue.arrayRemove(bookId)
            });
        } else {
            console.log('No books found in cart for this user');
        }
    } catch (error) {
        console.error('Error removing book from cart:', error);
    }
}

const createUserBookRecord = async(paymentInfo: paymentInfo) => {
    const { userId, bookId } = paymentInfo;
    const userBooksRef = db.collection('user_books').doc(userId);
    const userBookDoc = await userBooksRef.get();

    if (userBookDoc.exists) {
        const userBooksData = userBookDoc.data();
        if (!userBooksData?.books?.includes(bookId)) {
            await userBooksRef.update({
                books: FieldValue.arrayUnion(bookId)
            });
        }
    } else {
        await userBooksRef.set({ books: [bookId] });
    }

    await removeFromCart(userId, bookId);

    await updateBookBuyed(bookId);
}

const updateTransactionStatus = async(transactionId: string, status: string) => {
    const snapshot = await db
        .collection('transaction')
        .where('orderCode', '==', transactionId)
        .get();

    if (snapshot.empty) return;

    await Promise.all(
        snapshot.docs.map(async (doc) => {
            const docData = doc.data();
            await doc.ref.update({ status });

            if (status === 'PAID') {
                await createUserBookRecord(docData as paymentInfo);
            }
        })
    );
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { success, data } = body;

        if (!success) return NextResponse.json({ success: true });

        const transactionId = data.orderCode;
        const paymentInfo = await getPaymentInfoFromPayOS(transactionId);

        await updateTransactionStatus(transactionId, paymentInfo.status);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Lỗi webhook:', error);
        return NextResponse.json({ error: 'Xử lý webhook thất bại' }, { status: 500 });
    }
}