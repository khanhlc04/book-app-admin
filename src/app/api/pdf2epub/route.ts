import { NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
    cloud_name: 'dkf3nfigf',
    api_key: '858513458634873',
    api_secret: 'H_SpOo-C0kpBWAc2o8JWE2VQ-Ts'
});

const cloudConvert = new CloudConvert('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZjY2YmZlYzk1NDlkYzMxYzg4ZjI2OGEyMGFmMjdiZTA5MTllMjkzNDJhNTZkOTJlM2RmMjdiNTYxZWVjZTIwNTEwMWQ0ZmE0NzgwYzM0MGUiLCJpYXQiOjE3NDcxNTYyNDUuNDAwOTAyLCJuYmYiOjE3NDcxNTYyNDUuNDAwOTAzLCJleHAiOjQ5MDI4Mjk4NDUuMzk3NTI0LCJzdWIiOiI3MTkxNTE0MCIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.RkdwHjPAEbDqx0ngXP6ePsfHuIgEQrr0i-6XTHLtPhvumDMjiZ_BIsIeGgvnVSZc05RLm7fMV2dsSqmvtSsfWr6JM8u7fuO5L-byRLm9xnGEqz1AQyNQ227EoS9hNEqP10auJZiVT8IVylo6n1KNTK5gUAHqZZgKaF1it1viglpY0BJHoZey2r6455-egNasMG_jbQ3Amv44e9TCk4tOHZDHFxyX9KEEM7Rj4wqbdGePgMIsT2On0ZWPgVbAFLDqHbK9SHk2AlVv9z9OYS2i1tdXAdg91cVRhj_v82SGHM63Z9nE6zv-11gLsT3Ls9odVW7QtG471ekoAwL_vHR_cjDirZdTuMuhKHKqhCuowqmD4oWh6fNkANfIOK0W4e2lALx-unB_bFkBPQtj-K7XMHTtka1R94xeHTPx32W5gbkOYUBMkJY3_3OeGEHr2iWGngaeNtxdd5TUHQaYspimVyM_ichrryhF7wnC9s9ZAvmx9OM4QfuQDiMOgVQ55aG64s7WuaekbN-iWxDUxa1xU3QMnnfsenmkBQJU6VZhMfQxDhLTt01VcVCRdzMRrejr4hTKj8DVSq5k4DkwdclmIK_R9AS6WGMlzOOh1QLsuzcDUMMpX8GBpD5g8ggQHtjVLXZH7A5BxFOMIKW8Bes2RUt76gz685P2-q5tm84gKGQ')

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