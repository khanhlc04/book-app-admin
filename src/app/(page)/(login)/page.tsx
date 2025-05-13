"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebaseConfig";
import { getRoleById } from "@/app/service";

interface FormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const role = await getRoleById(user.uid);

                if (!role || role.role !== "admin") {
                    Swal.fire('Oops!', 'Bạn không có quyền truy cập trang web.');
                } else {
                    router.push("/books");
                }
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);

            const user = auth.currentUser;
            const uid = user?.uid;

            const role = uid ? await getRoleById(uid) : null;

            if (!role || role.role !== "admin") {
                Swal.fire('Oops!', 'Bạn không có quyền truy cập trang web.');
            }

        } catch {
            Swal.fire('Oops!', 'Email hoặc mật khẩu không đúng.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            {!isLoading && (
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <form
                        className="flex flex-col gap-y-6"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <h3 className="font-bold text-2xl text-center text-gray-800 mb-6">
                            Đăng Nhập Tài Khoản
                        </h3>

                        <div className="flex flex-col gap-y-2">
                            <label htmlFor="email" className="font-semibold text-sm text-gray-600">
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
                                    {errors.email.message}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-y-2">
                            <label htmlFor="password" className="font-semibold text-sm text-gray-600">
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
                                    {errors.password.message}
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
            )}
        </div>
    );
}