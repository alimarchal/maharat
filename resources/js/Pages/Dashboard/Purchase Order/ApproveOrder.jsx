import React, { useState, useEffect } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { Link, router, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faEdit,
    faTrash,
    faCheck,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { usePage } from "@inertiajs/react";

const FileDisplay = ({ file, pendingFile }) => {
    if (pendingFile) {
        const tempUrl = URL.createObjectURL(pendingFile);
        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon 
                    className="h-10 w-10 text-orange-500 cursor-pointer hover:text-orange-700 transition-colors"
                    onClick={() => window.open(tempUrl, "_blank")}
                />
                <span className="text-sm text-orange-600 text-center break-words whitespace-normal w-full">
                    {pendingFile.name} (Pending save)
                </span>
            </div>
        );
    }

    if (!file)
        return <span className="text-gray-500">No document attached</span>;

    // Show the existing file
    let fileUrl;
    let displayName;

    if (typeof file === "object") {
        fileUrl = file.file_path;
        displayName = file.original_name;
    } else {
        // If file is a string path
        fileUrl = file.startsWith("http") ? file : `/storage/${file}`;
        displayName = "View Attachment";
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon 
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && window.open(fileUrl, "_blank")}
            />
            <span 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                onClick={() => fileUrl && window.open(fileUrl, "_blank")}
            >
                {displayName}
            </span>
        </div>
    );
};

export default function ApproveOrder({ auth }) {
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    const quotationId = urlParams.get("quotation_id");

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [attachingFile, setAttachingFile] = useState(false);
    const [tempDocuments, setTempDocuments] = useState({});
    const [quotationDetails, setQuotationDetails] = useState(null);
    const [companies, setCompanies] = useState([]);

    const fetchPurchaseOrders = async () => {
        if (!quotationId) {
            setError("No quotation ID provided");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((oldProgress) =>
                oldProgress >= 90 ? 90 : oldProgress + 10
            );
        }, 300);

        try {
            // Fetch companies first if not already loaded
            if (companies.length === 0) {
                await fetchCompanies();
            }

            // Fetch the quotation details with company information
            const quotationResponse = await axios.get(
                `/api/v1/quotations/${quotationId}`
            );
            const quotationData = quotationResponse.data.data;
            setQuotationDetails(quotationData);

            // Get purchase orders with included relations and pagination
            const poResponse = await axios.get("/api/v1/purchase-orders", {
                    params: {
                    quotation_id: quotationId,
                    include: "quotation,supplier",
                    per_page: 10,
                    page: currentPage,
                },
            });

            if (poResponse.data && poResponse.data.data) {
                const processedOrders = await Promise.all(
                    poResponse.data.data.map(async (order) => {
                        let formattedOrder = { ...order };
                        let companyName = "N/A";

                        // Try to get company name from different sources
                        if (order.quotation && order.quotation.company_name) {
                            companyName = order.quotation.company_name;
                        } else if (quotationData.company_name) {
                            companyName = quotationData.company_name;
                        } else if (order.company_name) {
                            companyName = order.company_name;
                        }

                        // Set company details
                        formattedOrder.company_name = companyName;
                        if (companies.length > 0) {
                            const company = companies.find(
                                (c) => c.name === companyName
                            );
                            if (company) {
                                formattedOrder.company_id = company.id;
                            }
                        }

                        // Process attachment
                        if (order.attachment) {
                            formattedOrder.attachment = {
                                file_path: order.attachment.startsWith("http")
                                    ? order.attachment
                                    : `/storage/${order.attachment}`,
                                original_name:
                                    order.original_name || "View Attachment",
                            };
                        }

                        return formattedOrder;
                    })
                );

                setPurchaseOrders(processedOrders);
                setLastPage(poResponse.data.meta?.last_page || 1);
            } else {
                // Create new PO if none exists
                const newPurchaseOrder = {
                    id: `new-${Date.now()}`,
                    purchase_order_no: "System Generated",
                    quotation_id: quotationId,
                    supplier_id: quotationData.supplier_id,
                    purchase_order_date: "",
                    expiry_date: quotationData.valid_until || "",
                    amount: 0,
                    status: "Draft",
                    company_name: quotationData.company_name || "",
                    company_id: quotationData.company_id,
                    quotation_number: quotationData.quotation_number || "",
                    attachment: null,
                    original_name: null,
                };
                
                setPurchaseOrders([newPurchaseOrder]);
                setLastPage(1);
            }
            
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error("API Error:", error);
            setError(
                `Failed to load data: ${
                    error.response?.data?.message || error.message
                }`
            );
            setPurchaseOrders([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
        }
    };

    // Fetch companies for dropdown
    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            if (response.data && response.data.data) {
            setCompanies(response.data.data);
                console.log("Companies fetched:", response.data.data);
            } else {
                console.error("Invalid companies data format:", response.data);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    useEffect(() => {
        // Load companies for dropdown
        fetchCompanies();
        
        // Then fetch purchase orders
        fetchPurchaseOrders();
        
        // Add event listener for beforeunload to warn about unsaved changes
        const handleBeforeUnload = (e) => {
            if (editingId !== null) {
                e.preventDefault();
                e.returnValue = "";
                return "You have unsaved changes. Are you sure you want to leave?";
            }
        };
        
        window.addEventListener("beforeunload", handleBeforeUnload);
        
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [quotationId, currentPage]); // Keep currentPage as dependency

    const handleSave = async (id) => {
        try {
            setAttachingFile(true);
            setProgress(0);
            
            const interval = setInterval(() => {
                setProgress((oldProgress) => Math.min(oldProgress + 5, 90));
            }, 200);
            
            // Create FormData to handle file uploads
            const formData = new FormData();
            
            // Required field status to avoid validation errors
            if (!editData.status) {
                formData.append("status", "Draft");
            }
            
            // Append basic purchase order fields
            // For new records, don't include purchase_order_no - let backend generate it
            Object.keys(editData).forEach((key) => {
                if (
                    key !== "id" &&
                    key !== "company_name" &&
                    key !== "quotation_number" &&
                    !key.startsWith("new-") &&
                    !(
                        id.toString().includes("new-") &&
                        key === "purchase_order_no"
                    )
                ) {
                    // Only append if the value exists
                    if (
                        editData[key] !== null &&
                        editData[key] !== undefined &&
                        editData[key] !== ""
                    ) {
                        formData.append(key, editData[key]);
                    }
                }
            });
            
            // Make sure required fields are present
            if (!formData.has("quotation_id") && quotationId) {
                formData.append("quotation_id", quotationId);
            }
            
            if (!formData.has("supplier_id") && quotationDetails?.supplier_id) {
                formData.append("supplier_id", quotationDetails.supplier_id);
            }
            
            // Handle temporary file if it exists
            if (tempDocuments[id]) {
                formData.append("attachment", tempDocuments[id]);
                formData.append("original_name", tempDocuments[id].name);
            }
            
            console.log(
                "Saving purchase order with data:",
                Object.fromEntries(formData)
            );
            
            let response;
            try {
                if (id.toString().includes("new-")) {
                    response = await axios.post(
                        "/api/v1/purchase-orders",
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                        }
                    );
                } else {
                    response = await axios.put(
                        `/api/v1/purchase-orders/${id}`,
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                        }
                    );
                }
                const POResponse = response.data.data;

                try {
                    // Get the logged-in user ID
                    const loggedUser = auth.user?.id;

                    // Get process information with error handling
                    const processResponse = await axios.get(
                        "/api/v1/processes?include=steps,creator,updater&filter[title]=Purchase Order Approval"
                    );

                    // Check if we have valid process data
                    if (
                        processResponse.data.data &&
                        processResponse.data.data.length > 0
                    ) {
                        const process = processResponse.data.data[0];

                        // Check if process has steps
                        if (process.steps && process.steps.length > 0) {
                            const processStep = process.steps[0];

                            // Only proceed if we have a valid process step
                            if (processStep && processStep.order) {
                                const processResponseViaUser = await axios.get(
                                    `/api/v1/process-steps/${processStep.order}/user/${loggedUser}`
                                );

                                // Check if we have valid user assignment data
                                if (
                                    processResponseViaUser?.data?.user?.user?.id
                                ) {
                                    const assignUser =
                                        processResponseViaUser.data;

                                    // Create approval transaction
                                    const POApprovalTransactionPayload = {
                                        purchase_order_id: POResponse.id,
                                        requester_id: loggedUser,
                                        assigned_to: assignUser.user.user.id,
                                        order: processStep.order,
                                        description: processStep.description,
                                        status: "Pending",
                                    };
                                    await axios.post(
                                        "/api/v1/po-approval-transactions",
                                        POApprovalTransactionPayload
                                    );

                                    // Create task
                                    const taskPayload = {
                                        process_step_id: processStep.id,
                                        process_id: processStep.process_id,
                                        assigned_at: new Date().toISOString(),
                                        urgency: "Normal",
                                        assigned_to_user_id:
                                            assignUser.user.user.id,
                                        assigned_from_user_id: loggedUser,
                                        purchase_order_id: POResponse.id,
                                    };
                                    await axios.post(
                                        "/api/v1/tasks",
                                        taskPayload
                                    );
                                }
                            }
                        }
                    }
                } catch (approvalError) {
                    console.error("Approval process error:", approvalError);
                    // Don't throw the error - allow the purchase order to be saved even if approval process fails
                }
                
                // Reset editing state and refresh data
                setEditingId(null);
                setError("");
                
                // Clear interval and set progress to 100%
                clearInterval(interval);
                setProgress(100);
                
                // Show success message
                alert("Purchase order saved successfully!");
                
                // Wait a moment to show the 100% progress, then refresh data
                setTimeout(() => {
                    setAttachingFile(false);
                    fetchPurchaseOrders();
                }, 500);
            } catch (error) {
                clearInterval(interval);
                console.error(
                    "Save error:",
                    error.response?.data || error.message
                );
                setError(
                    `Failed to save purchase order: ${
                        error.response?.data?.message || error.message
                    }`
                );
                setAttachingFile(false);
                setProgress(0);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            setError(`An unexpected error occurred: ${error.message}`);
            setAttachingFile(false);
            setProgress(0);
        }
    };
            
    const handleEdit = (po) => {
        // Create a clean copy of the PO data for editing
        const editablePo = { ...po };

        // If attachment is in object form, keep the structure
        if (
            editablePo.attachment &&
            typeof editablePo.attachment === "object"
        ) {
            // Keep attachment as is
        }
        // If it's a string path, leave as is - the backend expects either a file or null

        console.log("Editing purchase order:", editablePo);
        setEditingId(po.id);
        setEditData({ ...po });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this purchase order?"))
            return;

        try {
            if (id.toString().includes("new-")) {
                setPurchaseOrders((prevOrders) =>
                    prevOrders.filter((po) => po.id !== id)
                );
            } else {
                await axios.delete(`/api/v1/purchase-orders/${id}`);
                fetchPurchaseOrders();
            }
        } catch (error) {
            console.error("Delete error:", error);
            setError("Failed to delete purchase order");
        }
    };

    const addItem = () => {
        const newPurchaseOrder = {
            id: `new-${Date.now()}`,
            purchase_order_no: "System Generated", // This will be generated by backend
            quotation_id: quotationId,
            supplier_id: quotationDetails?.supplier_id || null,
            purchase_order_date: "",
            expiry_date: "",
            amount: 0,
            status: "Draft",
            company_name: "",
            quotation_number: quotationDetails?.quotation_number || "",
            attachment: null,
            original_name: null,
        };

        // Add the new purchase order to the end of the list
        setPurchaseOrders((prevOrders) => [...prevOrders, newPurchaseOrder]);

        // Calculate the last page after adding the new item
        const totalItems = purchaseOrders.length + 1;
        const itemsPerPage = 10;
        const newLastPage = Math.ceil(totalItems / itemsPerPage);

        // Set current page to the last page where the new item will appear
        setCurrentPage(newLastPage);

        // Set editing state for the new item
        setEditingId(newPurchaseOrder.id);
        setEditData(newPurchaseOrder);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format for input
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "DD/MM/YYYY";
            }
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch (error) {
            return "DD/MM/YYYY";
        }
    };

    const handleFileUpload = (poId, file) => {
        if (!file) {
            setError("No file selected.");
            return;
        }
        
        // Store the file temporarily - DO NOT upload immediately
        setTempDocuments({
            ...tempDocuments,
            [poId]: file,
        });
    };

    const getPaginationData = () => {
        const itemsPerPage = 10;
        const totalItems = purchaseOrders.length;
        const calculatedLastPage = Math.max(
            1,
            Math.ceil(totalItems / itemsPerPage)
        );

        // Ensure current page is within valid range
        const validCurrentPage = Math.min(
            Math.max(1, currentPage),
            calculatedLastPage
        );

        // Calculate start and end indices for current page
        const startIndex = (validCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        // Get current page's data
        const currentPageData = purchaseOrders.slice(startIndex, endIndex);

        return {
            totalItems,
            itemsPerPage,
            lastPage: calculatedLastPage,
            currentPage: validCurrentPage,
            currentPageData,
        };
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/create-order")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}
                            className="mr-2 text-2xl"
                        />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link
                        href="/dashboard"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Home
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <Link
                        href="/purchase"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Procurement Center
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <Link
                        href="/view-order"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Purchase Orders
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <Link
                        href="/create-order"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Create Purchase Order
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <span className="text-[#009FDC] text-xl">
                        Approve Purchase Order
                    </span>
                </div>
                <Head title="Approve Purchase Order" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">
                            Approve Purchase Order
                        </h2>
                    </div>

                    {quotationDetails && (
                        <p className="text-purple-600 text-2xl mb-6">
                            {quotationDetails.quotation_number}
                        </p>
                    )}

                    {/* Loading Bar - Reverted to original style */}
                        {(loading || attachingFile) && (
                            <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                                <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                    <div
                                        className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    <span className="absolute text-white">
                                    {attachingFile
                                        ? "Saving Purchase Order..."
                                        : progress < 60
                                        ? "Please Wait, Fetching Details..."
                                        : `${progress}%`}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                    {/* Error message */}
                    {!loading && error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Only show content when not loading */}
                    {!loading && !attachingFile && (
                        <>
                            <div className="w-full overflow-hidden">
                        <table className="w-full">
                                    {!loading && (
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">
                                                    PO#
                                                </th>
                                                <th className="py-3 px-4 text-center">
                                                    Company
                                                </th>
                                                <th className="py-3 px-4 text-center">
                                                    Issue Date
                                                </th>
                                                <th className="py-3 px-4 text-center">
                                                    Expiry Date
                                                </th>
                                                <th className="py-3 px-4 text-center">
                                                    Amount
                                                </th>
                                                <th className="py-3 px-4 text-center">
                                                    Attachment
                                                </th>
                                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                                    Actions
                                                </th>
                                </tr>
                            </thead>
                                    )}

                            {!loading && !attachingFile && (
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {purchaseOrders.length > 0 ? (
                                                getPaginationData().currentPageData.map(
                                                    (po) => (
                                        <tr key={po.id}>
                                            <td className="px-6 py-4 text-center break-words whitespace-normal min-w-[120px] max-w-[150px]">
                                                {/* PO Number is read-only as it's system generated */}
                                                <span className="inline-block break-words w-full text-[17px] text-black">
                                                                    {
                                                                        po.purchase_order_no
                                                                    }
                                                </span>
                                            </td>
                                            
                                            <td className="px-6 py-4 text-center break-words whitespace-normal min-w-[150px] max-w-[170px]">
                                                                {editingId ===
                                                                po.id ? (
                                                    <select
                                                                        value={
                                                                            editData.company_name ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setEditData(
                                                                                {
                                                                                    ...editData,
                                                                                    company_name:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                }
                                                                            )
                                                        }
                                                        className="text-[17px] text-black bg-transparent border-none focus:ring-0 w-full text-center break-words"
                                                                        style={{
                                                                            wordWrap:
                                                                                "break-word",
                                                                            overflowWrap:
                                                                                "break-word",
                                                                        }}
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                            a
                                                                            company
                                                            </option>
                                                                        {companies.map(
                                                                            (
                                                                                company
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        company.id
                                                                                    }
                                                                                    value={
                                                                                        company.name
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        company.name
                                                                                    }
                                                                                </option>
                                                                            )
                                                                        )}
                                                    </select>
                                                ) : (
                                                    <span className="inline-block break-words w-full text-[17px] text-black">
                                                                        {po.company_name ||
                                                                            "N/A"}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                {editingId ===
                                                                po.id ? (
                                                    <input
                                                        type="date"
                                                                        value={
                                                                            editData.purchase_order_date
                                                                                ? formatDateForInput(
                                                                                      editData.purchase_order_date
                                                                                  )
                                                                                : ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setEditData(
                                                                                {
                                                                                    ...editData,
                                                                                    purchase_order_date:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                }
                                                                            )
                                                                        }
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                        placeholder="DD/MM/YYYY"
                                                    />
                                                ) : (
                                                                    formatDateForDisplay(
                                                                        po.purchase_order_date
                                                                    ) ||
                                                                    "DD/MM/YYYY"
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                {editingId ===
                                                                po.id ? (
                                                    <input
                                                        type="date"
                                                                        value={
                                                                            editData.expiry_date
                                                                                ? formatDateForInput(
                                                                                      editData.expiry_date
                                                                                  )
                                                                                : ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setEditData(
                                                                                {
                                                                                    ...editData,
                                                                                    expiry_date:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                }
                                                                            )
                                                                        }
                                                        className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-full text-center"
                                                        placeholder="DD/MM/YYYY"
                                                    />
                                                ) : (
                                                                    formatDateForDisplay(
                                                                        po.expiry_date
                                                                    ) ||
                                                                    "DD/MM/YYYY"
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-normal break-words text-center min-w-[120px]">
                                                                {editingId ===
                                                                po.id ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        {/* Decrement Button */}
                                                        <button
                                                            onClick={() =>
                                                                                setEditData(
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                    ...prev,
                                                                                        amount: Math.max(
                                                                                            0,
                                                                                            parseInt(
                                                                                                prev.amount ||
                                                                                                    0
                                                                                            ) -
                                                                                                1
                                                                                        ),
                                                                                    })
                                                                                )
                                                            }
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-5 w-5"
                                                                                viewBox="0 0 20 20"
                                                                                fill="currentColor"
                                                                            >
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                            </svg>
                                                        </button>

                                                        {/* Input Field */}
                                                        <input
                                                            type="number"
                                                                            value={parseInt(
                                                                                editData.amount ||
                                                                                    0
                                                                            )}
                                                                            onChange={(
                                                                                e
                                                                            ) => {
                                                                                const value =
                                                                                    Math.max(
                                                                                        0,
                                                                                        Math.floor(
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    ); // Ensure whole number & no negatives
                                                                                setEditData(
                                                                                    {
                                                                                        ...editData,
                                                                                        amount: value,
                                                                                    }
                                                                                );
                                                            }}
                                                            className="text-[17px] text-gray-900 bg-transparent border-none focus:ring-0 w-[70px] text-center [&::-webkit-inner-spin-button]:hidden"
                                                        />

                                                        {/* Increment Button */}
                                                        <button
                                                            onClick={() =>
                                                                                setEditData(
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                    ...prev,
                                                                                        amount:
                                                                                            parseInt(
                                                                                                prev.amount ||
                                                                                                    0
                                                                                            ) +
                                                                                            1,
                                                                                    })
                                                                                )
                                                            }
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-5 w-5"
                                                                                viewBox="0 0 20 20"
                                                                                fill="currentColor"
                                                                            >
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                                    <span className="break-words min-w-[100px] inline-block">
                                                                        {parseInt(
                                                                            po.amount ||
                                                                                0
                                                                        ).toLocaleString()}
                                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    {/* Show pending file preview or the existing document */}
                                                                    {tempDocuments[
                                                                        po.id
                                                                    ] ? (
                                                                        <FileDisplay
                                                                            pendingFile={
                                                                                tempDocuments[
                                                                                    po
                                                                                        .id
                                                                                ]
                                                                            }
                                                                        />
                                                    ) : po.attachment ? (
                                                                        <FileDisplay
                                                                            file={
                                                                                po.attachment
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-500">
                                                                            No
                                                                            document
                                                                            attached
                                                                        </span>
                                                                    )}

                                                                    {editingId ===
                                                                        po.id && (
                                                        <>
                                                            <input
                                                                type="file"
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    handleFileUpload(
                                                                                        po.id,
                                                                                        e
                                                                                            .target
                                                                                            .files[0]
                                                                                    )
                                                                                }
                                                                className="hidden"
                                                                id={`file-input-${po.id}`}
                                                                accept=".pdf,.doc,.docx"
                                                            />
                                                            <label 
                                                                htmlFor={`file-input-${po.id}`}
                                                                className="mt-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                                                            >
                                                                                {tempDocuments[
                                                                                    po
                                                                                        .id
                                                                                ] ||
                                                                                po.attachment
                                                                                    ? "Replace file"
                                                                                    : "Attach file"}
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-3">
                                                                    {editingId ===
                                                                    po.id ? (
                                                        <button
                                                                            onClick={() =>
                                                                                handleSave(
                                                                                    po.id
                                                                                )
                                                                            }
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faCheck
                                                                                }
                                                                                className="h-5 w-5"
                                                                            />
                                                        </button>
                                                    ) : (
                                                        <button
                                                                            onClick={() =>
                                                                                handleEdit(
                                                                                    po
                                                                                )
                                                                            }
                                                            className="text-gray-600 hover:text-gray-600"
                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faEdit
                                                                                }
                                                                                className="h-5 w-5"
                                                                            />
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                po.id
                                                                            )
                                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faTrash
                                                                            }
                                                                            className="h-5 w-5"
                                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                                    )
                                                )
                                ) : (
                                    <tr>
                                                    <td
                                                        colSpan="7"
                                                        className="text-center py-4"
                                                    >
                                                        No purchase order
                                                        available.
                                                    </td>
                                    </tr>
                                )}
                            </tbody>
                            )}
                        </table>
                        
                                {/* Add Purchase Order Button */}
                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={addItem}
                                        className="px-3 py-1 bg-[#009FDC] text-white rounded-full"
                                    >
                                        Add Purchase Order
                                    </button>
                                </div>

                                {/* Pagination */}
                                {purchaseOrders.length > 0 && (
                                    <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                                        <button
                                            onClick={() =>
                                                setCurrentPage(
                                                    getPaginationData()
                                                        .currentPage - 1
                                                )
                                            }
                                            className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                                getPaginationData()
                                                    .currentPage <= 1
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}
                                            disabled={
                                                getPaginationData()
                                                    .currentPage <= 1
                                            }
                                        >
                                            Previous
                                        </button>
                                        {Array.from(
                                            {
                                                length: getPaginationData()
                                                    .lastPage,
                                            },
                                            (_, index) => index + 1
                                        ).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                className={`px-3 py-1 ${
                                                    getPaginationData()
                                                        .currentPage === page
                                                        ? "bg-[#009FDC] text-white"
                                                        : "border border-[#B9BBBD] bg-white text-black"
                                                } rounded-full`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setCurrentPage(
                                                    getPaginationData()
                                                        .currentPage + 1
                                                )
                                            }
                                            className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                                getPaginationData()
                                                    .currentPage >=
                                                getPaginationData().lastPage
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}
                                            disabled={
                                                getPaginationData()
                                                    .currentPage >=
                                                getPaginationData().lastPage
                                            }
                                        >
                                            Next
                                </button>
                            </div>
                        )}
                    </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
