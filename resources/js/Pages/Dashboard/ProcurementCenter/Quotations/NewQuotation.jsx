import React, { useState, useEffect } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { Link } from "@inertiajs/react";
import axios from "axios";

export default function NewQuotation() {
    const [rfqs, setRfqs] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);

    const fetchRfqs = async () => {
        setLoading(true);

        try {
            const response = await axios.get(
                `/api/v1/rfqs?page=${currentPage}&filter[status_id]=47&sort=rfq_number`
            );
            const rfqsData = response.data.data;

            // Fetch all purchase orders to check which RFQs already have POs
            const purchaseOrdersResponse = await axios.get("/api/v1/purchase-orders");
            const purchaseOrdersData = purchaseOrdersResponse.data.data || [];
            
            // Create a set of RFQ IDs that already have purchase orders
            const rfqIdsWithPO = new Set();
            purchaseOrdersData.forEach((po) => {
                if (po.rfq_id) {
                    rfqIdsWithPO.add(po.rfq_id);
                }
            });

            // Filter out RFQs that already have purchase orders
            const rfqsWithoutPO = rfqsData.filter((rfq) => !rfqIdsWithPO.has(rfq.id));

            const rfqsWithDetails = await Promise.all(
                rfqsWithoutPO.map(async (rfq) => {
                    const categoryResponse = await axios.get(`/api/v1/rfq-categories/${rfq.id}`);
                    return {
                        ...rfq,
                        category_name: categoryResponse.data.data.category_name,
                    };
                })
            );

            setRfqs(rfqsWithDetails);
            setLastPage(response.data.meta.last_page);
            setError("");
        } catch (error) {
            setError("Failed to load RFQs");
            setRfqs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            setCompanies(response.data.data);
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    useEffect(() => {
        fetchRfqs();
        fetchCompanies();
    }, [currentPage]);

    return (
        <div className="w-full">
            <div className="w-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-[32px] font-bold text-[#2C323C]">
                            New Quotations
                        </h2>
                        <p className="text-[#7D8086] text-lg mt-1">
                            RFQs without Purchase Orders
                        </p>
                    </div>
                </div>

                <div className="w-full overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    RFQ #
                                </th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="text-center py-12"
                                    >
                                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="text-center text-red-500 font-medium py-4"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            ) : rfqs.length > 0 ? (
                                rfqs.map((rfq) => (
                                    <tr key={rfq.id}>
                                        <td className="px-3 py-4">
                                            {rfq.rfq_number || "N/A"}
                                        </td>
                                        <td className="px-3 py-4">
                                            {rfq.created_at
                                                ? new Date(
                                                      rfq.created_at
                                                  ).toLocaleDateString(
                                                      "en-GB",
                                                      {
                                                          day: "2-digit",
                                                          month: "2-digit",
                                                          year: "numeric",
                                                      }
                                                  )
                                                : ""}
                                        </td>
                                        <td className="px-3 py-4">
                                            {rfq.category_name}
                                        </td>
                                        <td className="px-3 py-4">
                                            {rfq.status.name}
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <Link
                                                href={`/quotations/create-quotation/add-quotation-to-rfq?rfq_id=${rfq.id}`}
                                            >
                                                <PlusCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer mx-auto" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="text-center text-[#2C323C] font-medium py-4"
                                    >
                                        No RFQs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && !error && rfqs.length > 0 && (
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
            </div>
        </div>
    );
}
