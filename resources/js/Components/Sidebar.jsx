import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faBell,
    faCog,
    faQuestionCircle,
    faRightFromBracket,
    faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import { router, usePage } from "@inertiajs/react";
import { usePermissions } from "@/hooks/usePermissions";

const SidebarButton = ({
    icon,
    link,
    isActive,
    isLogout,
    title,
}) => {
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

    const handleNavigation = (e) => {
        if (!isLogout) {
            e.preventDefault();
            router.visit(link);
        }
    };

    const ButtonContent = () => (
        <div className="relative">
            <FontAwesomeIcon icon={icon} size="xl" />
        </div>
    );

    return isLogout ? (
        <button
            onClick={handleLogout}
            title={title}
            className="flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-in-out bg-white text-[#9B9DA2] border border-[#B9BBBD] hover:bg-[#009FDC] hover:text-white hover:border-none"
        >
            <ButtonContent />
        </button>
    ) : (
        <button
            onClick={handleNavigation}
            title={title}
            className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ease-in-out ${
                isActive
                    ? "bg-[#009FDC] text-white"
                    : "bg-white text-[#9B9DA2] border border-[#B9BBBD] hover:bg-[#009FDC] hover:text-white hover:border-none"
            }`}
        >
            <ButtonContent />
        </button>
    );
};

const Sidebar = ({ isOpen }) => {
    const { url } = usePage();
    const user = usePage().props.auth.user;
    const { hasPermission, permissions, loading } = usePermissions();
    
    // Check if user is a top-level user (parent_id is NULL)
    const isTopLevelUser = user?.parent_id === null;
    
    // Check if sidebar should be enabled (user has main sidebar permission)
    const sidebarEnabled = hasPermission("view_sidebar");

    return (
        <>
            <aside
                className={`bg-white shadow-md flex flex-col justify-between rounded-[50px] py-6 items-center fixed left-24 lg:left-6 w-24 border-[0.5px] border-[#B9BBBD] transition-transform ${
                    isOpen ? "translate-x-0" : "-translate-x-20"
                } lg:translate-x-0 top-24`}
                style={{
                    height: 'calc(100vh - 16rem)', // More space for logout button gap
                    minHeight: '400px',
                    maxHeight: 'calc(100vh - 12rem)'
                }}
            >
                <nav className="flex flex-col gap-4 lg:gap-6">
                    <SidebarButton
                        icon={faHome}
                        link="/dashboard"
                        title="Dashboard"
                        isActive={url === "/dashboard"}
                    />
                    {hasPermission("sidebar_notification") && (
                        <SidebarButton
                            icon={faBell}
                            link="/notification-settings"
                            title="Notification Settings"
                            isActive={url === "/notification-settings"}
                        />
                    )}
                    {hasPermission("view_sidebar") && hasPermission("edit_profile") && (
                        <SidebarButton
                            icon={faCog}
                            link="/company-profile"
                            title="Profile Settings"
                            isActive={url === "/company-profile"}
                        />
                    )}
                </nav>

                <div className="flex flex-col gap-4 lg:gap-6">
                    {hasPermission("view_sidebar") && hasPermission("view_user_manual") && (
                        <SidebarButton
                            icon={faBookOpen}
                            link="/user-manual"
                            title="User Manual"
                            isActive={url === "/user-manual"}
                        />
                    )}
                    {hasPermission("view_sidebar") && hasPermission("view_faqs") && (
                        <SidebarButton
                            icon={faQuestionCircle}
                            link="/faqs"
                            title="FAQs"
                            isActive={url === "/faqs"}
                        />
                    )}
                </div>
            </aside>

            {/* Logout button - positioned safely below sidebar */}
            <div className="fixed left-10 lg:left-12 bottom-8">
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
