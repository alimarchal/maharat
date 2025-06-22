import React, { useState, useEffect } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import SelectFloating from "@/Components/SelectFloating";
import ApproveOrder from "./ApproveOrder";

const FileDisplay = ({ file }) => {
    // Helper function to fix file paths and extensions
    const fixFilePath = (filePath) => {
        if (!filePath) return null;
        let fixedPath = filePath;
        if (fixedPath.endsWith(".pdf.pdf")) {
            fixedPath = fixedPath.replace(".pdf.pdf", ".pdf");
        }
        // Always use /storage/quotations/filename.pdf for quotations
        if (fixedPath.includes("quotations/")) {
            const fileName = fixedPath.split("quotations/").pop();
            fixedPath = `/storage/quotations/${fileName}`;
        }
        // Remove /public if present
        fixedPath = fixedPath.replace("/storage/public/", "/storage/");
        return fixedPath;
    };

    // Directly open the file for quotations
    const openFile = (filePath) => {
        window.open(filePath, "_blank");
    };

    if (!file) return <span className="text-gray-500">No document attached</span>;

    const fileUrl = file.file_path ? fixFilePath(file.file_path) : null;

    // Fix display name if needed
    let displayName = file.original_name || "Document";
    if (displayName.endsWith(".pdf.pdf")) {
        displayName = displayName.replace(".pdf.pdf", ".pdf");
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && openFile(fileUrl)}
            />
            {displayName && (
                <span
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && openFile(fileUrl)}
                >
                    {displayName}
                </span>
            )}
        </div>
    );
};

export default function CreatePurchaseOrder() {
    const [quotations, setQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [purchaseOrders, setPurchaseOrders] = useState([]);

    const fetchRfqs = async () => {
        try {
            const response = await axios.get(
                "/api/v1/rfqs/without-purchase-orders"
            );
            if (response.data && response.data.success && response.data.data) {
                setRfqs(response.data.data);
            } else {
                setError("No RFQs found without purchase orders");
                setRfqs([]);
            }
        } catch (error) {
            setError(
                "Failed to load RFQs: " +
                    (error.response?.data?.message || "Unknown error")
            );
            setRfqs([]);
        }
    };

    const fetchQuotations = async () => {
        setLoading(true);

        try {
            let url = "/api/v1/quotations";
            const params = {
                page: currentPage,
                include: "rfq,purchaseOrder,documents",
                per_page: 10,
            };
            const response = await axios.get(url, { params });
            let quotationsData = response.data.data || [];

            if (selectedRfq && selectedRfq !== "all") {
                quotationsData = quotationsData.filter(
                    (quotation) =>
                        quotation.rfq &&
                        quotation.rfq.id === parseInt(selectedRfq)
                );
            } else if (selectedRfq === "all") {
                quotationsData = quotationsData;
            } else {
                quotationsData = [];
            }

            // First, fetch all purchase orders to check which quotations have POs
            const purchaseOrdersResponse = await axios.get(
                "/api/v1/purchase-orders"
            );
            const purchaseOrdersData = purchaseOrdersResponse.data.data || [];
            const quotationIdsWithPO = new Set(
                purchaseOrdersData.map((po) => po.quotation_id)
            );
            setPurchaseOrders(purchaseOrdersData);

            // Get all RFQ IDs that already have purchase orders
            const rfqIdsWithPO = new Set();
            purchaseOrdersData.forEach((po) => {
                if (po.quotation && po.quotation.rfq_id) {
                    rfqIdsWithPO.add(po.quotation.rfq_id);
                }
            });

            const quotationsWithDetails = await Promise.all(
                quotationsData.map(async (quotation) => {
                    let categoryName = "N/A";

                    if (quotation.rfq && quotation.rfq.id) {
                        try {
                            const categoryResponse = await axios.get(
                                `/api/v1/rfq-categories/${quotation.rfq.id}`
                            );
                            categoryName =
                                categoryResponse.data.data.category_name;
                        } catch (error) {
                            console.error("Error fetching category:", error);
                        }
                    }
                    const hasPurchaseOrder = quotationIdsWithPO.has(
                        quotation.id
                    );
                    const rfqHasPurchaseOrder = quotation.rfq && quotation.rfq.id ? rfqIdsWithPO.has(quotation.rfq.id) : false;
                    
                    return {
                        ...quotation,
                        category_name: categoryName,
                        has_purchase_order: hasPurchaseOrder,
                        rfq_has_purchase_order: rfqHasPurchaseOrder,
                    };
                })
            );

            if (quotationsWithDetails.length > 0) {
                quotationsWithDetails.sort((a, b) => a.id - b.id);
            }
            setQuotations(quotationsWithDetails);
            setLastPage(response.data.meta?.last_page || 1);
            setError("");
        } catch (error) {
            setError(
                "Failed to load quotations: " +
                    (error.response?.data?.message || "Unknown error")
            );
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRfqs();
    }, []);

    useEffect(() => {
        fetchQuotations();
    }, [currentPage, selectedRfq]);

    const handleRfqChange = (e) => {
        setSelectedRfq(e.target.value);
        setCurrentPage(1);
    };

    const handleCreatePO = (quotation) => {
        setSelectedQuotation(quotation);
        setIsModalOpen(true);
    };

    const handleEditPO = (quotation) => {
        const purchaseOrder = purchaseOrders.find(
            (po) => po.quotation_id === quotation.id
        );
        setSelectedQuotation({
            ...quotation,
            purchaseOrder: purchaseOrder,
        });
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedQuotation(null);
        fetchQuotations();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center my-6">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Create Purchase Order
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        List of RFQs that have no Purchase Orders
                    </p>
                </div>
                <div className="w-1/3">
                    <SelectFloating
                        label="RFQ to View Quotations"
                        name="rfq"
                        value={selectedRfq || ""}
                        onChange={handleRfqChange}
                        options={[
                            ...rfqs.map((rfq) => ({
                                id: rfq.id,
                                label: rfq.rfq_number,
                            })),
                        ]}
                        className="min-h-[70px] py-2"
                    />
                </div>
            </div>

            <div className="w-full overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Quotation #
                            </th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Supplier Name</th>
                            <th className="py-3 px-4">Total Amount</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-center">Attachment</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {!selectedRfq ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Please select an RFQ to view quotations
                                </td>
                            </tr>
                        ) : loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-12">
                                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="text-center text-red-500 font-medium py-4"
                                >
                                    {error}
                                </td>
                            </tr>
                        ) : quotations.length > 0 ? (
                            quotations.map((quotation) => (
                                <tr key={quotation.id}>
                                    <td className="px-3 py-4">
                                        {quotation.quotation_number || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {quotation.category_name || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {quotation.supplier?.name || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {quotation.total_amount || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {formatDate(quotation.created_at)}
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex justify-center">
                                            {quotation.documents && quotation.documents[0] ? (
                                                <button
                                                    className="w-8 h-8"
                                                    onClick={() => {
                                                        const filePath = quotation.documents[0].file_path;
                                                        if (filePath) {
                                                            const fixedPath = filePath.startsWith("http") 
                                                                ? filePath 
                                                                : filePath.startsWith("/storage/") 
                                                                    ? filePath 
                                                                    : filePath.startsWith("quotations/") 
                                                                        ? `/storage/${filePath}` 
                                                                        : filePath;
                                                            window.open(fixedPath, "_blank");
                                                        }
                                                    }}
                                                    title="View Document"
                                                >
                                                    <img
                                                        src="/images/pdf-file.png"
                                                        alt="PDF"
                                                        className="w-full h-full"
                                                    />
                                                </button>
                                            ) : (
                                                <span className="text-gray-500">
                                                    No document attached
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        {quotation.has_purchase_order ? (
                                            <span className="text-gray-400">Created</span>
                                        ) : quotation.rfq_has_purchase_order ? (
                                            <span className="text-gray-400">PO Requested</span>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleCreatePO(quotation)
                                                }
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <PlusCircleIcon className="h-6 w-6" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    No quotations found for the selected RFQ
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && !error && quotations.length > 0 && (
                    <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                        {Array.from(
                            { length: lastPage },
                            (_, index) => index + 1
                        ).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 ${
                                    currentPage === page
                                        ? "bg-[#009FDC] text-white"
                                        : "border border-[#B9BBBD] bg-white"
                                } rounded-full hover:bg-[#0077B6] transition`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                                currentPage >= lastPage
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                            disabled={currentPage >= lastPage}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* ApproveOrder Modal */}
            {isModalOpen && (
                <ApproveOrder
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSave={handleModalClose}
                    quotationId={selectedQuotation?.id}
                    purchaseOrder={selectedQuotation?.purchaseOrder}
                    isEdit={selectedQuotation?.has_purchase_order}
                />
            )}
        </div>
    );
}