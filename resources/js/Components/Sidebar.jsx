import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faBell,
    faCog,
    faCommentDots,
    faQuestionCircle,
    faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { Link, usePage } from "@inertiajs/react";

const SidebarButton = ({ icon, link, isActive }) => (
    <Link
        href={link}
        className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-in-out ${
            isActive
                ? "bg-[#009FDC] text-white"
                : "bg-white text-[#9B9DA2] border border-[#B9BBBD] hover:bg-[#009FDC] hover:text-white hover:border-none"
        }`}
    >
        <FontAwesomeIcon icon={icon} size="xl" />
    </Link>
);

const Sidebar = ({ isOpen }) => {
    const { url } = usePage();

    return (
        <>
            <aside
                className={`h-3/5 lg:h-[35rem] bg-white shadow-md flex flex-col justify-between rounded-[50px] py-6 items-center fixed left-24 lg:left-6 w-24 border-[0.5px] border-[#B9BBBD] transition-transform ${
                    isOpen ? "translate-x-0" : "-translate-x-20"
                } lg:translate-x-0 top-24`}
            >
                <nav className="flex flex-col gap-6">
                    <SidebarButton
                        icon={faHome}
                        link="/dashboard"
                        isActive={url === "/dashboard"}
                    />
                    <SidebarButton
                        icon={faCommentDots}
                        link="/comments"
                        isActive={url === "/comments"}
                    />
                    <SidebarButton
                        icon={faBell}
                        link="/notifications"
                        isActive={url === "/notifications"}
                    />
                    <SidebarButton
                        icon={faCog}
                        link="/settings"
                        isActive={url === "/settings"}
                    />
                </nav>

                <SidebarButton
                    icon={faQuestionCircle}
                    link="/help"
                    isActive={url === "/help"}
                />
            </aside>

            <div className="fixed left-10 lg:left-12 bottom-12">
                <SidebarButton icon={faRightFromBracket} link="/logout" />
            </div>
        </>
    );
};

export default Sidebar;
