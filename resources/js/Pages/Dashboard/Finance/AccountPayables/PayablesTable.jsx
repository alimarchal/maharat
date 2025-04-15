import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

const PayablesTable = () => {
    const [payables, setPayables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState("All");

    const filters = ["All", "Pending", "Paid", "Partially Paid", "Overdue"];

    const fetchPayables = async () => {
        setLoading(true);

        try {
            let url = `/api/v1/payment-orders?include=user&page=${currentPage}`;

            if (selectedFilter !== "All") {
                const status = selectedFilter.toLowerCase().replace(" ", "_");
                url += `&filter[status]=${status}`;
            }
            const response = await axios.get(url);

            if (response.data && response.data.data) {
                const parsedPayables = response.data.data.map((payable) => ({
                    ...payable,
                    total_amount: parseFloat(payable.total_amount || 0),
                    paid_amount: parseFloat(payable.paid_amount || 0),
                }));
                setPayables(parsedPayables);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            } else {
                setError("No data received from server");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            setError(`Failed to load payables: ${errorMessage}`);
            setPayables([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayables();
    }, [currentPage, selectedFilter]);

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "partially_paid":
            case "partially paid":
                return "bg-purple-100 text-purple-800";
            case "overdue":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatStatus = (status) => {
        if (!status) return "Pending";
        
        // Check for draft status specifically
        if (status.toLowerCase() === "draft") {
            return "Draft";
        }
        
        return status
            .replace(/_/g, " ") // Replace all underscores, not just the first one
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Account Payables
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
                            onClick={() => handleFilterChange(filter)}
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
                            Payment Order #
                        </th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Details
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
                    ) : payables.length > 0 ? (
                        payables.map((data) => {
                            const balance =
                                data.total_amount - (data.paid_amount || 0);
                            return (
                                <tr key={data.id}>
                                    <td className="py-3 px-4">
                                        {data.payment_order_number}
                                    </td>
                                    <td className="py-3 px-4">
                                        {data.user?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {data.user?.mobile || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(
                                                data.status
                                            )}`}
                                        >
                                            {formatStatus(data.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {data.total_amount.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}{" "}
                                        SAR
                                    </td>
                                    <td className="py-3 px-4">
                                        {balance.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{" "}
                                        SAR
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center">
                                        <Link
                                            href={`/account-payables/view/${data.id}`}
                                            className="flex items-center justify-center w-8 h-8 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                        >
                                            <FontAwesomeIcon
                                                icon={faEllipsisH}
                                            />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Accounts Payables found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && payables.length > 0 && (
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

export default PayablesTable;
