"use client";

import Link from "next/link"
import { useEffect, useState } from "react";
import { FaPen, FaBook } from "react-icons/fa6";
import MenuItem from "./MenuItem";

const Sider = () => {
    // const [isLogin, setIsLogin] = useState<boolean>(false);

    // useEffect(() => {
    //         onAuthStateChanged(auth, (user) => {
    //           if (user) {
    //     setIsLogin(true);
    //           } else {
    //             setIsLogin(false);
    //           }
    //         });
    // }, [])

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
                    <nav className="px-[20px]">
                        <ul className='flex flex-col gap-[30px]'>
                            {menu &&
                                menu.map((item, index) => (
                                    <MenuItem item={item} key={index} />
                                ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    )
}

export default Sider;