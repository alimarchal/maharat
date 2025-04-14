import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

const MaharatInvoicesTable = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Draft", "Pending", "Paid", "Overdue", "Cancelled"];

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const status = selectedFilter.toLowerCase();
            let url = `/api/v1/invoices?page=${currentPage}&include=client`;

            if (selectedFilter !== "All") {
                url += `&filter[status]=${status}`;
            }

            const response = await axios.get(url);

            if (response.data && response.data.data) {
                const mappedData = response.data.data.map((invoice) => {
                    return {
                        id: invoice.id,
                        invoice_number:
                            invoice.invoice_number ||
                            `INV-${invoice.id.toString().padStart(5, "0")}`,
                        customer_name: invoice.client?.name || "N/A",
                        total_amount: invoice.total_amount || 0,
                        status: invoice.status || "Draft",
                        updated_at: invoice.updated_at,
                    };
                });

                const filteredData =
                    selectedFilter === "All"
                        ? mappedData
                        : mappedData.filter(
                              (invoice) =>
                                  invoice.status.toLowerCase() === status
                          );

                setInvoices(filteredData);
                setLastPage(response.data.meta.last_page);
                setError("");
            }
        } catch (error) {
            setError("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [currentPage, selectedFilter]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/v1/invoices/${id}`);
            fetchInvoices();
        } catch (error) {
            setError(
                "Failed to delete record: " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return "text-green-500";
            case "cancelled":
                return "text-red-500";
            case "overdue":
                return "text-purple-500";
            case "pending":
                return "text-yellow-500";
            case "draft":
                return "text-gray-500";
            default:
                return "text-gray-500";
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) {
            return "N/A";
        }

        try {
            const dateObj = new Date(dateString);

            if (isNaN(dateObj.getTime())) {
                console.error("Invalid date:", dateString);
                return "Invalid Date";
            }

            const formattedDate = dateObj.toLocaleDateString();
            const formattedTime = dateObj.toLocaleTimeString();

            return (
                <div className="flex flex-col">
                    {formattedDate}
                    <span className="text-gray-400">{formattedTime}</span>
                </div>
            );
        } catch (error) {
            console.error("Date formatting error:", error);
            return "Date Error";
        }
    };

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center text-center mb-6">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Maharat Invoices
                </h2>

                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-1 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-5 py-1 rounded-full text-base transition ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => handleFilterChange(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    <Link
                        href={`/customers`}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Add Customers
                    </Link>
                    <Link
                        href={`/maharat-invoices/create`}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create new Invoice
                    </Link>
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Invoice #
                        </th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            More
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="py-3 px-4">
                                    {invoice.invoice_number || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {invoice.customer_name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {invoice.total_amount
                                        ? `${Math.floor(
                                              invoice.total_amount
                                          ).toLocaleString()} SAR`
                                        : "N/A"}
                                </td>
                                <td
                                    className={`py-3 px-4 font-semibold ${getStatusClass(
                                        invoice.status
                                    )}`}
                                >
                                    {invoice.status}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {formatDateTime(invoice.updated_at)}
                                </td>
                                <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                    <Link
                                        href={`/maharat-invoices/create/${invoice.id}`}
                                        className="text-blue-400 hover:text-blue-500"
                                        title="Edit Invoice"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button
                                        className="w-4 h-4"
                                        title="Download PDF"
                                    >
                                        <img
                                            src="/images/pdf-file.png"
                                            alt="PDF"
                                            className="w-full h-full"
                                        />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(invoice.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete Invoice"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Maharat Invoices found.
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
    );
};

export default MaharatInvoicesTable;
