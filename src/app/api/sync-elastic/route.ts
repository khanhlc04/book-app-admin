import { NextResponse } from 'next/server';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../../../serviceAccountKey.json'; // Điều chỉnh alias nếu cần
import { Client } from '@elastic/elasticsearch';
import { getApp, getApps } from 'firebase/app';

type BulkOperation =
  | { index: { _index: string; _id: string } }
  | { book_name: string; author: string };


const elasticsearch = new Client({
    node: 'https://book-app-a10cb9.es.us-east-1.aws.elastic.cloud:443',
    auth: {
        apiKey: 'cEY4bVRaWUJWTHMzdkpiUTVpLTE6TG5rcEtOYVlDZTEtbHRUeW1TZFVoZw=='
    }
});

// Khởi tạo Firebase Admin nếu chưa có
const firebaseApp =
    getApps().length === 0
        ? initializeApp({
            credential: cert(serviceAccount as ServiceAccount),
        }, 'book-app')
        : getApp('book-app');

const db = getFirestore(firebaseApp);

export async function POST() {
    try {
        const snapshot = await db.collection('book').get();
        const bulkOps: BulkOperation[] = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Lấy tên tác giả
            let authorName = 'Unknown';
            if (data.author_id) {
                try {
                    const authorDoc = await db.collection('author').doc(data.author_id).get();
                    if (authorDoc.exists) {
                        const authorData = authorDoc.data();
                        authorName = authorData?.author_name || 'Unknown';
                    }
                } catch (err) {
                    console.error(`Lỗi khi lấy tác giả cho sách ${doc.id}:`, err);
                }
            }

            // Thêm vào batch
            bulkOps.push({ index: { _index: 'search-b3fu', _id: doc.id } });
            bulkOps.push({
                book_name: data.book_name || '',
                author: authorName,
            });
        }

        // Đẩy dữ liệu lên Elasticsearch
        if (bulkOps.length > 0) {
            const result = await elasticsearch.bulk({ body: bulkOps });
            return NextResponse.json({
                message: 'Đồng bộ thành công',
                documents_indexed: result.items.length,
            });
        } else {
            return NextResponse.json({ message: 'Không có sách nào để đồng bộ' });
        }
    } catch (error) {
        console.error('🔥 Lỗi đồng bộ sách:', error);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu' }, { status: 500 });
    }
}
