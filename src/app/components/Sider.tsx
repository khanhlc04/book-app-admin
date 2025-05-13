"use client";

import Link from "next/link"
import { FaPen, FaBook, FaBuilding, FaRightFromBracket } from "react-icons/fa6";
import MenuItem from "./MenuItem";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaExchangeAlt } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getRoleById } from "../service";

const Sider = () => {
    const [isLogin, setIsLogin] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const role = await getRoleById(user.uid);

                if (role && role.role === "admin") {
                    setIsLogin(true);
                }
            }
        });

        return () => unsubscribe();
    }, [pathname]);

    const menu = [
        {
            icon: <FaBook />,
            title: "Quản lý Sách",
            link: "/books",
        },
        {
            icon: <FaPen />,
            title: "Quản lý Tác Giả",
            link: "/authors",
        },
        {
            icon: <FaBuilding />,
            title: "Quản lý Nhà Xuất Bản",
            link: "/vendors",
        },
        {
            icon: <FaExchangeAlt />,
            title: "Quản lý Giao Dịch",
            link: "/transactions",
        },
        {
            icon: <FaRightFromBracket />,
            title: "Đăng Xuất",
            link: "/logout",
        }
    ];

    return (
        <>
            <div className='bg-[#212121] h-[100vh] fixed w-[280px]'>
                <div className='flex flex-col gap-y-[30px]'>
                    <div className="bg-[#1C1C1C] py-[25px] w-full">
                        <Link href='/' className='flex gap-[12px] items-center ml-[20px]'>
                            <span className='font-[700] text-[24px] leading-[28.8px] text-[#00ADEF]'>
                                Book App Admin
                            </span>
                        </Link>
                    </div>

                    {isLogin &&
                        <nav className="px-[20px]">
                            <ul className='flex flex-col gap-[30px]'>
                                {menu &&
                                    menu.map((item, index) => (
                                        <MenuItem item={item} key={index} />
                                    ))}
                            </ul>
                        </nav>
                    }
                </div>
            </div>
        </>
    )
}

export default Sider;