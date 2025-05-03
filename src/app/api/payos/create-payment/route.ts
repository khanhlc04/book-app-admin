import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

const PAYOS_API_KEY = 'bbf12ca0-9ad7-4d6f-90b9-50d4d367bc37';
const CLIENT_ID = 'b4085e93-8cf6-4e9c-b1d5-d3351a714ddd';
const CHECKSUM_KEY = 'e6f2e8420d3f5dfd517c8492c295e5c78da821b6116e3b63d4d4f3f8c2d2a0fb';

export async function POST(req: Request) {
    try {
        const { amount, description } = await req.json();

        if (!amount || !description) {
            return NextResponse.json({ error: 'Thiếu amount hoặc description' }, { status: 400 });
        }

        const orderCode = Math.floor(Math.random() * 1000000);
        const returnUrl = "https://payos-backend.vercel.app/api/payos/success";
        const cancelUrl = "https://payos-backend.vercel.app/api/payos/cancel";

        const rawData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = crypto.createHmac("sha256", CHECKSUM_KEY).update(rawData).digest("hex");

        const body = {
            orderCode,
            amount,
            description,
            returnUrl,
            cancelUrl,
            signature
        };

        const response = await axios.post("https://api-merchant.payos.vn/v2/payment-requests", body, {
            headers: {
                "Content-Type": "application/json",
                "x-client-id": CLIENT_ID,
                "x-api-key": PAYOS_API_KEY
            }
        });

        return NextResponse.json(response.data);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Lỗi khi tạo link thanh toán: ", error.message);
            return NextResponse.json({
                error: "Không tạo được link thanh toán",
                details: error.message
            }, { status: 500 });
        } else {
            console.error("Lỗi không xác định:", error);
            return NextResponse.json({
                error: "Lỗi không xác định khi tạo link thanh toán"
            }, { status: 500 });
        }
    }
    
}
