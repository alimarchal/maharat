import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faTrash,
    faCheck,
    faEye,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const PurchaseStatus = () => {
    const [rfqLogs, setRfqLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const fetchRFQLogs = async () => {
        try {
            const response = await axios.get(
                `/api/v1/rfq-status-logs?page=${currentPage}`
            );
            setRfqLogs(response.data.data);
            setLastPage(response.data.meta.last_page);
            setError("");
        } catch (error) {
            setError("Failed to load RFQ logs");
            setRfqLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRFQLogs();
    }, [currentPage]);

    const handleEdit = (log) => {
        setEditingId(log.id);
        setEditData(log);
    };

    const handleSave = async (id) => {
        try {
            const response = await axios.put(
                `/api/v1/rfq-status-logs/${id}`,
                editData
            );
            if (response.data) {
                setEditingId(null);
                fetchRFQLogs();
            }
        } catch (error) {
            setError("Failed to save changes");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/rfq-status-logs/${id}`);
            fetchRFQLogs();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    const handleChange = (field, value) => {
        setEditData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const formatDateTime = (dateString) => {
        const optionsDate = { year: "numeric", month: "long", day: "numeric" };
        const optionsTime = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        };

        const dateObj = new Date(dateString);
        const formattedDate = dateObj.toLocaleDateString("en-US", optionsDate);
        const formattedTime = dateObj.toLocaleTimeString("en-US", optionsTime);

        return (
            <div>
                {formattedDate}
                <br />
                <span className="text-gray-500">at {formattedTime}</span>
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[32px] font-bold text-[#2C323C]">
                    Purchase Docs Statuses
                </h2>
            </div>

            <table className="w-full overflow-hidden">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Doc ID
                        </th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Remarks</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Actions
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
                    ) : rfqLogs.length > 0 ? (
                        rfqLogs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-3 py-4">{log.rfq_id}</td>
                                <td className="px-3 py-4">
                                    {editingId === log.id ? (
                                        <input
                                            type="text"
                                            value={editData.supplier_name || ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "supplier_name",
                                                    e.target.value
                                                )
                                            }
                                            className="bg-transparent border-none focus:outline-none focus:ring-0 w-20 text-center text-base"
                                        />
                                    ) : (
                                        log.supplier_name || "N/A"
                                    )}
                                </td>
                                <td className="px-3 py-4">
                                    <span
                                        className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                            log.status_name === "Active"
                                                ? "bg-green-100 text-green-800"
                                                : log.status_name === "Rejected"
                                                ? "bg-red-100 text-red-800"
                                                : log.status_name === "Expired"
                                                ? "bg-gray-100 text-gray-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }`}
                                    >
                                        {log.status_name}
                                    </span>
                                </td>
                                <td className="px-3 py-4">
                                    {formatDateTime(log.created_at)}
                                </td>
                                <td className="px-3 py-4">{log?.remarks}</td>
                                <td className="px-3 py-4 flex justify-center text-center space-x-3">
                                    <button
                                        onClick={() =>
                                            router.visit("/dummy-page")
                                        }
                                        className="text-gray-500 hover:text-gray-600"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    {editingId === log.id ? (
                                        <button
                                            onClick={() => handleSave(log.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(log)}
                                            className="text-blue-400 hover:text-blue-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(log.id)}
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
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Purchase Doc Statuses found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && rfqLogs.length > 0 && (
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

export default PurchaseStatus;
