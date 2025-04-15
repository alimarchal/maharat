import React, { useState, useEffect } from "react";
import { Link, router, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faEdit,
    faTrash,
    faCheck,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { usePage } from "@inertiajs/react";
import QuotationModal from "./QuotationModal";

const FileDisplay = ({ file, pendingFile }) => {
    // Helper function to fix file paths and extensions
    const fixFilePath = (filePath) => {
        if (!filePath) return null;
        let fixedPath = filePath;
        if (fixedPath.endsWith(".pdf.pdf")) {
            fixedPath = fixedPath.replace(".pdf.pdf", ".pdf");
        }
        if (
            fixedPath.includes("/storage/") &&
            !fixedPath.includes("/storage/public/")
        ) {
            fixedPath = fixedPath.replace("/storage/", "/storage/public/");
        }
        if (fixedPath.startsWith("http")) {
            return fixedPath;
        }

        fixedPath = `/storage/public/${fixedPath}`.replace(
            "/storage/public/public/",
            "/storage/public/"
        );
        return fixedPath;
    };

    // Try direct download via API
    const downloadFile = async (filePath) => {
        try {
            const filePathSegments = filePath.split("/");
            const fileName = filePathSegments[filePathSegments.length - 1];
            window.open(filePath, "_blank");

            try {
                const response = await axios.get(
                    `/api/v1/download-file?path=${encodeURIComponent(
                        fileName
                    )}&type=quotation`
                );
                if (response.data && response.data.download_url) {
                    window.open(response.data.download_url, "_blank");
                }
            } catch (error) {
                window.open(filePath, "_blank");
            }
        } catch (error) {
            alert("Could not download file. Please contact support.");
        }
    };

    // If there's a pending file to be uploaded, show it as a preview with an indicator
    if (pendingFile) {
        const tempUrl = URL.createObjectURL(pendingFile);

        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon
                    className="h-10 w-10 text-orange-500 cursor-pointer hover:text-orange-700 transition-colors"
                    onClick={() => window.open(tempUrl, "_blank")}
                />
                <span className="text-sm text-orange-600 text-center break-words whitespace-normal w-full">
                    {pendingFile.name} (Pending save)
                </span>
            </div>
        );
    }

    if (!file)
        return <span className="text-gray-500">No document attached</span>;

    const fileUrl = file.file_path ? fixFilePath(file.file_path) : null;

    // Fix display name if needed
    let displayName = file.original_name || "Document";
    if (displayName.endsWith(".pdf.pdf")) {
        displayName = displayName.replace(".pdf.pdf", ".pdf");
    }

    console.log("Prepared document URL:", fileUrl);

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <DocumentArrowDownIcon
                className="h-10 w-10 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => fileUrl && downloadFile(fileUrl)}
            />

            {displayName && (
                <span
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                    onClick={() => fileUrl && downloadFile(fileUrl)}
                >
                    {displayName}
                </span>
            )}
        </div>
    );
};

export default function QuotationRFQ({ auth }) {
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    const rfqId = urlParams.get("rfq_id");

    const [quotations, setQuotations] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [companiesMap, setCompaniesMap] = useState({});
    const [suppliersMap, setSuppliersMap] = useState({});
    const [rfqNumber, setRfqNumber] = useState("");
    const [attachingFile, setAttachingFile] = useState(false);
    const [tempDocuments, setTempDocuments] = useState({});

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const response = await axios.get(
                `/api/v1/quotations?page=${currentPage}&rfq_id=${rfqId}&t=${timestamp}`
            );
            const quotationsData = response.data.data || [];

            const updatedQuotations = quotationsData
                .filter((q) => q.rfq_id == rfqId)
                .map((quotation) => {
                    let companyName = "";
                    if (
                        quotation.rfq &&
                        quotation.rfq.company_id &&
                        companiesMap[quotation.rfq.company_id]
                    ) {
                        companyName = companiesMap[quotation.rfq.company_id];
                    } else if (quotation.rfq && quotation.rfq.company) {
                        companyName = quotation.rfq.company.name;
                    } else if (quotation.company_name) {
                        companyName = quotation.company_name;
                    }

                    let supplierName = "";
                    if (
                        quotation.supplier_id &&
                        suppliersMap[quotation.supplier_id]
                    ) {
                        supplierName = suppliersMap[quotation.supplier_id];
                    } else if (quotation.supplier) {
                        supplierName = quotation.supplier.name;
                    }

                    return {
                        ...quotation,
                        company_name: companyName,
                        supplier_name: supplierName,
                        documents: quotation.documents || [],
                    };
                });

            setQuotations(updatedQuotations);

            const meta = response.data.meta || {};
            const calculatedLastPage = Math.max(
                1,
                Math.ceil(updatedQuotations.length / 10)
            );
            setLastPage(meta.last_page || calculatedLastPage);
            setError("");
        } catch (error) {
            setError(
                "Failed to load quotations: " +
                    (error.response?.data?.message || error.message)
            );
            setQuotations([]);
            setLastPage(1);
        } finally {
            setLoading(false);
        }
    };

    const fetchRfqNumber = async () => {
        if (!rfqId) return;
        try {
            const response = await axios.get(`/api/v1/rfqs/${rfqId}`);
            setRfqNumber(response.data.data.rfq_number);
        } catch (error) {
            setRfqNumber("N/A");
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/v1/companies");

            const compMap = {};
            response.data.data.forEach((company) => {
                compMap[company.id] = company.name;
            });
            setCompaniesMap(compMap);
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get("/api/v1/suppliers");

            const suppMap = {};
            response.data.data.forEach((supplier) => {
                suppMap[supplier.id] = supplier.name;
            });
            setSuppliersMap(suppMap);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    useEffect(() => {
        if (rfqId) {
            Promise.all([fetchCompanies(), fetchSuppliers()]).then(() => {
                fetchQuotations();
                fetchRfqNumber();
            });
        }
    }, [currentPage, rfqId]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            await axios.delete(`/api/v1/quotations/${id}`);
            fetchQuotations();
        } catch (error) {
            setError("Failed to delete record");
        }
    };

    const handleAddQuotation = () => {
        setSelectedQuotation(null);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEditQuotation = (quotation) => {
        setSelectedQuotation(quotation);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSaveQuotation = () => {
        fetchQuotations();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedQuotation(null);
    };

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
            <div className="min-h-screen w-full bg-[#C4E4F0] bg-opacity-5 p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/new-quotation")}
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
                    <Link
                        href="/quotation"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Quotations
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <Link
                        href="/new-quotation"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        {" "}
                        Add Quotations
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <span className="text-[#009FDC] text-xl">
                        {" "}
                        Add Quotation to RFQ{" "}
                    </span>
                </div>
                <Head title="Add Quotation to RFQ" />

                <div className="w-full">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">
                            Add Quotation to RFQ
                        </h2>
                        <button
                            onClick={handleAddQuotation}
                            className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium flex items-center"
                        >
                            Add Quotation
                        </button>
                    </div>

                    <div className="flex items-center w-full gap-4 my-6">
                        <h3 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                            {rfqNumber}
                        </h3>
                        <div
                            className="h-[3px] flex-grow"
                            style={{
                                background:
                                    "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                            }}
                        ></div>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                        Quotation #
                                    </th>
                                    <th className="py-3 px-4">Company</th>
                                    <th className="py-3 px-4">Supplier</th>
                                    <th className="py-3 px-4">Issue Date</th>
                                    <th className="py-3 px-4">Expiry Date</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4 text-center">
                                        Attachment
                                    </th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
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
                                ) : quotations.length > 0 ? (
                                    quotations.map((quotation) => (
                                        <tr key={quotation.id}>
                                            <td className="px-3 py-4">
                                                {quotation.quotation_number}
                                            </td>
                                            <td className="px-3 py-4">
                                                {quotation.company_name ||
                                                    "No company"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {quotation.supplier_name ||
                                                    "No supplier"}
                                            </td>
                                            <td className="px-3 py-4">
                                                {formatDateForDisplay(
                                                    quotation.issue_date
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                {formatDateForDisplay(
                                                    quotation.valid_until
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                {parseInt(
                                                    quotation.total_amount || 0
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    {quotation.documents &&
                                                    quotation.documents[0] ? (
                                                        <FileDisplay
                                                            file={
                                                                quotation
                                                                    .documents[0]
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-gray-500">
                                                            No document attached
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-3 py-4 flex justify-center text-center space-x-3">
                                                <button
                                                    onClick={() =>
                                                        handleEditQuotation(
                                                            quotation
                                                        )
                                                    }
                                                    className="text-blue-400 hover:text-blue-500"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faEdit}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            quotation.id
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
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
                                            No quotations available for this
                                            RFQ.
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

            {/* Quotation Modal */}
            <QuotationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveQuotation}
                quotation={selectedQuotation}
                isEdit={isEditMode}
                rfqId={rfqId}
            />
        </AuthenticatedLayout>
    );
}
