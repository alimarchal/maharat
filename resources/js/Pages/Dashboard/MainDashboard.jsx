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
    faBell,
    faDiagramProject,
    faUserPen,
    faWarehouse,
    faCoins,
    faBook,
    faMoneyCheckDollar,
    faFileInvoiceDollar,
    faBalanceScale,
    faCalculator,
    faChartLine,
    faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { router } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { useRequestItems } from "@/Components/RequestItemsContext";

const DropdownItem = ({ text, icon, onClick, notificationCount = 0 }) => {
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
                <div className="p-2 w-12 h-12 flex justify-center items-center border border-[#B9BBBD] rounded-full transition-all duration-300 group-hover:border-[#009FDC] group-hover:bg-white relative">
                    <FontAwesomeIcon
                        icon={icon}
                        className="text-[#9B9DA2] w-5 transition-all duration-300 group-hover:text-[#009FDC]"
                    />
                    {/* Notification Badge for dropdown items */}
                    {notificationCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </div>
                    )}
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
    notificationCount = 0,
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
                className={`bg-white p-10 rounded-tr-[5rem] rounded-bl-[5rem] shadow-md border border-gray-100 relative transition-all duration-300 h-64 flex flex-col justify-between ${
                    isHovered ? "shadow-lg" : ""
                } ${onClick ? "cursor-pointer" : ""}`}
                onClick={handleCardClick}
            >
                <div className="flex justify-between items-center">
                    <div
                        className={`${bgColor} flex justify-center items-center p-3 rounded-full w-14 h-14 relative`}
                    >
                        <FontAwesomeIcon
                            icon={icon}
                            className={`text-2xl ${iconColor}`}
                        />
                        {/* Notification Badge */}
                        {notificationCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-base font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </div>
                        )}
                    </div>
                    {dropdownItems && dropdownItems.length > 0 && (
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
                <div className="flex flex-col flex-grow justify-end">
                    <h3 className="text-3xl font-medium text-[#2C323C]">
                        {title}
                    </h3>
                    <p className="text-base text-[#9B9DA2] mt-1">{subtitle}</p>
                </div>
            </div>
            {dropdownItems && dropdownItems.length > 0 && (
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
                            notificationCount={item.notificationCount || 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function MainDashboard({ roles, permissions }) {
    const user = usePage().props.auth.user;
    const user_id = user.id;
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [requestedItemsCount, setRequestedItemsCount] = useState(0);
    const [pendingMaterialRequestsCount, setPendingMaterialRequestsCount] = useState(0);
    const [pendingRfqRequestsCount, setPendingRfqRequestsCount] = useState(0);
    const [quotationsRfqCount, setQuotationsRfqCount] = useState(0);
    const [purchaseOrdersRfqCount, setPurchaseOrdersRfqCount] = useState(0);
    const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
    const [approvedItemsCount, setApprovedItemsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch pending requests count (all types of pending requests)
    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const response = await fetch(
                    `/api/v1/tasks?filter[assigned_to_user_id]=${user_id}&filter[status]=Pending&per_page=1000`
                );
                const data = await response.json();
                if (response.ok) {
                    // Use meta.total for the actual count, not the limited per_page results
                    setPendingTasksCount(data.meta?.total || 0);
                }
            } catch (err) {
                console.error("Error fetching pending requests:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPendingRequests();
    }, [user_id]);

    // Fetch requested items count for warehouse notifications
    useEffect(() => {
        const fetchRequestedItems = async () => {
            try {
                const response = await fetch(
                    `api/v1/request-item?filter[status]=Pending&filter[is_requested]=false`
                );
                const data = await response.json();
                if (response.ok) {
                    setRequestedItemsCount(data.data?.total || 0);
                }
            } catch (err) {
                console.error("Error fetching requested items:", err);
            }
        };
        fetchRequestedItems();
    }, []);

    // Fetch pending material requests count for warehouse notifications
    useEffect(() => {
        const fetchPendingMaterialRequests = async () => {
            try {
                const response = await fetch(
                    `/api/v1/material-requests?filter[status_id]=4&per_page=1`
                );
                const data = await response.json();
                if (response.ok) {
                    setPendingMaterialRequestsCount(data.meta?.total || 0);
                }
            } catch (err) {
                console.error("Error fetching pending material requests:", err);
            }
        };
        fetchPendingMaterialRequests();
    }, []);

    // Fetch pending RFQ requests count for procurement notifications
    useEffect(() => {
        const fetchPendingRfqRequests = async () => {
            try {
                const response = await fetch(`/api/v1/rfq-requests`);
                const data = await response.json();
                if (response.ok) {
                    const requests = data.data || [];
                    // Filter for pending requests that haven't been requested yet
                    const pendingRequests = requests.filter(req => req.status === 'Pending' && !req.is_requested);
                    setPendingRfqRequestsCount(pendingRequests.length);
                }
            } catch (err) {
                console.error("Error fetching pending RFQ requests:", err);
            }
        };
        fetchPendingRfqRequests();
    }, []);

    // Fetch quotations RFQ count (RFQs with status_id 47 that don't have quotations or purchase orders)
    useEffect(() => {
        const fetchQuotationsRfqCount = async () => {
            try {
                // Fetch all RFQs with status_id 47
                const allRfqsResponse = await fetch(`/api/v1/rfqs?filter[status_id]=47&per_page=1000`);
                const allRfqsData = await allRfqsResponse.json();
                
                if (allRfqsResponse.ok) {
                    const allRfqs = allRfqsData.data || [];
                    
                    // Fetch all quotations to check which RFQs already have quotations
                    const quotationsResponse = await fetch("/api/v1/quotations");
                    const quotationsData = await quotationsResponse.json();
                    
                    // Fetch all purchase orders to check which RFQs already have POs
                    const purchaseOrdersResponse = await fetch("/api/v1/purchase-orders");
                    const purchaseOrdersData = await purchaseOrdersResponse.json();
                    
                    if (quotationsResponse.ok && purchaseOrdersResponse.ok) {
                        const quotations = quotationsData.data || [];
                        const purchaseOrders = purchaseOrdersData.data || [];
                        
                        // Create sets of RFQ IDs that already have quotations or purchase orders
                        const rfqIdsWithQuotation = new Set();
                        const rfqIdsWithPO = new Set();
                        
                        quotations.forEach((quotation) => {
                            if (quotation.rfq_id) {
                                rfqIdsWithQuotation.add(quotation.rfq_id);
                            }
                        });
                        
                        purchaseOrders.forEach((po) => {
                            if (po.rfq_id) {
                                rfqIdsWithPO.add(po.rfq_id);
                            }
                        });
                        
                        // Count RFQs that don't have quotations AND don't have purchase orders
                        const rfqsWithoutQuotationOrPO = allRfqs.filter((rfq) => 
                            !rfqIdsWithQuotation.has(rfq.id) && !rfqIdsWithPO.has(rfq.id)
                        );
                        
                        setQuotationsRfqCount(rfqsWithoutQuotationOrPO.length);
                    }
                }
            } catch (err) {
                console.error("Error fetching quotations RFQ count:", err);
            }
        };
        fetchQuotationsRfqCount();
    }, []);

    // Fetch purchase orders RFQ count (RFQs that have quotations but no purchase orders)
    useEffect(() => {
        const fetchPurchaseOrdersRfqCount = async () => {
            try {
                // First fetch all quotations to get RFQ IDs that have quotations
                const quotationsResponse = await fetch("/api/v1/quotations?per_page=1000");
                const quotationsData = await quotationsResponse.json();
                
                if (quotationsResponse.ok) {
                    const quotations = quotationsData.data || [];
                    
                    // Get unique RFQ IDs that have quotations
                    const rfqIdsWithQuotations = [...new Set(quotations.map(q => q.rfq_id).filter(id => id))];
                    
                    if (rfqIdsWithQuotations.length === 0) {
                        setPurchaseOrdersRfqCount(0);
                        return;
                    }
                    
                    // Fetch RFQs that don't have purchase orders
                    const rfqsResponse = await fetch("/api/v1/rfqs/without-purchase-orders");
                    const rfqsData = await rfqsResponse.json();
                    
                    if (rfqsResponse.ok && rfqsData.success && rfqsData.data) {
                        // Filter to only show RFQs that have quotations
                        const rfqsWithQuotations = rfqsData.data.filter(rfq => 
                            rfqIdsWithQuotations.includes(rfq.id)
                        );
                        setPurchaseOrdersRfqCount(rfqsWithQuotations.length);
                    } else {
                        setPurchaseOrdersRfqCount(0);
                    }
                }
            } catch (err) {
                console.error("Error fetching purchase orders RFQ count:", err);
                setPurchaseOrdersRfqCount(0);
            }
        };
        fetchPurchaseOrdersRfqCount();
    }, []);

    // Fetch unpaid invoices count
    useEffect(() => {
        const fetchUnpaidInvoicesCount = async () => {
            try {
                const response = await fetch("/api/v1/external-invoices?filter[status]=Unpaid&per_page=1");
                const data = await response.json();
                
                if (response.ok) {
                    setUnpaidInvoicesCount(data.meta?.total || 0);
                }
            } catch (err) {
                console.error("Error fetching unpaid invoices count:", err);
                setUnpaidInvoicesCount(0);
            }
        };
        fetchUnpaidInvoicesCount();
    }, []);

    // Fetch approved items count (same as approvedCount in RequestItemsContext)
    useEffect(() => {
        const fetchApprovedItemsCount = async () => {
            try {
                const params = { 
                    filter: { 
                        status: "Approved",
                        is_requested: false, // Only show items that haven't been requested yet
                        user_id: user_id
                    } 
                };
                const response = await fetch(`/api/v1/request-item?${new URLSearchParams({
                    'filter[status]': 'Approved',
                    'filter[is_requested]': 'false',
                    'filter[user_id]': user_id
                })}`);
                const data = await response.json();
                
                if (response.ok) {
                    // Extract the data array from the paginated response (same as RequestItemsContext)
                    const items = data.data?.data || data.data || [];
                    setApprovedItemsCount(items.length);
                }
            } catch (err) {
                console.error("Error fetching approved items count:", err);
                setApprovedItemsCount(0);
            }
        };
        fetchApprovedItemsCount();
    }, [user_id]);

    const hasPermission = (permission) => {
        const permissionMap = {
            "My Requests": "view_requests",
            "Task Center": "view_tasks",
            "Procurement Center": "view_procurement",
            "Finance Center": "view_finance",
            "Warehouse": "view_warehouse",
            "Budget & Accounts": "view_budget",
            "Statuses": "view_statuses",
            "Configuration Center": "view_configuration",
            "FAQs": "view_faqs",
            "User Manual": "view_user_manual",
            "Notification Settings": "manage_settings"
        };

        // If the permission is a direct permission name (not a mapped one)
        if (!permissionMap[permission]) {
            return permissions && permissions.includes(permission);
        }

        // Check mapped permission
        return permissions && permissions.includes(permissionMap[permission]);
    };

    // Filter dropdown items based on user permissions
    const filterDropdownItems = (items, requiredPermissions) => {
        return items.filter((item) => {
            // If no required permissions specified for this item, show it
            if (!item.requiredPermission) return true;
            // Otherwise, check if user has the required permission
            return hasPermission(item.requiredPermission);
        });
    };

    // Procurement Center dropdown items with permission requirements
    const basePurchaseDropdownItems = [
        {
            text: "RFQs",
            icon: faFileCirclePlus,
            onClick: () => router.visit("/rfqs"),
            notificationCount: pendingRfqRequestsCount,
            requiredPermission: "view_rfqs",
        },
        {
            text: "Quotations",
            icon: faFileInvoice,
            onClick: () => router.visit("/quotations"),
            notificationCount: quotationsRfqCount,
            requiredPermission: "view_quotations",
        },
        {
            text: "Purchase Orders",
            icon: faFileSignature,
            onClick: () => router.visit("/purchase-orders"),
            notificationCount: purchaseOrdersRfqCount,
            requiredPermission: "view_purchase_orders",
        },
        {
            text: "External Invoices",
            icon: faFileAlt,
            onClick: () => router.visit("/external-invoices"),
            notificationCount: unpaidInvoicesCount,
            requiredPermission: "view_invoices",
        },
    ];

    // Finance Center dropdown items with permission requirements
    const baseFinanceDropdownItems = [
        {
            text: "Maharat Invoices",
            icon: faFileInvoice,
            onClick: () => router.visit("/maharat-invoices"),
            requiredPermission: "view_maharat_invoices",
        },
        {
            text: "Payment Orders",
            icon: faMoneyCheckDollar,
            onClick: () => router.visit("/payment-orders"),
            requiredPermission: "view_payment_orders",
        },
        {
            text: "Account Receivables",
            icon: faFileInvoiceDollar,
            onClick: () => router.visit("/account-receivables"),
            requiredPermission: "view_account_receivables",
        },
        {
            text: "Account Payables",
            icon: faFileInvoice,
            onClick: () => router.visit("/account-payables"),
            requiredPermission: "view_account_payables",
        },
        {
            text: "Accounts",
            icon: faBook,
            onClick: () => router.visit("/accounts"),
            requiredPermission: "view_accounts",
        },
    ];

    // Warehouse dropdown items with permission requirements
    const baseWarehouseDropdownItems = [
        {
            text: "User Material Requests",
            icon: faFileAlt,
            onClick: () => router.visit("/material-requests"),
            notificationCount: pendingMaterialRequestsCount,
            requiredPermission: "view_material_requests",
        },
        {
            text: "Categories",
            icon: faListCheck,
            onClick: () => router.visit("/category"),
            requiredPermission: "view_warehouse",
        },
        {
            text: "Items",
            icon: faClipboardList,
            onClick: () => router.visit("/items"),
            requiredPermission: "view_warehouse",
            notificationCount: requestedItemsCount,
        },
        {
            text: "Goods Receiving Notes",
            icon: faFileInvoice,
            onClick: () => router.visit("/goods-receiving-notes"),
            requiredPermission: "view_goods_receiving_notes",
        },
        {
            text: "Inventory Tracking",
            icon: faChartBar,
            onClick: () => router.visit("/inventory-tracking"),
            requiredPermission: "view_warehouse",
        },
    ];

    // Budget dropdown items with permission requirements
    const baseBudgetDropdownItems = [
        {
            text: "Cost Centers",
            icon: faCoins,
            onClick: () => router.visit("/cost-centers"),
            requiredPermission: "view_budget",
        },
        {
            text: "Income Statement",
            icon: faChartLine,
            onClick: () => router.visit("/income-statement"),
            requiredPermission: "view_finance",
        },
        {
            text: "Balance Sheet",
            icon: faBalanceScale,
            onClick: () => router.visit("/balance-sheet"),
            requiredPermission: "view_finance",
        },
        {
            text: "Budget",
            icon: faMoneyBillWave,
            onClick: () => router.visit("/budget"),
            requiredPermission: "view_budget",
        },
        {
            text: "Request a Budget",
            icon: faFileSignature,
            onClick: () => router.visit("/request-budgets"),
            requiredPermission: "view_budget",
        },
    ];

    // Configuration dropdown items with permission requirements
    const baseConfigDropdownItems = [
        {
            text: "Organizational Chart",
            icon: faChartBar,
            onClick: () => router.visit("/chart"),
            requiredPermission: "view_org_chart",
        },
        {
            text: "Process Flow",
            icon: faDiagramProject,
            onClick: () => router.visit("/process-flow"),
            requiredPermission: "view_process_flow",
        },
        // Only show Notification Settings for users without parent_id (top-level users)
        ...(user.parent_id === null ? [{
            text: "Notification Settings",
            icon: faBell,
            onClick: () => router.visit("/notification-settings"),
            requiredPermission: "manage_settings",
        }] : []),
        {
            text: "Roles & Permission",
            icon: faUserPen,
            onClick: () => router.visit("/roles-permissions"),
            requiredPermission: "view_permission_settings",
        },
    ];

    // Filter dropdown items based on permissions
    const purchaseDropdownItems = filterDropdownItems(
        basePurchaseDropdownItems
    );
    const financeDropdownItems = filterDropdownItems(baseFinanceDropdownItems);
    const warehouseDropdownItems = filterDropdownItems(
        baseWarehouseDropdownItems
    );
    const budgetDropdownItems = filterDropdownItems(baseBudgetDropdownItems);
    const configDropdownItems = filterDropdownItems(baseConfigDropdownItems);

    // Calculate total procurement notifications
    const totalProcurementNotifications = pendingRfqRequestsCount + quotationsRfqCount + purchaseOrdersRfqCount + unpaidInvoicesCount;
    
    // Calculate total warehouse notifications
    const totalWarehouseNotifications = pendingMaterialRequestsCount + requestedItemsCount;

    // Determine which cards to show based on permissions
    const showRequestsCard = hasPermission("view_requests");
    const showTasksCard = hasPermission("view_tasks");
    const showProcurementCard = hasPermission("view_procurement");
    const showFinanceCard = hasPermission("view_finance");
    const showWarehouseCard = hasPermission("view_warehouse");
    const showBudgetCard = hasPermission("view_budget");
    const showStatusCard = hasPermission("view_statuses");
    const showConfigCard = hasPermission("view_configuration");
    

    return (
        <>
            <div
                className="relative w-full h-72 md:h-80 lg:h-60 bg-cover bg-center text-white p-6 rounded-3xl"
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 my-6">
                {showRequestsCard && (
                    <DashboardCard
                        icon={faClipboardList}
                        title="Requests"
                        subtitle="My Requests & History"
                        bgColor="bg-[#C4E4F0]"
                        iconColor="text-[#005372]"
                        onClick={() => router.visit("/my-requests")}
                        notificationCount={approvedItemsCount}
                    />
                )}
                {showTasksCard && (
                    <DashboardCard
                        icon={faListCheck}
                        title="Task Center"
                        subtitle="My Tasks & History"
                        bgColor="bg-[#F7EBBA]"
                        iconColor="text-[#665200]"
                        onClick={() => router.visit("/tasks")}
                        notificationCount={pendingTasksCount}
                    />
                )}
                {showProcurementCard && (
                    <DashboardCard
                        icon={faShoppingCart}
                        title="Procurement Center"
                        subtitle="Procurement System"
                        bgColor="bg-[#BFBCD8]"
                        iconColor="text-[#393559]"
                        dropdownItems={purchaseDropdownItems.length > 0 ? purchaseDropdownItems : null}
                        notificationCount={totalProcurementNotifications}
                    />
                )}
                {showFinanceCard && (
                    <DashboardCard
                        icon={faBoxes}
                        title="Finance Center"
                        subtitle="Financials"
                        bgColor="bg-[#C4E4F0]"
                        iconColor="text-[#005372]"
                        dropdownItems={financeDropdownItems.length > 0 ? financeDropdownItems : null}
                    />
                )}
                {showWarehouseCard && (
                    <DashboardCard
                        icon={faWarehouse}
                        title="Warehouse"
                        subtitle="Warehouse Management"
                        bgColor="bg-[#F7EBBA]"
                        iconColor="text-[#665200]"
                        dropdownItems={warehouseDropdownItems.length > 0 ? warehouseDropdownItems : null}
                        onClick={() => router.visit("/warehouse-management")}
                        notificationCount={totalWarehouseNotifications}
                    />
                )}
                {showBudgetCard && (
                    <DashboardCard
                        icon={faCalculator}
                        title="Budget & Accounts"
                        subtitle="Planning & Accounting"
                        bgColor="bg-[#F7CCCC]"
                        iconColor="text-[#661E1E]"
                        dropdownItems={budgetDropdownItems.length > 0 ? budgetDropdownItems : null}
                    />
                )}
                {showStatusCard && (
                    <DashboardCard
                        icon={faClipboardList}
                        title="Status"
                        subtitle="All Statuses"
                        bgColor="bg-[#B9BBBD]"
                        iconColor="text-[#2C323C]"
                        onClick={() => router.visit("/statuses")}
                    />
                )}
                {showConfigCard && (
                    <DashboardCard
                        icon={faCogs}
                        title="Configuration Center"
                        subtitle="Process Flow"
                        bgColor="bg-[#DEEEE9]"
                        iconColor="text-[#074D38]"
                        dropdownItems={configDropdownItems.length > 0 ? configDropdownItems : null}
                    />
                )}
            </div>
        </>
    );
}
