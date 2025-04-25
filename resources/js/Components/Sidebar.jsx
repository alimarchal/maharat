import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faBell,
    faCog,
    faCommentDots,
    faQuestionCircle,
    faRightFromBracket,
    faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import { router, usePage } from "@inertiajs/react";

const SidebarButton = ({ icon, link, isActive, isLogout, title }) => {
    const handleLogout = (e) => {
        if (isLogout) {
            e.preventDefault();
            router.post(
                link,
                {},
                {
                    onSuccess: () => {
                        router.visit("/login");
                    },
                    onError: (errors) => {
                        console.log("Logout Error:", errors);
                    },
                }
            );
        }
    };

    return isLogout ? (
        <button
            onClick={handleLogout}
            title={title}
            className="flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-in-out bg-white text-[#9B9DA2] border border-[#B9BBBD] hover:bg-[#009FDC] hover:text-white hover:border-none"
        >
            <FontAwesomeIcon icon={icon} size="xl" />
        </button>
    ) : (
        <a
            href={link}
            title={title}
            className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-in-out ${
                isActive
                    ? "bg-[#009FDC] text-white"
                    : "bg-white text-[#9B9DA2] border border-[#B9BBBD] hover:bg-[#009FDC] hover:text-white hover:border-none"
            }`}
        >
            <FontAwesomeIcon icon={icon} size="xl" />
        </a>
    );
};

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
                        title="Dashboard"
                        isActive={url === "/dashboard"}
                    />
                    <SidebarButton
                        icon={faBell}
                        link="/notification-settings"
                        title="Notifications"
                        isActive={url === "/notification-settings"}
                    />
                    {/* <SidebarButton
                        icon={faCommentDots}
                        link="/comments"
                        title="Comments"
                        isActive={url === "/comments"}
                    /> */}
                    <SidebarButton
                        icon={faCog}
                        link="/company-profile"
                        title="Company Settings"
                        isActive={url === "/company-profile"}
                    />
                </nav>

                <div className="flex flex-col gap-6">
                    <SidebarButton
                        icon={faBookOpen}
                        link="/user-manual"
                        title="User Manual"
                        isActive={url === "/user-manual"}
                    />
                    <SidebarButton
                        icon={faQuestionCircle}
                        link="/faqs"
                        title="FAQs"
                        isActive={url === "/faqs"}
                    />
                </div>
            </aside>

            {/* Logout button */}
            <div className="fixed left-10 lg:left-12 bottom-12">
                <SidebarButton
                    icon={faRightFromBracket}
                    link="/logout"
                    title="Logout"
                    isLogout
                />
            </div>
        </>
    );
};

export default Sidebar;
