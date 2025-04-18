import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const ViewFAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedFaq, setSelectedFaq] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedScreenshots, setSelectedScreenshots] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const filters = ["All", "Approved", "Pending", "Cancelled"];

    // Fetch FAQs data
    const fetchFaqs = async () => {
        setLoading(true);

        try {
            const response = await axios.get(
                `/api/v1/faqs/approval?page=${currentPage}`
            );
            if (response.data && response.data.data) {
                setFaqs(response.data.data);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            }
        } catch (error) {
            setError("Failed to load FAQs");
            console.error("Error fetching FAQs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, [selectedFilter, currentPage]);

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setLoading(true);
    };

    const handleEdit = (faq) => {
        setSelectedFaq(faq);
        setShowEditModal(true);
    };

    const handleUpdate = async (status) => {
        setIsSaving(true);
        try {
            await axios.put(`/api/v1/faqs/approval/${selectedFaq.id}`, {
                status,
            });
            setShowEditModal(false);
            fetchFaqs();
        } catch (error) {
            console.error("Error updating FAQ:", error);
            setError("Failed to update FAQ");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/v1/faqs/approval/${id}`);
            fetchFaqs();
        } catch (error) {
            console.error("Error deleting FAQ:", error);
            setError(
                "Failed to delete FAQ: " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePreview = (screenshots) => {
        setSelectedScreenshots(screenshots || []);
        setShowPreviewModal(true);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Filter FAQs based on selected filter
    const filteredFaqs =
        selectedFilter === "All"
            ? faqs
            : faqs.filter(
                  (faq) =>
                      faq.status.toLowerCase() === selectedFilter.toLowerCase()
              );

    return (
        <>
            {/* Screenshot Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl w-[90%] max-w-6xl relative">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="text-3xl font-bold text-[#2C323C] w-full text-center">
                                Screenshot Preview
                            </h2>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="text-red-500 hover:text-red-800 text-2xl absolute right-4 top-4"
                            >
                                ×
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            {selectedScreenshots.length > 0 ? (
                                selectedScreenshots.map((screenshot, index) => (
                                    <div
                                        key={index}
                                        className="relative flex justify-center"
                                    >
                                        <img
                                            src={`/storage/${screenshot}`}
                                            alt={`Screenshot ${index + 1}`}
                                            className="max-w-full h-auto rounded-lg shadow-md"
                                            style={{ maxHeight: "80vh" }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-4">
                                    No screenshots available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full">
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            View FAQs
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
                </div>

                <table className="w-full overflow-hidden">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Name
                            </th>
                            <th className="py-3 px-4">Question</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-12">
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
                        ) : filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq) => (
                                <tr key={faq.id}>
                                    <td className="py-3 px-4">
                                        {faq.user?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">{faq.title}</td>
                                    <td className="py-3 px-4">
                                        {faq.description}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(
                                                faq.status
                                            )}`}
                                        >
                                            {capitalizeFirstLetter(faq.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                        <button
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            onClick={() =>
                                                handlePreview(faq.screenshots)
                                            }
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            className="text-blue-400 hover:text-blue-500"
                                            onClick={() => handleEdit(faq)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-800"
                                            onClick={() => handleDelete(faq.id)}
                                            disabled={isDeleting}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    No FAQs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && !error && faqs.length > 0 && (
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

                {/* Edit Status Modal */}
                {showEditModal && selectedFaq && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-8 rounded-2xl w-[90%] max-w-lg">
                            <div className="flex justify-between border-b pb-2 mb-4">
                                <h2 className="text-3xl font-bold text-[#2C323C]">
                                    Update FAQ Status
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-red-500 hover:text-red-800 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Status
                                    </label>
                                    <span
                                        className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(
                                            selectedFaq.status
                                        )}`}
                                    >
                                        {capitalizeFirstLetter(
                                            selectedFaq.status
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Status
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#009FDC]"
                                        onChange={(e) =>
                                            setSelectedFaq({
                                                ...selectedFaq,
                                                status: e.target.value,
                                            })
                                        }
                                        value={selectedFaq.status}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-4 mt-4">
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleUpdate(selectedFaq.status)
                                        }
                                        disabled={isSaving}
                                        className={`px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300 ${
                                            isSaving
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {isSaving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ViewFAQ;
