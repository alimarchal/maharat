import React from "react";
import { Link, usePage } from "@inertiajs/react";

export default function UserManualSubSections() {
    const { props } = usePage();
    const section = props.section;

    // Titles for main sections
    const sectionTitles = {
        procurement: "Procurement Center Manual",
        finance: "Finance Center Manual",
        warehouse: "Warehouse Manual",
        budget: "Budget Center Manual",
        configuration: "Configuration Center Manual",
    };

    // Define subcards for each main section
    const subManualSections = {
        procurement: [
            {
                id: "rfqs",
                title: "RFQs",
                description: "How to add and create RFQ’s?",
                imageUrl: "/images/manuals/rfq.png",
            },
            {
                id: "quotations",
                title: "Quotations",
                description: "How to create and add quotations?",
                imageUrl: "/images/manuals/quotation.png",
            },
            {
                id: "purchase-order",
                title: "Purchase Orders",
                description: "How to view and create purchase order?",
                imageUrl: "/images/manuals/purchase-order.png",
            },
            {
                id: "external-invoices",
                title: "External Invoices",
                description: "How to create external invoices?",
                imageUrl: "/images/manuals/external-invoices.png",
            },
        ],
        finance: [
            {
                id: "maharat-invoices",
                title: "Maharat Invoices",
                description: "How to create Maharat Invoices?",
                imageUrl: "/images/manuals/external-invoices.png",
            },
            {
                id: "accounts",
                title: "Accounts",
                description: "How to manage Accounts?",
                imageUrl: "/images/manuals/quotation.png",
            },
            {
                id: "payment-order",
                title: "Payment Order",
                description: "How to create Payment Orders?",
                imageUrl: "/images/manuals/purchase-order.png",
            },
            {
                id: "account-receivables",
                title: "Account Receivables",
                description: "How to manage account receivables?",
                imageUrl: "/images/manuals/rfq.png",
            },
            {
                id: "account-payables",
                title: "Account Payables",
                description: "How to manage account payables?",
                imageUrl: "/images/manuals/quotation.png",
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
                imageUrl: "/images/manuals/Request.png",
            },
            {
                id: "grns",
                title: "GRNs",
                description: "How to create Goods receiving notes?",
                imageUrl: "/images/manuals/rfq.png",
            },
            {
                id: "inventory",
                title: "Inventory Tracking",
                description: "How to manage inventory in warehouses?",
                imageUrl: "/images/manuals/quotation.png",
            },
        ],
        budget: [
            {
                id: "cost-centers",
                title: "Cost Center",
                description: "How to create a new Cost Center",
                imageUrl: "/images/manuals/rfq.png",
            },
            {
                id: "income-statement",
                title: "Income Statement",
                description: "How to manage income statement",
                imageUrl: "/images/manuals/external-invoices.png",
            },
            {
                id: "balance-sheet",
                title: "Balance Sheet",
                description: "How to manage balance sheet",
                imageUrl: "/images/manuals/quotation.png",
            },
            {
                id: "create-budget",
                title: "Create Budget",
                description: "How to Create a Budget?",
                imageUrl: "/images/manuals/budget.png",
            },
            {
                id: "request-budget",
                title: "Request a Budget",
                description: "How to Create Request a Budget?",
                imageUrl: "/images/manuals/purchase-order.png",
            },
        ],
        configuration: [
            {
                id: "chart",
                title: "Organizational Chart",
                description: "How to manage Organizational Chart?",
                imageUrl: "/images/manuals/Reports.png",
            },
            {
                id: "process-flow",
                title: "Process Flow",
                description: "How to manage Process flow?",
                imageUrl: "/images/manuals/rfq.png",
            },
        ],
    };

    const subSections = subManualSections[section] || [];

    const SubManualSectionCard = ({ card }) => (
        <Link href={`/user-manual/${section}/${card.id}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                    <p className="font-medium text-base">{card.description}</p>
                </div>
                {card.imageUrl && (
                    <div className="w-16 h-16 flex-shrink-0 ml-4">
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

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-8">
                {sectionTitles[section]}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {subSections.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
                    >
                        <SubManualSectionCard card={card} />
                    </div>
                ))}
            </div>
        </div>
    );
}
