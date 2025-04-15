import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faCheck,
    faEdit,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Reports = () => {
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "RFQs", "Quotations", "POs", "GRNs"];
    const [loading, setLoading] = useState(true);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/quotations?page=${currentPage}`
            );
            const quotationsData = response.data.data;

            const quotationsWithDetails = await Promise.all(
                quotationsData.map(async (quotation) => {
                    const [statusResponse, rfqResponse] = await Promise.all([
                        axios.get(`/api/v1/statuses/${quotation.status_id}`),
                        axios.get(`/api/v1/rfqs/${quotation.rfq_id}`),
                    ]);

                    return {
                        ...quotation,
                        organization_name:
                            rfqResponse.data.data.organization_name,
                        status_type: statusResponse.data.data.type,
                        status_name: statusResponse.data.data.name,
                    };
                })
            );
            setQuotations(quotationsWithDetails);
            applyFilter(selectedFilter, quotationsWithDetails);
            setLastPage(response.data.meta.last_page);
            setError("");
        } catch (error) {
            setError("Failed to load quotations");
            setQuotations([]);
            setFilteredQuotations([]);
        } finally {
            setLoading(false);
        }
    };

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

    const handleFilterChange = (filter) => {
        setLoading(true);
        setSelectedFilter(filter);

        setTimeout(() => {
            applyFilter(filter);
            clearInterval(interval);
        }, 3000);
    };

    useEffect(() => {
        fetchQuotations();
    }, [currentPage]);

    const handleEdit = (quotation) => {
        setEditingId(quotation.id);
        setEditData(quotation);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[32px] font-bold text-[#2C323C]">
                    Report Logs
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
                </div>
            </div>

            <table className="w-full overflow-hidden">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Doc ID
                        </th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
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
                    ) : filteredQuotations.length > 0 ? (
                        filteredQuotations.map((quotation) => (
                            <tr key={quotation.id}>
                                <td className="px-3 py-4">
                                    {quotation.quotation_number}
                                </td>
                                <td className="px-3 py-4">
                                    {quotation.rfq_id}
                                </td>
                                <td className="px-3 py-4">
                                    {quotation.organization_name}
                                </td>
                                <td className="px-3 py-4">
                                    {quotation.organization_name}
                                </td>
                                <td className="px-3 py-4">
                                    {quotation.total_amount}
                                </td>
                                <td className="px-3 py-4">
                                    {quotation.valid_until
                                        ? new Date(
                                              quotation.valid_until
                                          ).toLocaleDateString("en-GB", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                          })
                                        : ""}
                                </td>
                                <td className="px-3 py-4 flex justify-center text-center space-x-3">
                                    <button
                                        onClick={() =>
                                            router.visit("/dummy-page")
                                        }
                                        className="text-gray-500 hover:text-gray-600"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    {editingId === quotation.id ? (
                                        <button
                                            onClick={() =>
                                                handleSave(quotation.id)
                                            }
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                handleEdit(quotation)
                                            }
                                            className="text-blue-400 hover:text-blue-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() =>
                                            handleDelete(quotation.id)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
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
                                No Reports logs found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && filteredQuotations.length > 0 && (
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
    );
};

export default Reports;
