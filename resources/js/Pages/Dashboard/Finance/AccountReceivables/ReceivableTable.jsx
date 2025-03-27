import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";

const ReceivableTable = () => {
    const [receivables, setReceivables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState("All");

    const filters = ["All", "Pending", "Paid", "Partially Paid", "Overdue"];

    const fetchReceivables = async () => {
        setLoading(true);
        setProgress(0);
        let progressInterval;

        try {
            progressInterval = setInterval(() => {
                setProgress((prev) => prev >= 90 ? 90 : prev + 10);
            }, 200);

            // Convert filter to lowercase for consistency
            const status = selectedFilter.toLowerCase();
            let url = `/api/v1/invoices?include=client`;
            
            // Only add status filter if not "all"
            if (selectedFilter !== "All") {
                url += `&filter[status]=${status}`;
            }

            const response = await axios.get(url);
            
            if (response.data && response.data.data) {
                const mappedData = response.data.data.map(invoice => {
                    const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
                    return {
                        id: invoice.id,
                        invoice_no: invoice.invoice_number || `INV-${invoice.id.toString().padStart(5, '0')}`,
                        customer: invoice.client?.name || 'N/A',
                        contact: invoice.client?.contact_number || 'N/A',
                        status: invoice.status || 'Pending',
                        amount: invoice.total_amount || 0,
                        balance: balance
                    };
                });

                // Additional client-side filtering as backup
                const filteredData = selectedFilter === "All" 
                    ? mappedData 
                    : mappedData.filter(invoice => 
                        invoice.status.toLowerCase() === status
                    );

                setReceivables(filteredData);
                setError("");
            }
        } catch (error) {
            console.error('Error fetching receivables:', error);
            setError("Failed to load receivables");
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, [selectedFilter]);

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partially paid':
                return 'bg-blue-100 text-blue-800';
            case 'overdue':
                return 'bg-purple-100 text-purple-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">
                                Invoice #
                            </th>
                            <th className="py-3 px-4 text-center">Customer</th>
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
                        {receivables.length > 0 ? (
                            receivables.map((data) => (
                                <tr key={data.id}>
                                    <td className="py-3 px-4 text-center">{data.invoice_no}</td>
                                    <td className="py-3 px-4 text-center">{data.customer}</td>
                                    <td className="py-3 px-4 text-center">{data.contact}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(data.status)}`}>
                                            {data.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {Number(data.amount).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })} SAR
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {Number(data.balance).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })} SAR
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center">
                                        <Link
                                            href={`/account-receivables/view/${data.id}`}
                                            className="flex items-center justify-center w-8 h-8 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                        >
                                            <FontAwesomeIcon icon={faEllipsisH} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center text-[#2C323C] font-medium py-4">
                                    No Receivables found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ReceivableTable;
