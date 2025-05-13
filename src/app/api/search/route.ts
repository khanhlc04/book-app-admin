import { NextRequest } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const client = new Client({
    node: 'https://fdd6cbf8132442fd8692e814f3084e09.us-central1.gcp.cloud.es.io:443',
    auth: {
        apiKey: "NjgyS3lwWUJhc3BOZ2JGNDE4Z186Q1BJbGNpb2tmQW9sRnRCQWdBajRnUQ=="
    }
});

export async function GET(request: NextRequest) {
    try {
        const query = request.nextUrl.searchParams.get('query');

        if (!query) {
            return new Response(JSON.stringify({ message: 'Query is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await client.search({
            index: 'book-app',
            body: {
                // @ts-expect-error: Bỏ qua lỗi kiểm tra kiểu do client search không nhận đúng kiểu
                query: {
                    bool: {
                        should: [
                            {
                                prefix: {
                                    "book_name.keyword": {
                                        value: query,
                                        boost: 5
                                    }
                                }
                            },
                            {
                                match_phrase_prefix: {
                                    book_name: {
                                        query: query,
                                        boost: 3
                                    }
                                }
                            },
                            {
                                match_phrase_prefix: {
                                    author: {
                                        query: query,
                                        boost: 1
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });

        return new Response(JSON.stringify(result.hits.hits), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}