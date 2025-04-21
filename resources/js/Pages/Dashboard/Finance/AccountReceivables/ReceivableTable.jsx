import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ViewReceivableModal from "./ViewReceivableModal";
import EditReceivableModal from "./EditReceivableModal";

const ReceivableTable = () => {
    const [receivables, setReceivables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = [
        "All",
        "Pending",
        "Partially Paid",
        "Overdue",
        "Cancelled",
    ];

    const fetchReceivables = async () => {
        setLoading(true);

        try {
            const status = selectedFilter.toLowerCase();
            let url = `/api/v1/invoices?include=client`;

            if (selectedFilter !== "All") {
                url += `&filter[status]=${status}`;
            }
            const response = await axios.get(url);
            if (response.data && response.data.data) {
                const mappedData = response.data.data.map((invoice) => {
                    const balance =
                        (invoice.total_amount || 0) -
                        (invoice.paid_amount || 0);
                    return {
                        id: invoice.id,
                        invoice_no:
                            invoice.invoice_number ||
                            `INV-${invoice.id.toString().padStart(5, "0")}`,
                        customer: invoice.client?.name || "N/A",
                        contact: invoice.client?.contact_number || "N/A",
                        status: invoice.status || "Pending",
                        amount: invoice.total_amount || 0,
                        balance: balance,
                    };
                });
                let finalData;

                if (selectedFilter === "All") {
                    finalData = mappedData.filter(
                        (invoice) =>
                            invoice.status.toLowerCase() !== "paid" &&
                            invoice.status.toLowerCase() !== "draft"
                    );
                } else {
                    finalData = mappedData.filter(
                        (invoice) => invoice.status.toLowerCase() === status
                    );
                }

                setReceivables(finalData);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            }
        } catch (error) {
            console.error("Error fetching receivables:", error);
            setError(
                "Failed to load receivables. " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, [selectedFilter, currentPage]);

    const handleViewInvoice = (invoiceId) => {
        setSelectedInvoiceId(invoiceId);
        setIsViewModalOpen(true);
    };

    const handleEditInvoice = (invoiceId) => {
        setSelectedInvoiceId(invoiceId);
        setIsEditModalOpen(true);
    };

    const handleModalClose = () => {
        setIsViewModalOpen(false);
        setIsEditModalOpen(false);
    };

    const handleEditModalSave = async () => {
        setIsEditModalOpen(false);
        await fetchReceivables();
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "partially paid":
                return "bg-red-100 text-red-800";
            case "overdue":
                return "bg-purple-100 text-purple-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-300 text-gray-800";
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Account Receivables
                </h2>
                <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            className={`px-6 py-2 rounded-full text-xl transition ${
                                selectedFilter === filter
                                    ? "bg-[#009FDC] text-white"
                                    : "text-[#9B9DA2]"
                            }`}
                            onClick={() => setSelectedFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Invoice #
                        </th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
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
                    ) : receivables.length > 0 ? (
                        receivables.map((data) => (
                            <tr key={data.id}>
                                <td className="py-3 px-4">{data.invoice_no}</td>
                                <td className="py-3 px-4">{data.customer}</td>
                                <td className="py-3 px-4">{data.contact}</td>
                                <td className="py-3 px-4">
                                    <span
                                        className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(
                                            data.status
                                        )}`}
                                    >
                                        {data.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    {Number(data.amount).toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4">
                                    {Number(data.balance).toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}{" "}
                                    SAR
                                </td>
                                <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                    <button
                                        onClick={() =>
                                            handleViewInvoice(data.id)
                                        }
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                        title="View Receivable"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleEditInvoice(data.id)
                                        }
                                        className="text-blue-400 hover:text-blue-500"
                                        title="Edit Receivable"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Account Receivables found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && receivables.length > 0 && (
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

            {/* View Modal */}
            {isViewModalOpen && (
                <ViewReceivableModal
                    id={selectedInvoiceId}
                    isOpen={isViewModalOpen}
                    onClose={handleModalClose}
                />
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditReceivableModal
                    isOpen={isEditModalOpen}
                    onClose={handleModalClose}
                    onSave={handleEditModalSave}
                    invoiceId={selectedInvoiceId}
                    isEdit={true}
                />
            )}
        </div>
    );
};

export default ReceivableTable;
