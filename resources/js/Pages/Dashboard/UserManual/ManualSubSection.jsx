import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import CreateUserGuide from "./CreateUserGuide";

export default function UserManualSubSections() {
    const { props } = usePage();
    const section = props.section;
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);

    // Define subcards for each main section
    const subManualSections = {
        procurement: [
            {
                id: "rfqs",
                title: "RFQs",
                description: "How to add and create RFQ's?",
                imageUrl: "/images/manuals/procurement.png",
            },
            {
                id: "quotations",
                title: "Quotations",
                description: "How to create and add quotations?",
                imageUrl: "/images/manuals/procurement.png",
            },
            {
                id: "purchase-order",
                title: "Purchase Orders",
                description: "How to view and create purchase order?",
                imageUrl: "/images/manuals/procurement.png",
            },
            ,
            {
                id: "external-invoices",
                title: "External Invoices",
                description: "How to create external invoices?",
                imageUrl: "/images/manuals/procurement.png",
            },
        ],
        finance: [
            {
                id: "maharat-invoices",
                title: "Maharat Invoices",
                description: "How to create Maharat Invoices?",
                imageUrl: "/images/manuals/finance.png",
            },
            {
                id: "accounts",
                title: "Accounts",
                description: "How to manage Accounts?",
                imageUrl: "/images/manuals/finance.png",
            },
            {
                id: "payment-order",
                title: "Payment Order",
                description: "How to create Payment Orders?",
                imageUrl: "/images/manuals/finance.png",
            },
            {
                id: "account-receivables",
                title: "Account Receivables",
                description: "How to manage account receivables?",
                imageUrl: "/images/manuals/finance.png",
            },
        ],
        warehouse: [
            {
                id: "create-warehouse",
                title: "Create Warehouse",
                description: "How to create a new warehouse?",
                imageUrl: "/images/manuals/warehouse.png",
            },
            {
                id: "issue-material",
                title: "Issue Material",
                description: "How we issue a Material to User?",
                imageUrl: "/images/manuals/warehouse.png",
            },
            {
                id: "grns",
                title: "GRNs",
                description: "How to create Goods receiving notes?",
                imageUrl: "/images/manuals/warehouse.png",
            },
            {
                id: "inventory",
                title: "Inventory Tracking",
                description: "How to manage inventory in warehouses?",
                imageUrl: "/images/manuals/warehouse.png",
            },
        ],
        budget: [
            {
                id: "cost-centers",
                title: "Cost Center",
                description: "How to create a new Cost Center",
                imageUrl: "/images/manuals/budget.png",
            },
            {
                id: "budget",
                title: "Budget",
                description: "How to Create a Budget?",
                imageUrl: "/images/manuals/budget.png",
            },
            {
                id: "request-budget",
                title: "Request a Budget",
                description: "How to Create Rquest a Budget?",
                imageUrl: "/images/manuals/budget.png",
            },
        ],
        configuration: [
            {
                id: "chart",
                title: "Organizational Chart",
                description: "How to manage Organizational Chart?",
                imageUrl: "/images/manuals/configuration.png",
            },
            {
                id: "process-flow",
                title: "Process Flow",
                description: "How to manage Process flow?",
                imageUrl: "/images/manuals/configuration.png",
            },
        ],
    };

    const subSections = subManualSections[section] || [];

    const SubManualSectionCard = ({ section }) => (
        <Link
            href={`/user-manual/${props.section}/${section.id}`}
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

    const sectionRows = groupSectionsIntoRows(subSections);

    // Format the section title by capitalizing each word and replacing hyphens with spaces
    const formatSectionTitle = (sectionId) => {
        return sectionId
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    {formatSectionTitle(section)} User Manual
                </h2>
                <button
                    type="button"
                    onClick={() => setIsCreateGuideOpen(true)}
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create a User Guide
                </button>
            </div>

            <div className="space-y-6">
                {sectionRows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {row.map((section, sectionIndex) => (
                            <SubManualSectionCard
                                key={sectionIndex}
                                section={section}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Create User Guide Modal */}
            <CreateUserGuide 
                isOpen={isCreateGuideOpen} 
                onClose={() => setIsCreateGuideOpen(false)} 
                sectionId={section}
            />
        </div>
    );
}
