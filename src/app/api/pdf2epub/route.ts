import { NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
    cloud_name: 'dp6hjihhh',
    api_key: '534783536861938',
    api_secret: 'l_wJ7ckZ7pg7iO5Ak0VFZeaZw4I'
});

const cloudConvert = new CloudConvert('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYmQ1NWVlN2RlMWRiM2ExMTE0YWYwMTQ2MDg0OGYzYWE0NzUzNDhhYmUyOTliNTZlNDg2NjQ4MjE0NTYxNDIxMDk5OGMyN2IzNmM1NDVkZTciLCJpYXQiOjE3NDY4MTMyNjEuMzI5NTg5LCJuYmYiOjE3NDY4MTMyNjEuMzI5NTksImV4cCI6NDkwMjQ4Njg2MS4zMjUwMDgsInN1YiI6IjcxODc5ODQ2Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInVzZXIud3JpdGUiLCJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIiwid2ViaG9vay5yZWFkIiwid2ViaG9vay53cml0ZSIsInByZXNldC5yZWFkIiwicHJlc2V0LndyaXRlIl19.ow7D4GKMIdSanUDsj9KgwKQTjCv8ZBuCJyHX7UxWAnP53HxHmIODaGfAzv8BfoZ8WeJTNR9X5R_5AGg2-D1YE_Hm7oJs9bo_h50fhdi3pxzEwY8RfdF9XPYfBxY3rgEQKWP5AXmyPkEieo8HGV1IYqfqChLP3lvqlqL97smw3pu0N3qP-O-aTj8WEjouqiXdhgoos02dvX8H2w496mANj1QZND2hd4Gfh4hqz2FXKiUbtXbJm3w8eUkighbuPXjInNmFY1AnkKT5Z28BF_iePQILP2EPag0gIV_ad8WQjB8Yoooy2dTjK2LRwLVeQeFqFbXi4CMdv7P5L38Muitsh0nppIN4KRGMvd0cKwA5IZ9H45zJLX4yQzZo-qgzAUL6sja5wxTwzFcaYRQo438nTMZdoiqbxu0jBQuSZbbDWvmtQRIKg2HNn3Da5SIH7GY5qd9gbkL9nSv2P-NAx7Fr_96FITV-hNnFi41hE7qVF4AINOoo87ndtOCayAADupmwhYP1cFgFKGf8PU7RumYlKO2Xkw_6-byem0CMu--OMNydud-eIYczKgoKT8B-dvupQtA8jr67QG_0cytTh1l3IlTi8DeupQJj_TGF4VOl_9cDu7dvvnTwR40-9scpOKf1Sodn5SzFgp2r87Mp0Ex8chlO8R42JhOoHr_CCPG4Kt4')

const downloadFile = async(url: string, outputPath: string): Promise<void> => {
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

        if (exportUrl) await downloadFile(exportUrl, outputPath);

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