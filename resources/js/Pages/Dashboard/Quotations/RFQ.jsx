import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const RFQ = () => {
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchRFQs = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/rfqs?page=${currentPage}`);
                const data = await response.json();

                if (response.ok) {
                    setRfqs(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch RFQs.");
                }
            } catch (err) {
                console.error("Error fetching RFQs:", err);
                setError("Error loading RFQs.");
            } finally {
                setLoading(false);
            }
        };

        fetchRFQs();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this RFQ?")) return;

        try {
            const response = await fetch(`/api/rfqs/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setRfqs((prevRfqs) =>
                    prevRfqs.filter((rfq) => rfq.id !== id)
                );
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete RFQ.");
            }
        } catch (err) {
            console.error("Error deleting RFQ:", err);
            alert("An error occurred while deleting the RFQ.");
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/dashboard")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Purchases</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">RFQs</span>
                </div>

                {/* RFQs Logs Heading and Make New RFQ Button */}
                <div className="flex justify-between items-center mb-12">
                <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">RFQ Logs</h2>
                    <Link
                        href="/quotations/create"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Make New RFQ
                    </Link>
                </div>

                {/* RFQs Table */}
                <div className="w-full overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">RFQ#</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Actions</th>
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
                                    <td colSpan="7" className="text-center text-red-500 font-medium py-4">
                                        {error}
                                    </td>
                                </tr>
                            ) : rfqs.length > 0 ? (
                                rfqs.map((rfq) => (
                                    <tr key={rfq.id}>
                                        <td className="py-3 px-4">{rfq.rfq_number}</td>
                                        <td className="py-3 px-4">{rfq.category_name}</td>
                                        <td className="py-3 px-4">{rfq.supplier_name}</td>
                                        <td className="py-3 px-4">{rfq.total_amount}</td>
                                        <td className="py-3 px-4">{rfq.status}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                {new Date(rfq.created_at).toLocaleDateString()}
                                                <span className="text-gray-400">
                                                    {new Date(rfq.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex space-x-3">
                                                <Link
                                                    href={`/quotations/${rfq.id}/edit`}
                                                    className="text-[#9B9DA2] hover:text-gray-500"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(rfq.id)}
                                                    className="text-[#9B9DA2] hover:text-gray-500"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center text-[#2C323C] font-medium py-4">
                                        No RFQs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && !error && rfqs.length > 0 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            {Array.from({ length: lastPage }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 ${
                                        currentPage === page
                                            ? "bg-[#009FDC] text-white"
                                            : "border border-[#B9BBBD] bg-white"
                                    } rounded-full hover:bg-gray-100 transition`}
                                >
                                    {page}
                                </button>
                            ))}
                            {currentPage < lastPage && (
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    className="px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default RFQ;