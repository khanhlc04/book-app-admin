import { NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import cloudinary from 'cloudinary';

// Cấu hình Cloudinary
cloudinary.v2.config({
    cloud_name: 'dp6hjihhh',
    api_key: '534783536861938',
    api_secret: 'l_wJ7ckZ7pg7iO5Ak0VFZeaZw4I'
});

// Tạo CloudConvert instance
const cloudConvert = new CloudConvert('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDcyN2FkNjUzNmY2YmQwYWE4MDQ2OTNmMzczNjNiZjI0OWM4OWYxOWY2ZDBjMGJiOWU5MDdhYTE4NTMzMzNjMDQ0OTMxYTQ0ZmJjZjVlMzYiLCJpYXQiOjE3NDYzNDgzMjAuNzE4MDI1LCJuYmYiOjE3NDYzNDgzMjAuNzE4MDI2LCJleHAiOjQ5MDIwMjE5MjAuNzExNDkxLCJzdWIiOiI3MTgyMTUwNiIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.n_TwEOhKI4cUSaNexC-hhQSJYtCXw_Qlf-2UazsF6_GEJX7_IoTQahmEwNXcDHUWW8VeXkPfopGY42-kdj6l8HHsvKBoI80FDcrlFRzDcOdo2c7QqPD6ChriZLBg6rdiqn9kzZFgVXuHk_ROoyToRhtncbWiJ9uKNDrDwx03EnIbg7MPUi3cYD59sybFncsfhStTmgX5V631kBOH0dNiBdy6AxPeH--8Yhj9mx7sTfisM9L4OMEYFHM0cacSP9nurPqTtP8FW6fkEm6_gMV5vg7XqhkUOJ7TUWkkaRX9R6rlm5ub5PieMG7CP7JFc-RT9dTdDLOOtKZugCtsjSuxWkIZTqsDWdPdocv1IqUbvYya41KbSoV9tmEc-5BVaH-5PHkDvxLutdW5JCSWZjrqGXZR8ekg0zCoLBmTgj3eCzfjfgnozrViYx6R6wFnB5OVjEX9RgL3OkwZ2fxuNYzdZ5kOPFTvYFQ-IFcjfzRnyQqoz02zyel7mrnjRxcq9E3XU_SunYKJjanMclmzrRCbPPds7WdrTFs7aqmvY3WfGUSNCB3mfhWsXJWoOamkeVVsRsU7bg_fHWTNqKnvGO1V0zXywl_ePfly8O9L7rM4LJqIgfEdiuP1Ao6qLV0qK6tdT7u-WXaDgrVlJzB4Nli7wbLJ9Z3lonAmVOlXBXrVt0Q')
async function downloadFile(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);

        https.get(url, (response) => {
            response.pipe(file);

            file.on('finish', () => {
                file.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => { });
            reject(err);
        });
    });
}


export async function POST(req: Request): Promise<Response> {
    const body = await req.json();
    const { pdfUrl } = body;

    if (!pdfUrl) {
        return NextResponse.json({ error: 'Thiếu link PDF.' }, { status: 400 });
    }

    try {
        const tempId = uuidv4();
        const tempDir = '/tmp';
        const outputPath = path.join(tempDir, `${tempId}.epub`);

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        let job = await cloudConvert.jobs.create({
            tasks: {
                'import-my-file': {
                    operation: 'import/url',
                    url: pdfUrl
                },
                'convert-my-file': {
                    operation: 'convert',
                    input: 'import-my-file',
                    output_format: 'epub',
                },
                'export-my-file': {
                    operation: 'export/url',
                    input: 'convert-my-file'
                }
            }
        });

        job = await cloudConvert.jobs.wait(job.id);
        const exportTask = job.tasks.find((task: { name?: string }) => task.name === 'export-my-file');

        if (!exportTask || !exportTask.result?.files?.length) {
            return NextResponse.json({ error: 'Không thể xuất file.' }, { status: 500 });
        }

        const exportUrl = exportTask.result.files[0].url;
        if (exportUrl)
            await downloadFile(exportUrl, outputPath);

        let result;
        try {
            result = await cloudinary.v2.uploader.upload(outputPath, {
                resource_type: 'raw',
                folder: 'epub_files'
            });
        } finally {
            fs.unlink(outputPath, (err) => {
                if (err) console.error('Lỗi xóa file:', err);
            });
        }

        return NextResponse.json({
            filename: `${tempId}.epub`,
            cloudinary_url: result.secure_url,
            mime: 'application/epub+zip'
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Lỗi:', error.message);
            return NextResponse.json({ error: 'Chuyển đổi thất bại.' }, { status: 500 });
        } else {
            console.error('Lỗi không xác định:', error);
            return NextResponse.json({ error: 'Chuyển đổi thất bại.' }, { status: 500 });
        }
    }

}
