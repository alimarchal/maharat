import React, { useState, useRef, useEffect } from "react";
import {
    faFileAlt,
    faBoxes,
    faFileInvoice,
    faChartBar,
    faClipboardList,
    faShoppingCart,
    faCogs,
    faChevronDown,
    faChevronUp,
    faChevronRight,
    faFileCirclePlus,
    faFileSignature,
    faListCheck,
    faUsers,
    faBell,
    faDiagramProject,
    faUserPen,
    faEllipsisH,
    faWarehouse,
    faDolly,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { router } from "@inertiajs/react";

const DropdownItem = ({ text, icon, onClick }) => {
    return (
        <div
            className="p-3 cursor-pointer flex items-center justify-between transition-all duration-300 hover:bg-[#009FDC] group"
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            role="menuitem"
            tabIndex="0"
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onClick) onClick(e);
                }
            }}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 w-12 h-12 flex justify-center items-center border border-[#B9BBBD] rounded-full transition-all duration-300 group-hover:border-[#009FDC] group-hover:bg-white">
                    <FontAwesomeIcon
                        icon={icon}
                        className="text-[#9B9DA2] w-5 transition-all duration-300 group-hover:text-[#009FDC]"
                    />
                </div>
                <span className="text-lg text-[#9B9DA2] transition-all duration-300 group-hover:text-white">
                    {text}
                </span>
            </div>
            <FontAwesomeIcon
                icon={faChevronRight}
                className="text-[#9B9DA2] w-3 transition-all duration-300 group-hover:text-white"
            />
        </div>
    );
};

const DashboardCard = ({
    icon,
    title,
    subtitle,
    dropdownItems,
    bgColor,
    iconColor,
    onClick,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const [isHovered, setIsHovered] = useState(false);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const cardRef = useRef(null);
    const [dropdownMeasured, setDropdownMeasured] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (dropdownRef.current && buttonRef.current && !dropdownMeasured) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const dropdownRect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            if (
                spaceBelow < dropdownRect.height &&
                spaceAbove > dropdownRect.height
            ) {
                setDropdownPosition("top");
            } else {
                setDropdownPosition("bottom");
            }
            setDropdownMeasured(true);
        }
    }, [dropdownMeasured]);

    useEffect(() => {
        const handleResize = () => {
            if (buttonRef.current && dropdownRef.current) {
                const buttonRect = buttonRef.current.getBoundingClientRect();
                const dropdownRect =
                    dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;

                if (
                    spaceBelow < dropdownRect.height &&
                    spaceAbove > dropdownRect.height
                ) {
                    setDropdownPosition("top");
                } else {
                    setDropdownPosition("bottom");
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleCardClick = (e) => {
        if (
            onClick &&
            (!dropdownItems || !buttonRef.current?.contains(e.target))
        ) {
            onClick();
        }
    };

    return (
        <div
            ref={cardRef}
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative transition-all duration-300 ${
                    isHovered ? "shadow-lg" : ""
                } ${onClick ? "cursor-pointer" : ""}`}
                onClick={handleCardClick}
            >
                <div className="flex justify-between items-center">
                    <div
                        className={`${bgColor} flex justify-center items-center p-3 rounded-full w-14 h-14`}
                    >
                        <FontAwesomeIcon
                            icon={icon}
                            className={`text-2xl ${iconColor}`}
                        />
                    </div>
                    {dropdownItems && (
                        <button
                            ref={buttonRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            className={`rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                                isOpen
                                    ? "bg-[#009FDC] border-[#009FDC]"
                                    : "border border-[#B9BBBD]"
                            }`}
                            aria-expanded={isOpen}
                            aria-haspopup="true"
                        >
                            <FontAwesomeIcon
                                icon={isOpen ? faChevronUp : faChevronDown}
                                className={`text-xl transition-all duration-300 ${
                                    isOpen ? "text-white" : "text-[#074D38]"
                                }`}
                            />
                        </button>
                    )}
                </div>
                <div className="mt-16">
                    <h3 className="text-3xl font-medium text-[#2C323C]">
                        {title}
                    </h3>
                    <p className="text-base text-[#9B9DA2] mt-1">{subtitle}</p>
                </div>
            </div>
            {dropdownItems && (
                <div
                    ref={dropdownRef}
                    className={`absolute ${
                        dropdownPosition === "top"
                            ? "bottom-52 right-5"
                            : "top-20 right-5"
                    } bg-white rounded-lg shadow-lg w-72 z-50 ${
                        isOpen ? "opacity-100" : "opacity-0 invisible"
                    } transition-opacity duration-200`}
                    role="menu"
                >
                    {dropdownItems.map((item, index) => (
                        <DropdownItem
                            key={index}
                            text={item.text}
                            icon={item.icon}
                            onClick={item.onClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function MainDashboard({ roles }) {
    const isAdmin = roles && roles.includes("Admin");

    const purchaseDropdownItems = [
        {
            text: "RFQs",
            icon: faFileCirclePlus,
            onClick: () => router.visit("/rfq")
        },
        {
            text: "Quotations",
            icon: faFileInvoice,
        },
        {
            text: "Purchase Orders",
            icon: faFileSignature,
        },
        {
            text: "Goods Receiving Note",
            icon: faListCheck,
        },
        {
            text: "Status",
            icon: faEllipsisH,
        },
    ];

    const warehouseDropdownItems = [
        {
            text: "Material Request",
            icon: faFileAlt,
        },
        {
            text: "Categories",
            icon: faListCheck,
            onClick: () => router.visit("/category"),
        },
        {
            text: "Items",
            icon: faClipboardList,
            onClick: () => router.visit("/items"),
        },
        {
            text: "Goods Receiving",
            icon: faFileInvoice,
        },
        {
            text: "Goods Issued",
            icon: faDolly,
        },
        {
            text: "Inventory Tracking",
            icon: faChartBar,
        },
    ];

    const configDropdownItems = [
        {
            text: "Organizational Chart",
            icon: faChartBar,
        },
        {
            text: "Process Flow",
            icon: faDiagramProject,
        },
        {
            text: "Notification Settings",
            icon: faBell,
        },
        {
            text: "Roles & Permission",
            icon: faUserPen,
        },
        {
            text: "Users",
            icon: faUsers,
        },
    ];

    return (
        <>
            <div
                className="relative w-full h-72 md:h-80 lg:h-[17rem] bg-cover bg-center text-white p-6 rounded-3xl"
                style={{ backgroundImage: "url('/images/banner.png')" }}
            >
                <div className="absolute bottom-4 text-left">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Welcome Back!
                    </h2>
                    <p className="text-lg md:text-xl font-medium mt-2">
                        To Maharat Procurement & Inventory Management System
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-6">
                <DashboardCard
                    icon={faClipboardList}
                    title="Requests"
                    subtitle="My Requests & History"
                    bgColor="bg-[#C4E4F0]"
                    iconColor="text-[#005372]"
                    onClick={() => router.visit("/my-requests")}
                />
                <DashboardCard
                    icon={faListCheck}
                    title="Tasks"
                    subtitle="My Tasks & History"
                    bgColor="bg-[#F7EBBA]"
                    iconColor="text-[#665200]"
                />

                {isAdmin && (
                    <>
                        <DashboardCard
                            icon={faShoppingCart}
                            title="Purchases"
                            subtitle="Procurement System"
                            bgColor="bg-[#BFBCD8]"
                            iconColor="text-[#393559]"
                            dropdownItems={purchaseDropdownItems}
                        />
                        <DashboardCard
                            icon={faBoxes}
                            title="Finance"
                            subtitle="Budget & Expenses"
                            bgColor="bg-[#C4E4F0]"
                            iconColor="text-[#005372]"
                        />
                    </>
                )}
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-6">
                    <DashboardCard
                        icon={faWarehouse}
                        title="Warehouse"
                        subtitle="Stock Management"
                        bgColor="bg-[#F7EBBA]"
                        iconColor="text-[#665200]"
                        dropdownItems={warehouseDropdownItems}
                        onClick={() => router.visit("/warehouse-management")}
                    />
                    <DashboardCard
                        icon={faFileInvoice}
                        title="Invoices"
                        subtitle="Paid & Unpaid"
                        bgColor="bg-[#F7CCCC]"
                        iconColor="text-[#661E1E]"
                    />
                    <DashboardCard
                        icon={faChartBar}
                        title="Reports"
                        subtitle="All Reports"
                        bgColor="bg-[#B9BBBD]"
                        iconColor="text-[#2C323C]"
                    />
                    <DashboardCard
                        icon={faCogs}
                        title="Configuration"
                        subtitle="Process Flow"
                        bgColor="bg-[#DEEEE9]"
                        iconColor="text-[#074D38]"
                        dropdownItems={configDropdownItems}
                    />
                </div>
            )}
        </>
    );
}
