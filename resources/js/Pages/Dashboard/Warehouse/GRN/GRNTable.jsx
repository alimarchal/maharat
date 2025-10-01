import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash, faPlus, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ViewGRNModal from "./ViewGRNModal";
import { usePermissions } from "@/hooks/usePermissions";

export default function GRNTable() {
    const [grns, setGrns] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedGrn, setSelectedGrn] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddDeliveryModalOpen, setIsAddDeliveryModalOpen] = useState(false);
    const [additionalQuantity, setAdditionalQuantity] = useState("");
    const [deliveryNotes, setDeliveryNotes] = useState("");
    const { hasPermission } = usePermissions();

    const fetchGrns = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/grns?include=user,quotation.supplier,purchaseOrder,receiveGoods.supplier,receiveGoods.category,externalDeliveryNote&page=${currentPage}&sort=-created_at`
            );
            const data = await response.json();
            if (response.ok) {
                setGrns(data.data || []);
                setLastPage(data.meta?.last_page || 1);
            } else {
                setError(data.message || "Failed to fetch grns.");
            }
        } catch (err) {
            console.error("Error fetching grns:", err);
            setError("Error loading grns.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrns();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Record?")) return;

        try {
            if (id.toString().length > 10) {
                setGrns((prevGrns) => prevGrns.filter((g) => g.id !== id));
            } else {
                await axios.delete(`/api/v1/grns/${id}`);
                fetchGrns();
            }
        } catch (error) {
            console.error("Delete error:", error);
            setError("Failed to delete record");
        }
    };

    const handleView = (grn) => {
        setSelectedGrn(grn);
        setIsViewModalOpen(true);
    };

    const handleAddDelivery = (grn) => {
        setSelectedGrn(grn);
        setAdditionalQuantity("");
        setDeliveryNotes("");
        setIsAddDeliveryModalOpen(true);
    };

    const handleSubmitAdditionalDelivery = async () => {
        if (!additionalQuantity || additionalQuantity <= 0) {
            alert("Please enter a valid quantity");
            return;
        }

        try {
            await axios.post(`/api/v1/grns/${selectedGrn.id}/add-delivery`, {
                additional_quantity: parseFloat(additionalQuantity),
                notes: deliveryNotes
            });
            
            setIsAddDeliveryModalOpen(false);
            setSelectedGrn(null);
            setAdditionalQuantity("");
            setDeliveryNotes("");
            fetchGrns();
            alert("Additional delivery added successfully!");
        } catch (error) {
            console.error("Error adding delivery:", error);
            alert("Failed to add additional delivery");
        }
    };

    const getDeliveryStatusBadge = (grn) => {
        if (!grn.delivery_status) return null;
        
        const statusConfig = {
            complete: { color: "bg-green-100 text-green-800", text: "Complete" },
            partial: { color: "bg-yellow-100 text-yellow-800", text: "Partial" },
            awaiting_remaining: { color: "bg-orange-100 text-orange-800", text: "Awaiting Remaining" }
        };
        
        const config = statusConfig[grn.delivery_status];
        if (!config) return null;
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    return (
        <div className="w-full">
            <div className="w-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">
                        Good Receiving Notes
                    </h2>
                    {hasPermission("create_goods_receiving_notes") && (
                        <Link
                            href="/goods-receiving-notes/create"
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                        >
                            Create GRNs
                        </Link>
                    )}
                </div>

                <div className="w-full overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    GRN #
                                </th>
                                <th className="py-3 px-4">Quotation #</th>
                                <th className="py-3 px-4">Purchase Order #</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4">Quantity</th>
                                <th className="py-3 px-4">Expected</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Delivery Date</th>
                                <th className="py-3 px-4 text-center">Attachment</th>
                                <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="text-center py-12"
                                    >
                                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="text-center text-red-500 font-medium py-4"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            ) : grns.length > 0 ? (
                                grns.map((grn) => {
                                    return (
                                        <tr key={grn.id}>
                                            <td className="py-3 px-4">
                                                {grn.grn_number}
                                            </td>
                                            <td className="py-3 px-4">
                                                {
                                                    grn.quotation
                                                        ?.quotation_number
                                                }
                                            </td>
                                            <td className="py-3 px-4">
                                                {
                                                    grn.purchase_order
                                                        ?.purchase_order_no
                                                }
                                            </td>
                                            <td className="py-3 px-4">
                                                {grn.quotation?.supplier?.name || grn.quotation?.company_name || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {grn.quantity}
                                            </td>
                                            <td className="py-3 px-4">
                                                {grn.expected_quantity || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getDeliveryStatusBadge(grn)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {grn.delivery_date}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-center">
                                                    {grn.external_delivery_notes && grn.external_delivery_notes[0] && grn.external_delivery_notes[0].attachment_path ? (
                                                        <button
                                                            className="w-8 h-8"
                                                            onClick={() => {
                                                                const filePath = grn.external_delivery_notes[0].attachment_path;
                                                                if (filePath) {
                                                                    const fixedPath = filePath.startsWith("http") 
                                                                        ? filePath 
                                                                        : filePath.startsWith("/storage/") 
                                                                            ? filePath 
                                                                            : filePath.startsWith("delivery-notes/") 
                                                                                ? `/storage/${filePath}` 
                                                                                : filePath;
                                                                    window.open(fixedPath, "_blank");
                                                                }
                                                            }}
                                                            title="View Document"
                                                        >
                                                            <img
                                                                src="/images/pdf-file.png"
                                                                alt="PDF"
                                                                className="w-full h-full"
                                                            />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-500">
                                                            No document attached
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center text-center space-x-3">
                                                    <button
                                                        onClick={() => handleView(grn)}
                                                        className="text-[#9B9DA2] hover:text-gray-500"
                                                        title="View GRN"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faEye}
                                                        />
                                                    </button>
                                                    {(grn.delivery_status === 'partial' || grn.delivery_status === 'awaiting_remaining') && (
                                                        <button
                                                            onClick={() => handleAddDelivery(grn)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="Add Additional Delivery"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faPlus}
                                                            />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(grn.id)
                                                        }
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete GRN"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faTrash}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="text-center text-[#2C323C] font-medium py-4"
                                    >
                                        No GRNs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && !error && grns.length > 0 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                                    currentPage <= 1
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </button>
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

            {/* View GRN Modal */}
            <ViewGRNModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedGrn(null);
                }}
                grn={selectedGrn}
            />

            {/* Add Additional Delivery Modal */}
            {isAddDeliveryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Additional Delivery</h3>
                        
                        {selectedGrn && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>GRN:</strong> {selectedGrn.grn_number}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Current Quantity:</strong> {selectedGrn.quantity}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Expected Quantity:</strong> {selectedGrn.expected_quantity}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Remaining:</strong> {(selectedGrn.expected_quantity || 0) - selectedGrn.quantity}
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Quantity
                            </label>
                            <input
                                type="number"
                                value={additionalQuantity}
                                onChange={(e) => setAdditionalQuantity(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter additional quantity"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={deliveryNotes}
                                onChange={(e) => setDeliveryNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter any notes about this additional delivery"
                                rows="3"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsAddDeliveryModalOpen(false);
                                    setSelectedGrn(null);
                                    setAdditionalQuantity("");
                                    setDeliveryNotes("");
                                }}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAdditionalDelivery}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
