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
    node: 'https://fdd6cbf8132442fd8692e814f3084e09.us-central1.gcp.cloud.es.io:443',
    auth: {
        apiKey: "NjgyS3lwWUJhc3BOZ2JGNDE4Z186Q1BJbGNpb2tmQW9sRnRCQWdBajRnUQ=="
    }
});

const db = getFirestore(firebaseAdminApp);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const bulkOps: BulkOperation[] = [];

        if (body.operation === 'delete' && body.docId) {
            bulkOps.push({ delete: { _index: 'book-app', _id: body.docId } });
        } else if (body.operation === 'update' && body.docId && body.book_name && body.author) {
            bulkOps.push({ update: { _index: 'book-app', _id: body.docId } });
            bulkOps.push({ doc: { book_name: body.book_name, author: body.author } });
        } else {
            const snapshot = await db.collection('book').get();
            for (const doc of snapshot.docs) {
                const data = doc.data();

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

                bulkOps.push({ index: { _index: 'book-app', _id: doc.id } });
                bulkOps.push({
                    book_name: data.book_name || '',
                    author: authorName,
                });
            }
        }

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
