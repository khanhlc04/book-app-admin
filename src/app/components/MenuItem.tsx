import Link from "next/link"
import { usePathname } from "next/navigation";

type MenuItem = {
    icon: React.ReactNode,
    title: string,
    link: string
}

interface MenuItemProps {
    item: MenuItem;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
    const pathName = usePathname();
    return (
        <>
            <li className=''>
                <Link
                    href={item.link}
                    className={"flex gap-x-[20px] items-center hover:text-[#00ADEF] " + (pathName === item.link ? "text-[#00ADEF]" : "text-white")}>
                    <span className='text-[22px]'>
                        {item.icon}
                    </span>
                    <span className='text-[16px] font-[700] leading-[19.2px]'>
                        {item.title}
                    </span>
                </Link>
            </li>
        </>
    )
}

export default MenuItem;