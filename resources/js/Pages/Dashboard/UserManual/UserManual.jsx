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

    const manualSections = [
        {
            id: "login-details",
            title: "Login Details",
            description: "How to Login Company Details?",
            imageUrl: "/images/manuals/login-details.png",
        },
        {
            id: "notification-settings",
            title: "Notification Settings",
            description: "How to manage notifications?",
            imageUrl: "/images/manuals/notification-settings.png",
        },
        {
            id: "user-profile",
            title: "User Profile Settings",
            description: "How to edit user profile in settings?",
            imageUrl: "/images/manuals/user-profile.png",
        },
        {
            id: "company-info",
            title: "Maharat Info Settings",
            description: "How to set Company profile?",
            imageUrl: "/images/manuals/company-info.png",
        },
        {
            id: "request",
            title: "Request",
            description: "How to create Request for Material?",
            imageUrl: "/images/manuals/request.png",
        },
        {
            id: "task-center",
            title: "Task Center",
            description: "How to check my task?",
            imageUrl: "/images/manuals/task-center.png",
        },
        {
            id: "procurement",
            title: "Procurement Center",
            description: "How to generate RFQ's for Quotation?",
            imageUrl: "/images/manuals/procurement.png",
        },
        {
            id: "finance",
            title: "Finance Center",
            description: "How to manage Finance?",
            imageUrl: "/images/manuals/finance.png",
        },
        {
            id: "warehouse",
            title: "Warehouse",
            description: "How to create & manage warehouse?",
            imageUrl: "/images/manuals/warehouse.png",
        },
        {
            id: "budget",
            title: "Budget & Accounts",
            description: "How to create and add budget?",
            imageUrl: "/images/manuals/budget.png",
        },
        {
            id: "reports",
            title: "Reports & Statues",
            description: "How to manage reports?",
            imageUrl: "/images/manuals/reports.png",
        },
        {
            id: "configuration",
            title: "Configuration Center",
            description: "How to manage configuration center?",
            imageUrl: "/images/manuals/configuration.png",
        },
    ];

    const ManualSectionCard = ({ section }) => (
        <Link
            href={`/user-manual/${section.id}`}
            className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                        {section.title}
                    </h3>
                    <p className="text-gray-600">{section.description}</p>
                </div>
                {section.imageUrl && (
                    <div className="w-16 h-16 flex-shrink-0">
                        <img
                            src={section.imageUrl}
                            alt={section.title}
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

    const groupSectionsIntoRows = (sections, itemsPerRow = 3) => {
        const rows = [];
        for (let i = 0; i < sections.length; i += itemsPerRow) {
            rows.push(sections.slice(i, i + itemsPerRow));
        }
        return rows;
    };

    const sectionRows = groupSectionsIntoRows(manualSections);

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-8">
                User Manual
            </h2>

            {isLoading ? (
                <div className="flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {sectionRows.map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {row.map((section, sectionIndex) => (
                                <ManualSectionCard
                                    key={sectionIndex}
                                    section={section}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
