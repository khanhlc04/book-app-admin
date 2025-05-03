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
const cloudConvert = new CloudConvert('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2QxMjdmMGRkMzdlZDExOTJjOTAzZmE1NDBiMzUzNDMyNzBmYTgxYjFmZGE4NTZlMzE1NzlkZTA1YTA3OTcwYmI4MTU2YTNlMDM1ZjNlM2UiLCJpYXQiOjE3NDU5Mjk5MzkuMzA0MDI5LCJuYmYiOjE3NDU5Mjk5MzkuMzA0MDMsImV4cCI6NDkwMTYwMzUzOS4yOTgxOTEsInN1YiI6IjY3MTQyMTI1Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInVzZXIud3JpdGUiLCJ0YXNrLndyaXRlIiwidGFzay5yZWFkIiwid2ViaG9vay5yZWFkIiwid2ViaG9vay53cml0ZSIsInByZXNldC5yZWFkIiwicHJlc2V0LndyaXRlIl19.gqJAbC1The_dl0_k9u36E_ofviq9wxTeHYPEsUTaPzOcvvAmdIfEe9ibAc0iWqydlVerCN8o8J527vEYZZThvFtFbaS0ga5o8-8NOKQSalXhsFVNtu_ClUlOgKS_ERq1nHZvdUYeVNmmdolgo-R03e4vSmp2rCmbDT3tAIWljH_aaDeT_L-cP95iT5ddFToeAsOXOittlG1qjvMlAcCWJP6UwveELulO5l8E2sWs1hxAwXbixPqvEoliCyQMMNy1lWq75OK_FH-K53V0Cf_Q6vt_5WOLIBADdfTBG5l0qJVyB9H3mOTfRzN2RJxOgqg-zoNnZRgDjrRAI2iNbmL91ENehRod71IIbfcOhnUzhShvyvYp-tCUoqWA1xrSXJsMLfSWLHT1tNkUfnRgPO7-GpiltxjJO3PBlt7dSPM0H4p3fmSO3Vqqrz243MYhgECHcg8uA9hvUJXFeA1P_BVBc5zrtqhBh32TTAUXX3QMOvfvHMdwNxWLhDkVt-bL48P9UJ-X71QyS02J3bmjQsHCpXgCwz9_9kW74gCoajSM6n7ftX9Nt5we7HyDX2rfDBJofhQ3YvZ-wuL4fPodpLYpFd_tzKJ7ulBy1x2fSeZuGzNLuyCXYOWjamj4jKHI-m6d-QiGUOMSRvmMZ0W4BwyhzcxiShIvSOnORqqGIRJEj-c');


export async function POST(req: Request) {
    const body = await req.json();
    const { pdfUrl } = body;

    if (!pdfUrl) {
        return NextResponse.json({ error: 'Thiếu link PDF.' }, { status: 400 });
    }

    try {
        const tempId = uuidv4();
        const tempDir = path.join(process.cwd(), 'temp');

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
            return NextResponse.json({ error: 'Không thể xuất file sau khi chuyển đổi.' }, { status: 500 });
        }

        const exportUrl = exportTask.result.files[0].url;
        const outputPath = path.join(tempDir, `${tempId}.epub`);
        const file = fs.createWriteStream(outputPath);


        return new Promise((resolve) => {
            if (!exportUrl) {
                return NextResponse.json({ error: 'Không thể xuất file sau khi chuyển đổi.' }, { status: 500 });
            }

            https.get(exportUrl, (response) => {
                response.pipe(file);
                file.on('finish', async () => {
                    file.close(async () => {
                        try {
                            const result = await cloudinary.v2.uploader.upload(outputPath, {
                                resource_type: 'raw',
                                folder: 'epub_files'
                            });

                            resolve(NextResponse.json({
                                filename: `${tempId}.epub`,
                                cloudinary_url: result.secure_url,
                                mime: 'application/epub+zip'
                            }));
                        } catch (uploadError) {
                            console.error('Lỗi upload Cloudinary:', uploadError);
                            resolve(NextResponse.json({ error: 'Upload lên Cloudinary thất bại.' }, { status: 500 }));
                        } finally {
                            fs.unlink(outputPath, (err) => {
                                if (err) console.error('Lỗi xóa file tạm:', err);
                            });
                        }
                    });
                });
            }).on('error', () => {
                fs.unlink(outputPath, () => { });
                resolve(NextResponse.json({ error: 'Không thể tải file sau khi chuyển đổi.' }, { status: 500 }));
            });
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
