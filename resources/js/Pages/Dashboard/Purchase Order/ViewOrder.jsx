import React, { useState, useEffect } from "react";
import { Link, router, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const FileDisplay = ({ file, fileName }) => {
    if (!file) return null;

    const fileUrl = file;
    const displayName = fileName || "View Attachment";

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && window.open(fileUrl, "_blank")}
            />

            {fileUrl && (
                <span
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && window.open(fileUrl, "_blank")}
                >
                    {displayName}
                </span>
            )}
        </div>
    );
};

export default function ViewOrder({ auth }) {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchPurchaseOrders = async () => {
        setLoading(true);

        try {
            const response = await axios.get("/api/v1/purchase-orders", {
                params: {
                    page: currentPage,
                    include: "quotation",
                    per_page: 10,
                },
            });
            const purchaseOrdersData = response.data.data || [];

            const purchaseOrdersWithDetails = await Promise.all(
                purchaseOrdersData.map(async (order) => {
                    let quotationDetails = {
                        quotation_number: "N/A",
                        company_name: "N/A",
                    };
                    if (order.quotation) {
                        quotationDetails = {
                            quotation_number:
                                order.quotation.quotation_number || "N/A",
                            company_name: order.quotation.company_name || "N/A",
                        };
                    } else if (order.quotation_id) {
                        try {
                            const quotationResponse = await axios.get(
                                `/api/v1/quotations/${order.quotation_id}`
                            );
                            if (quotationResponse.data.data) {
                                quotationDetails = {
                                    quotation_number:
                                        quotationResponse.data.data
                                            .quotation_number || "N/A",
                                    company_name:
                                        quotationResponse.data.data
                                            .company_name || "N/A",
                                };
                            }
                        } catch (error) {
                            console.error(
                                `Error fetching quotation ${order.quotation_id}:`,
                                error
                            );
                        }
                    }

                    let attachmentUrl = null;
                    if (order.attachment) {
                        attachmentUrl = order.attachment.startsWith("http")
                            ? order.attachment
                            : `/storage/${order.attachment}`;
                    }
                    return {
                        ...order,
                        quotation_number: quotationDetails.quotation_number,
                        company_name: quotationDetails.company_name,
                        purchase_order_date: order.purchase_order_date,
                        expiry_date: order.expiry_date,
                        formatted_attachment: attachmentUrl,
                        original_name: order.original_name || "Document",
                    };
                })
            );

            setPurchaseOrders(purchaseOrdersWithDetails);
            setLastPage(response.data.meta?.last_page || 1);
            setError("");
        } catch (error) {
            setError(
                "Failed to load purchase orders. " +
                    (error.response?.data?.message || "")
            );
            setPurchaseOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, [currentPage]);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/dashboard")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}
                            className="mr-2 text-2xl"
                        />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link
                        href="/dashboard"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Dashboard
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <span className="text-[#009FDC] text-xl">
                        Purchase Orders
                    </span>
                </div>
                <Head title="Purchase Orders" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">
                            Purchase Orders
                        </h2>
                        <Link
                            href="/create-order"
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                        >
                            Create New Purchase Order
                        </Link>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                        PO #
                                    </th>
                                    <th className="py-3 px-4">Quotation #</th>
                                    <th className="py-3 px-4">Company</th>
                                    <th className="py-3 px-4">Issue Date</th>
                                    <th className="py-3 px-4">Expiry Date</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4 text-center">
                                        Attachment
                                    </th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                                        Action
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
                                ) : purchaseOrders.length > 0 ? (
                                    purchaseOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-3 py-4">
                                                {order.purchase_order_no ||
                                                    "N/A"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {order.quotation_number ||
                                                    "N/A"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {order.company_name || "N/A"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {formatDateForDisplay(
                                                    order.purchase_order_date
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                {formatDateForDisplay(
                                                    order.expiry_date
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                {Number(
                                                    order.amount || 0
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    {order.formatted_attachment ? (
                                                        <FileDisplay
                                                            file={
                                                                order.formatted_attachment
                                                            }
                                                            fileName={
                                                                order.original_name
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-gray-500">
                                                            No attachment
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                                <button className="w-4 h-4">
                                                    <img
                                                        src="/images/pdf-file.png"
                                                        alt="PDF"
                                                        className="w-full h-full"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="text-center py-4"
                                        >
                                            No purchase orders available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {!loading && !error && purchaseOrders.length > 0 && (
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
                                        } rounded-full hover:bg-[#0077B6] hover:text-center transition`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
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
        </AuthenticatedLayout>
    );
}
