"use client";

import { auth } from "@/app/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const logOut = (async () => {
            await signOut(auth)
            router.push("/");
        })
        logOut();
    }, [])

    return (
        <></>
    );
}