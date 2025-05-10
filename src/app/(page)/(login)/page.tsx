"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

interface FormData {
    email: string;
    password: string;
}

const DEFAULT_EMAIL = "admin@gmail.com";
const DEFAULT_PASSWORD = "admin123";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        if (localStorage.getItem("token")) router.push("/books")
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();  

    const onSubmit: SubmitHandler<FormData> = (data) => {  
        if(data.email === DEFAULT_EMAIL && data.password === DEFAULT_PASSWORD){
            localStorage.setItem("token", "demo_token");
            router.push("/books");
        }
    };

    return (
        <div className="flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <form
                    className="flex flex-col gap-y-6"
                    onSubmit={handleSubmit(onSubmit)} 
                >
                    <h3 className="font-bold text-2xl text-center text-gray-800 mb-6">
                        Đăng Nhập Tài Khoản
                    </h3>

                    <div className="flex flex-col gap-y-2">
                        <label
                            htmlFor="email"
                            className="font-semibold text-sm text-gray-600"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            {...register("email", { required: "Email là bắt buộc" })}
                            className="border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.email && (
                            <span className="text-red-500 text-sm mt-1">
                                {errors.email.message as React.ReactNode}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <label
                            htmlFor="password"
                            className="font-semibold text-sm text-gray-600"
                        >
                            Mật Khẩu
                        </label>
                        <input
                            type="password"
                            id="password"
                            {...register("password", { required: "Mật khẩu là bắt buộc" })}
                            className="border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.password && (
                            <span className="text-red-500 text-sm mt-1">
                                {errors.password.message as React.ReactNode}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="bg-[#00ADEF] py-3 rounded-md font-bold text-white mt-4"
                    >
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
}
