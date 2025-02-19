import { useState, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
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
    faUsers,
    faFileSignature,
    faListCheck,
    faGear,
    faUserGroup,
    faDiagramProject,
    faCheckDouble,
    faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DropdownItem = ({ text, icon }) => {
    return (
        <div className="p-3 cursor-pointer flex items-center justify-between transition-all duration-300 hover:bg-[#009FDC] group">
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
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("bottom");
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

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
        if (isOpen && buttonRef.current && dropdownRef.current) {
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
        }
    }, [isOpen]);

    return (
        <div className="relative">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 relative">
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
                            onClick={() => setIsOpen(!isOpen)}
                            className="border border-[#B9BBBD] rounded-full w-12 h-12"
                        >
                            <FontAwesomeIcon
                                icon={isOpen ? faChevronUp : faChevronDown}
                                className="text-xl text-[#074D38]"
                            />
                        </button>
                    )}
                </div>
                <div className="mt-16">
                    <h3 className="text-3xl font-medium text-[#2C323C]">
                        {title}
                    </h3>
                    <p className="text-2xl text-[#9B9DA2] mt-1">{subtitle}</p>
                </div>
            </div>
            {isOpen && dropdownItems && (
                <div
                    ref={dropdownRef}
                    className={`absolute ${
                        dropdownPosition === "top"
                            ? "bottom-52 right-5"
                            : "top-20 right-5"
                    } bg-white rounded-lg shadow-lg w-72 z-50`}
                >
                    {dropdownItems.map((item, index) => (
                        <DropdownItem
                            key={index}
                            text={item.text}
                            icon={item.icon}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Dashboard() {
    const purchaseDropdownItems = [
        { text: "RFQs", icon: faFileCirclePlus },
        { text: "Quotations", icon: faUsers },
        { text: "Purchase Orders", icon: faFileSignature },
        { text: "Goods Receiving Note", icon: faListCheck },
        { text: "Status", icon: faFileLines },
    ];

    const configDropdownItems = [
        { text: "Organizational Chart", icon: faGear },
        { text: "Process Flow", icon: faUserGroup },
        { text: "Notification Settings", icon: faDiagramProject },
        { text: "Roles & Permission", icon: faCheckDouble },
        { text: "Users", icon: faFileAlt },
    ];

    return (
        <AuthenticatedLayout>
            <main className="p-6 flex-1">
                <div
                    className="relative w-full h-72 md:h-80 lg:h-96 bg-cover bg-center text-white p-6 rounded-3xl"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
                    <DashboardCard
                        icon={faFileAlt}
                        title="Maharat"
                        subtitle="About Organization"
                        bgColor="bg-[#DEEEE9]"
                        iconColor="text-[#074D38]"
                    />
                    <DashboardCard
                        icon={faClipboardList}
                        title="Requests"
                        subtitle="My Requests & History"
                        bgColor="bg-[#C4E4F0]"
                        iconColor="text-[#005372]"
                    />
                    <DashboardCard
                        icon={faShoppingCart}
                        title="Purchases"
                        subtitle="Procurement System"
                        bgColor="bg-[#BFBCD8]"
                        iconColor="text-[#393559]"
                        dropdownItems={purchaseDropdownItems}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-6">
                    <DashboardCard
                        icon={faBoxes}
                        title="Warehouse"
                        subtitle="Stock Management"
                        bgColor="bg-[#F7EBBA]"
                        iconColor="text-[#665200]"
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
            </main>
        </AuthenticatedLayout>
    );
}
