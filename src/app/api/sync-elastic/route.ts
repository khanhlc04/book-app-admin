import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { Client } from '@elastic/elasticsearch';
import { firebaseAdminApp } from '@/lib/firebase-admin';

type BulkOperation =
    | { index: { _index: string; _id: string } }
    | { delete: { _index: string; _id: string } }
    | { update: { _index: string; _id: string } }
    | { doc: { book_name: string; author: string } }
    | { book_name: string; author: string }; 


const elasticsearch = new Client({
    node: 'https://book-app-a10cb9.es.us-east-1.aws.elastic.cloud:443',
    auth: {
        apiKey: 'cEY4bVRaWUJWTHMzdkpiUTVpLTE6TG5rcEtOYVlDZTEtbHRUeW1TZFVoZw==' // Đảm bảo bảo mật API key
    }
});

const db = getFirestore(firebaseAdminApp);

export async function POST(request: Request) {
    try {
        const body = await request.json();  // Nhận thông tin từ client
        const bulkOps: BulkOperation[] = [];

        if (body.operation === 'delete' && body.docId) {
            // Nếu yêu cầu xóa
            bulkOps.push({ delete: { _index: 'search-b3fu', _id: body.docId } });
        } else if (body.operation === 'update' && body.docId && body.book_name && body.author) {
            // Nếu yêu cầu cập nhật
            bulkOps.push({ update: { _index: 'search-b3fu', _id: body.docId } });  // Dòng 1: metadata
            bulkOps.push({ doc: { book_name: body.book_name, author: body.author } });  // Dòng 2: dữ liệu            
        } else {
            // Thêm mới
            const snapshot = await db.collection('book').get();
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
        console.error('Lỗi đồng bộ sách:', error);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu' }, { status: 500 });
    }
}
