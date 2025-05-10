"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem("token");
        router.push("/");
    }, [])

    return (
        <></>
    );
}