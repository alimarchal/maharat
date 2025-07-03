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
            if (data && data.url) {
                window.open(data.url, "_blank");
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