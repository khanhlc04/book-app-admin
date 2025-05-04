import { NextRequest } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const client = new Client({
    node: 'https://book-app-a10cb9.es.us-east-1.aws.elastic.cloud:443',
    auth: {
        apiKey: 'cEY4bVRaWUJWTHMzdkpiUTVpLTE6TG5rcEtOYVlDZTEtbHRUeW1TZFVoZw=='
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
            index: 'search-b3fu',
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
                                wildcard: {
                                    author: {
                                        value: query + '*',
                                        boost: 0.5
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
