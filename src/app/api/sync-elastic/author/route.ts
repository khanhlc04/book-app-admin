import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { Client } from '@elastic/elasticsearch';
import { firebaseAdminApp } from '@/lib/firebase-admin';

type BulkOperation =
    | { index: { _index: string; _id: string } }
    | { delete: { _index: string; _id: string } }
    | { update: { _index: string; _id: string } }
    | { doc: { author_name: string } }
    | { author_name: string };

const elasticsearch = new Client({
    node: 'https://fdd6cbf8132442fd8692e814f3084e09.us-central1.gcp.cloud.es.io:443',
    auth: {
        apiKey: 'NjgyS3lwWUJhc3BOZ2JGNDE4Z186Q1BJbGNpb2tmQW9sRnRCQWdBajRnUQ==',
    },
});

const db = getFirestore(firebaseAdminApp);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const bulkOps: BulkOperation[] = [];

        if (body.operation === 'delete' && body.docId) {
            bulkOps.push({ delete: { _index: 'author-search', _id: body.docId } });
        } else if (body.operation === 'update' && body.docId && body.author_name) {
            bulkOps.push({ update: { _index: 'author-search', _id: body.docId } });
            bulkOps.push({ doc: { author_name: body.author_name } });
        } else {
            const snapshot = await db.collection('author').get();
            for (const doc of snapshot.docs) {
                const data = doc.data();
                bulkOps.push({ index: { _index: 'author-search', _id: doc.id } });
                bulkOps.push({
                    author_name: data.author_name || 'Unknown',
                });
            }
        }

        if (bulkOps.length > 0) {
            const result = await elasticsearch.bulk({ body: bulkOps });
            return NextResponse.json({
                message: 'Đồng bộ tác giả thành công',
                documents_indexed: result.items.length,
            });
        } else {
            return NextResponse.json({ message: 'Không có tác giả nào để đồng bộ' });
        }
    } catch (error) {
        console.error('Lỗi đồng bộ tác giả:', error);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu tác giả' }, { status: 500 });
    }
}
