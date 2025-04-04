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
    const [progress, setProgress] = useState(0);

    const filters = ["All", "Pending", "Paid", "Partially Paid", "Overdue"];

    const fetchPayables = async () => {
        setLoading(true);
        setProgress(0);
        let progressInterval;

        try {
            progressInterval = setInterval(() => {
                setProgress((prev) => prev >= 90 ? 90 : prev + 10);
            }, 200);

            let url = `/api/v1/payment-orders?include=user&page=${currentPage}`;
            
            // Only add status filter if not "all"
            if (selectedFilter !== "All") {
                const status = selectedFilter.toLowerCase().replace(' ', '_');
                url += `&filter[status]=${status}`;
            }

            console.log('Fetching URL:', url);

            const response = await axios.get(url);
            console.log('Response:', response.data);
            
            if (response.data && response.data.data) {
                const parsedPayables = response.data.data.map(payable => ({
                    ...payable,
                    total_amount: parseFloat(payable.total_amount || 0),
                    paid_amount: parseFloat(payable.paid_amount || 0)
                }));
                setPayables(parsedPayables);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            } else {
                setError("No data received from server");
            }
        } catch (error) {
            console.error('Error fetching payables:', error);
            const errorMessage = error.response?.data?.message || error.message;
            setError(`Failed to load payables: ${errorMessage}`);
            setPayables([]);
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    useEffect(() => {
        fetchPayables();
    }, [currentPage, selectedFilter]);

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partially_paid':
            case 'partially paid':
                return 'bg-purple-100 text-purple-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (status) => {
        if (!status) return 'Pending';
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

            {/* Loading Bar */}
            {loading && (
                <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                    <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                        <div
                            className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                        <span className="absolute text-white">
                            {progress < 60 ? "Please Wait, Fetching Details..." : `${progress}%`}
                        </span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {!loading && error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
            <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                    <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">
                                Payment Order #
                        </th>
                            <th className="py-3 px-4 text-center">Supplier</th>
                            <th className="py-3 px-4 text-center">Contact</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-center">Amount</th>
                            <th className="py-3 px-4 text-center">Balance</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {payables.length > 0 ? (
                            payables.map((data) => {
                                const balance = data.total_amount - (data.paid_amount || 0);
                                return (
                                    <tr key={data.id}>
                                        <td className="py-3 px-4 text-center">{data.payment_order_number}</td>
                                        <td className="py-3 px-4 text-center">{data.user?.name || 'N/A'}</td>
                                        <td className="py-3 px-4 text-center">{data.user?.mobile || 'N/A'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(data.status)}`}>
                                                {formatStatus(data.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {data.total_amount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })} SAR
                            </td>
                                        <td className="py-3 px-4 text-center">
                                            {balance.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })} SAR
                            </td>
                                <td className="py-3 px-4 flex justify-center text-center">
                                    <Link
                                        href={`/account-payables/view/${data.id}`}
                                        className="flex items-center justify-center w-8 h-8 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEllipsisH} />
                                    </Link>
                                </td>
                            </tr>
                                );
                            })
                    ) : (
                        <tr>
                                <td colSpan="7" className="text-center text-[#2C323C] font-medium py-4">
                                    No Payables found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            )}

            {/* Pagination */}
            {!loading && !error && payables.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                            currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </button>
                    {Array.from({ length: lastPage }, (_, index) => index + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 ${
                                currentPage === page
                                    ? "bg-[#009FDC] text-white"
                                    : "border border-[#B9BBBD] bg-white text-black"
                            } rounded-full`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                            currentPage >= lastPage ? "opacity-50 cursor-not-allowed" : ""
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
