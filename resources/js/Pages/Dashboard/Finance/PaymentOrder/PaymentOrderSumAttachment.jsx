import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";

const PaymentOrderSumAttachment = ({ paymentOrderNumber }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleClick = async () => {
        setLoading(true);
        setError("");
        try {
            // Call backend endpoint to get combined PDF URL
            const res = await fetch(`/api/v1/payment-orders/${paymentOrderNumber}/combined-attachment`);
            if (!res.ok) throw new Error("Failed to fetch combined attachment");
            const data = await res.json();
            if (data && data.merged_pdf_url) {
                // Extract the relative path from the merged_pdf_url or from the backend (preferably from uploaded_attachment if returned)
                let relativePath = null;
                if (data.uploaded_attachment) {
                    relativePath = data.uploaded_attachment;
                } else if (data.merged_pdf_url) {
                    // Fallback: extract after /storage/
                    const match = data.merged_pdf_url.match(/\/storage\/(.+)$/);
                    if (match) relativePath = match[1];
                }
                if (relativePath) {
                    window.open(`/storage/${relativePath}`, "_blank");
                } else {
                    setError("No combined PDF available");
                }
            } else {
                setError("No combined PDF available");
            }
        } catch (err) {
            setError("Error loading combined attachment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <span>
            <button
                className="text-[#009FDC] hover:text-blue-800 cursor-pointer"
                onClick={handleClick}
                title="View Combined Attachments"
                disabled={loading}
            >
                <FontAwesomeIcon icon={faPaperclip} />
            </button>
            {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
        </span>
    );
};

export default PaymentOrderSumAttachment; 