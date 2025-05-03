"use client";

import React, { useState } from "react";
import Image from "next/image";
import { addBooks, uploadToCloudinary } from "@/app/service";

export default function UploadBookForm() {
    const [bookName, setBookName] = useState("");
    const [description, setDescription] = useState("");
    const [cost, setCost] = useState("");
    const [image, setImage] = useState<any>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPdf(file);
    };

    const resetForm = () => {
        setBookName("");
        setDescription("");
        setCost("");
        setImage(null);
        setPdf(null);
        setPreviewImage("");
        setMessage("");
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async () => {
        if (!bookName || !description || !cost || !image || !pdf) {
            setMessage("❌ Please fill in all fields and upload both image and PDF.");
            return;
        }

        try {
            setIsUploading(true);
            const imageUrl = await uploadToCloudinary(image, "image");
            const pdfUrl = await uploadToCloudinary(pdf, "raw");
            await addBooks(bookName, description, cost, imageUrl, pdfUrl);
            setMessage("✅ Book uploaded successfully!");
            resetForm();
        } catch (err: any) {
            console.error(err);
            setMessage(`❌ Upload failed: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-center mb-6">Upload Book</h1>

            <label className="block mb-2 font-semibold">Book Title</label>
            <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="Enter book title"
                className="w-full border rounded p-2 mb-4"
            />

            <label className="block mb-2 font-semibold">Price (VND)</label>
            <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Enter price"
                className="w-full border rounded p-2 mb-4"
            />

            <label className="block mb-2 font-semibold">Description</label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                className="w-full border rounded p-2 mb-4 h-24"
            />

            <label className="block mb-2 font-semibold">Cover Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
            {previewImage && (
                <Image
                    src={previewImage}
                    alt="Preview"
                    width={300}
                    height={180}
                    className="rounded mb-4"
                />
            )}

            <label className="block mb-2 font-semibold">PDF File</label>
            <input type="file" accept="application/pdf" onChange={handlePdfChange} className="mb-4" />

            <button
                onClick={handleSubmit}
                className="w-full bg-blue-500 text-white py-2 rounded font-bold disabled:opacity-50"
                disabled={isUploading}
            >
                {isUploading ? "📤 Uploading..." : "🚀 Upload"}
            </button>

            <button
                onClick={resetForm}
                className="w-full mt-3 border border-red-500 text-red-500 py-2 rounded font-bold"
            >
                🗑 Reset
            </button>

            {message && <p className="mt-4 text-center font-semibold">{message}</p>}
        </div>
    );
}