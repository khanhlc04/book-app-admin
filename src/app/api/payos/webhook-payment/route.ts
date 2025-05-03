import { NextResponse } from 'next/server';
import axios from 'axios';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import serviceAccount from '../../../../../serviceAccountKey.json'; // điều chỉnh đường dẫn nếu cần
import { getApp, getApps } from 'firebase/app';

interface paymentInfo {
    userId: string;
    bookId: string;
}

// Khởi tạo ứng dụng Firebase
let firebaseApp;

try {
    firebaseApp = getApp('book-app');
} catch (error) {
    firebaseApp = initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
    }, 'book-app');
}
const db = getFirestore(firebaseApp);

// Gọi PayOS để lấy thông tin giao dịch
async function getPaymentInfoFromPayOS(transactionId: string) {
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

// Ghi sách vào kho người dùng nếu thanh toán thành công
async function createUserBookRecord(paymentInfo: paymentInfo) {
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
}

// Cập nhật trạng thái giao dịch
async function updateTransactionStatus(transactionId: string, status: string) {
    const snapshot = await db
        .collection('transaction')
        .where('orderCode', '==', transactionId)
        .get();

    if (snapshot.empty) return;

    snapshot.forEach(async (doc) => {
        const docData = doc.data();
        await doc.ref.update({ status });

        if (status === 'PAID') {
            await createUserBookRecord(docData as paymentInfo);
        }
    });
}

// Webhook Handler
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
        console.error('🔥 Lỗi webhook:', error);
        return NextResponse.json({ error: 'Xử lý webhook thất bại' }, { status: 500 });
    }
}
