import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InvoiceModal from "./InvoiceModal";
import { usePage } from "@inertiajs/react";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const FileDisplay = ({ file, pendingFile }) => {
    // Helper function to fix file paths and extensions
    const fixFilePath = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith("http")) return filePath;
        if (filePath.startsWith("/storage/")) return filePath;
        if (filePath.startsWith("invoices/")) return `/storage/${filePath}`;
        return filePath;
    };

    // Directly open the file for invoices
    const openFile = (filePath) => {
        window.open(filePath, "_blank");
    };

    // If there's a pending file to be uploaded, show it as a preview with an indicator
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

const InvoicesTable = () => {
    const user_id = usePage().props.auth.user.id;

    const [invoices, setInvoices] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isEdit, setIsEdit] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);

        try {
            const response = await axios.get(
                `/api/v1/external-invoices?page=${currentPage}&include=supplier,purchaseOrder,documents`
            );

            if (response.data && response.data.data) {
                setInvoices(response.data.data);
                setLastPage(response.data.meta.last_page);
                setError("");
            }
        } catch (error) {
            // Only set error if it's an actual API error, not just empty results
            if (error.response?.status === 404 || error.response?.status === 500) {
                setError("Failed to load invoices");
            } else {
                setError("");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get("/api/v1/suppliers");
            setSuppliers(response.data.data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchSuppliers();
    }, [currentPage]);

    const handleAddInvoice = () => {
        setIsEdit(false);
        setSelectedInvoice(null);
        setIsModalOpen(true);
    };

    const handleEditInvoice = (invoice) => {
        setIsEdit(true);
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleSaveInvoice = async (formData) => {
        // The modal already handles the API call, just refresh the data
                await fetchInvoices();
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/external-invoices/${id}`);
            fetchInvoices();
        } catch (error) {
            setError(
                "Failed to delete record: " +
                    (error.response?.data?.message || error.message)
            );
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const optionsDate = {
                year: "numeric",
                month: "long",
                day: "numeric",
            };
            const optionsTime = {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            };
            const dateObj = new Date(dateString);

            if (isNaN(dateObj.getTime())) {
                return "Invalid Date";
            }

            const formattedDate = dateObj.toLocaleDateString(
                "en-US",
                optionsDate
            );
            const formattedTime = dateObj.toLocaleTimeString(
                "en-US",
                optionsTime
            );

            return (
                <div>
                    {formattedDate}
                    <br />
                    <span className="text-gray-500">at {formattedTime}</span>
                </div>
            );
        } catch (error) {
            return "Date Error";
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "unpaid":
                return "bg-red-100 text-red-800";
            case "partially paid":
                return "bg-purple-100 text-purple-800";
            case "verified":
                return "bg-yellow-100 text-yellow-800";
            case "draft":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">
                    Invoices
                </h2>
                <button
                    onClick={handleAddInvoice}
                    className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                >
                    Add Invoice
                </button>
            </div>

            {/* Invoices Table */}
            <div className="w-full overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Invoice ID
                            </th>
                            <th className="py-3 px-4">Purchase Order ID</th>
                            <th className="py-3 px-4">Supplier</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">VAT Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Payable Date</th>
                            <th className="py-3 px-4 text-center">
                                Attachment
                            </th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="text-center py-12">
                                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="text-center text-red-500 font-medium py-4"
                                >
                                    {error}
                                </td>
                            </tr>
                        ) : invoices.length > 0 ? (
                            invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="px-3 py-4">
                                        {invoice.invoice_id || "Auto-generated"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {invoice.purchase_order
                                            ?.purchase_order_no || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {invoice.supplier?.name || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {`${invoice.amount || 0} SAR`}
                                    </td>
                                    <td className="px-3 py-4">
                                        {`${invoice.vat_amount || 0} SAR`}
                                    </td>
                                    <td className="px-3 py-4">
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(
                                                invoice.status
                                            )}`}
                                        >
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        {new Date(
                                            invoice.payable_date
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex justify-center">
                                            {invoice.documents &&
                                            invoice.documents[0] ? (
                                                <button
                                                    className="w-8 h-8"
                                                    onClick={() => {
                                                        const filePath = invoice.documents[0].file_path;
                                                        if (filePath) {
                                                            const fixedPath = filePath.startsWith("http") 
                                                                ? filePath 
                                                                : filePath.startsWith("/storage/") 
                                                                    ? filePath 
                                                                    : filePath.startsWith("invoices/") 
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
                                    <td className="px-3 py-4 flex justify-center text-center space-x-3">
                                        {invoice.status === 'UnPaid' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleEditInvoice(invoice)
                                                    }
                                                    className="text-blue-400 hover:text-blue-500"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(invoice.id)
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-6 py-4 text-center"
                                >
                                    No Customer invoices found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && !error && invoices.length > 0 && (
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

            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveInvoice}
                invoice={selectedInvoice}
                isEdit={isEdit}
            />
        </div>
    );
};

export default InvoicesTable;
