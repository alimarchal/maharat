import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import axios from "axios";

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Expired", "Active", "Approved"];
    const [loading, setLoading] = useState(true);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/quotations?page=${currentPage}`
            );
            const quotationsData = response.data.data || [];
            const meta = response.data.meta || {};
            const responseLastPage = meta.last_page || 1;

            const quotationsWithDetails = quotationsData.map((quotation) => ({
                ...quotation,
                company_name: quotation.company_name || "N/A",
                status_type: quotation.status?.type || "unknown",
                status_name: quotation.status?.name || "Unknown",
                rfq_number: quotation.rfq?.rfq_number || "N/A",
            }));

            setQuotations(quotationsWithDetails);
            setLastPage(responseLastPage);
            applyFilter(selectedFilter, quotationsWithDetails);
            setError("");
        } catch (error) {
            setError("Failed to load quotations. Please try again later.");
            setQuotations([]);
            setFilteredQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, [currentPage]);

    const applyFilter = (filter, data = quotations) => {
        const quotationsToFilter = data.length > 0 ? data : quotations;

        switch (filter) {
            case "Expired":
                setFilteredQuotations(
                    quotationsToFilter.filter(
                        (quotation) =>
                            quotation.status_name.toLowerCase() === "expired"
                    )
                );
                break;
            case "Active":
                setFilteredQuotations(
                    quotationsToFilter.filter(
                        (quotation) =>
                            quotation.status_name.toLowerCase() === "active"
                    )
                );
                break;
            case "Approved":
                setFilteredQuotations(
                    quotationsToFilter.filter(
                        (quotation) =>
                            quotation.status_name.toLowerCase() === "approved"
                    )
                );
                break;
            default:
                setFilteredQuotations(quotationsToFilter);
                break;
        }
    };

    // Handle filter change
    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        applyFilter(filter);
    };

    return (
        <div className="w-full">
            {/* Quotations Heading and Buttons */}
            <div className="flex justify-between items-center mb-12">
                <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">
                    Quotations
                </h2>
                <div className="flex items-center space-x-4">
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
                    <Link
                        href={`/suppliers`}
                        className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                    >
                        Add Suppliers
                    </Link>
                    <Link
                        href="/quotations/create-quotation"
                        className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                    >
                        Create Quotation
                    </Link>
                </div>
            </div>

            {/* Quotations Table */}
            <div className="w-full overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Quotation #
                            </th>
                            <th className="py-3 px-4">RFQ #</th>
                            <th className="py-3 px-4">Company</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                Expiry Date
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
                        ) : filteredQuotations.length > 0 ? (
                            filteredQuotations.map((quotation) => (
                                <tr key={quotation.id}>
                                    <td className="px-3 py-4">
                                        {quotation.quotation_number || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {quotation.rfq_number || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {quotation.company_name || "N/A"}
                                    </td>
                                    <td className="px-3 py-4">
                                        {Number(
                                            quotation.total_amount || 0
                                        ).toLocaleString("en-US", {
                                            maximumFractionDigits: 0,
                                        })}
                                    </td>
                                    <td className="px-3 py-4">
                                        {typeof quotation.status?.name === "object" ? (
                                            <span className="text-red-500">
                                                Invalid Status
                                            </span>
                                        ) : (
                                            <span
                                                className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                                    quotation.status?.name === "Active"
                                                        ? "bg-green-100 text-green-800"
                                                        : quotation.status?.name === "Rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : quotation.status?.name === "Expired"
                                                        ? "bg-gray-100 text-gray-800"
                                                        : quotation.status?.name === "Approved"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                            >
                                                {quotation.status?.name || "N/A"}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        {quotation.valid_until
                                            ? new Date(
                                                  quotation.valid_until
                                              ).toLocaleDateString("en-GB", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                              })
                                            : "N/A"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    No quotations found matching the current
                                    filter.
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
                                } rounded-full hover:bg-[#0077B6] hover:text-white transition`}
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
    );
};

export default Quotations;
