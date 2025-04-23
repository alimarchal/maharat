import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";

export default function UserManual() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [userDesignation, setUserDesignation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isManagingDirector, setIsManagingDirector] = useState(false);

    useEffect(() => {
        fetchUserDesignation();
    }, [user]);

    const fetchUserDesignation = async () => {
        if (!user?.designation_id) {
            processDesignationData(null);
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(
                `/api/v1/designations/${user.designation_id}`
            );
            const designationData = extractDesignationName(response.data);
            processDesignationData(designationData);
        } catch (error) {
            console.error("Error fetching designation:", error);
            fallbackToAuthUser();
        } finally {
            setIsLoading(false);
        }
    };

    const extractDesignationName = (data) => {
        if (!data) return null;
        if (data.data?.designation) return data.data.designation;
        if (data.designation) return data.designation;
        if (data.data) {
            if (data.data.designation) return data.data.designation;
            if (typeof data.data === "string") return data.data;
        }
        if (typeof data === "object" && data !== null) {
            if (data.designation) return data.designation;
            if (data.name) return data.name;
        }
        return null;
    };

    const processDesignationData = (designationName) => {
        if (typeof designationName === "object" && designationName !== null) {
            designationName =
                designationName.designation ||
                designationName.name ||
                JSON.stringify(designationName);
        }
        setUserDesignation(designationName);
        setIsManagingDirector(designationName === "Managing Director");
        setIsLoading(false);
    };

    const fallbackToAuthUser = () => {
        if (!auth?.user) {
            setUserDesignation(null);
            setIsManagingDirector(false);
            return;
        }

        let designationName = null;
        if (auth.user.designation) {
            designationName =
                auth.user.designation.designation ||
                auth.user.designation.name ||
                auth.user.designation;
        } else if (auth.user.designation_id === 1) {
            designationName = "Managing Director";
        }
        processDesignationData(designationName);
    };

    const CardsData = [
        {
            id: "login-details",
            title: "Login Details",
            description: "How to Login Company Details?",
            imageUrl: "/images/manuals/login-details.png",
            hasSubsections: false,
        },
        {
            id: "notification-settings",
            title: "Notification Settings",
            description: "How to manage notifications?",
            imageUrl: "/images/manuals/notification-settings.png",
            hasSubsections: false,
        },
        {
            id: "user-profile",
            title: "User Profile Settings",
            description: "How to edit user profile in settings?",
            imageUrl: "/images/manuals/user-profile.png",
            hasSubsections: false,
        },
        {
            id: "company-info",
            title: "Maharat Info Settings",
            description: "How to set Company profile?",
            imageUrl: "/images/manuals/company-info.png",
            hasSubsections: false,
        },
        {
            id: "request",
            title: "Request",
            description: "How to create Request for Material?",
            imageUrl: "/images/manuals/request.png",
            hasSubsections: false,
        },
        {
            id: "task-center",
            title: "Task Center",
            description: "How to check my task?",
            imageUrl: "/images/manuals/task-center.png",
            hasSubsections: false,
        },
        {
            id: "procurement",
            title: "Procurement Center",
            description: "How to generate RFQ's for Quotation?",
            imageUrl: "/images/manuals/procurement.png",
            hasSubsections: true,
        },
        {
            id: "finance",
            title: "Finance Center",
            description: "How to manage Finance?",
            imageUrl: "/images/manuals/finance.png",
            hasSubsections: true,
        },
        {
            id: "warehouse",
            title: "Warehouse",
            description: "How to create & manage warehouse?",
            imageUrl: "/images/manuals/warehouse.png",
            hasSubsections: true,
        },
        {
            id: "budget",
            title: "Budget & Accounts",
            description: "How to create and add budget?",
            imageUrl: "/images/manuals/budget.png",
            hasSubsections: true,
        },
        {
            id: "reports",
            title: "Reports & Statues",
            description: "How to manage reports?",
            imageUrl: "/images/manuals/reports.png",
            hasSubsections: false,
        },
        {
            id: "configuration",
            title: "Configuration Center",
            description: "How to manage configuration center?",
            imageUrl: "/images/manuals/configuration.png",
            hasSubsections: true,
        },
    ];

    const ManualSectionCard = ({ card }) => {
        const href = card.hasSubsections
            ? `/user-manual/${card.id}`
            : `/user-manual/${card.id}`;

        return (
            <Link href={href}>
                <div className="w-full flex items-start justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">
                            {card.title}
                        </h3>
                        <p className="font-medium text-base">
                            {card.description}
                        </p>
                    </div>
                    {card.imageUrl && (
                        <div className="w-16 h-16 flex-shrink-0">
                            <img
                                src={card.imageUrl}
                                alt={card.title}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/placeholder.png";
                                }}
                            />
                        </div>
                    )}
                </div>
            </Link>
        );
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    User Manual
                </h2>
                <button
                    type="button"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-sm md:text-xl font-medium"
                >
                    Create a User Guide
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {CardsData.map((cards, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
                        >
                            <ManualSectionCard card={cards} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
