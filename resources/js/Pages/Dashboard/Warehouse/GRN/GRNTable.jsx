import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ViewGRNModal from "./ViewGRNModal";

export default function GRNTable() {
    const [grns, setGrns] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedGrn, setSelectedGrn] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchGrns = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/grns?include=user,quotation.supplier,purchaseOrder,receiveGoods.supplier,receiveGoods.category,externalDeliveryNote&page=${currentPage}`
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

    return (
        <div className="w-full">
            <div className="w-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">
                        Good Receiving Notes
                    </h2>
                    <Link
                        href="/goods-receiving-notes/create"
                        className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                    >
                        Create GRNs
                    </Link>
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
                                <th className="py-3 px-4">Delivery Date</th>
                                <th className="py-3 px-4">Attachment</th>
                                <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center py-12"
                                    >
                                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan="8"
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
                                        colSpan="8"
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

            {/* View GRN Modal */}
            <ViewGRNModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedGrn(null);
                }}
                grn={selectedGrn}
            />
        </div>
    );
}
