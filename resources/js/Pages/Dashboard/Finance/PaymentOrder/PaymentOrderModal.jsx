import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import SelectFloating from "../../../../Components/SelectFloating";

const PaymentOrderModal = ({ isOpen, onClose, selectedOrder }) => {
    const userId = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        description: "",
        action: "",
        priority: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    console.log("Test:", selectedOrder);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let newErrors = {};
        if (!formData.description)
            newErrors.description = "Description is required";
        if (!formData.action) newErrors.action = "Action is required";
        if (!formData.priority) newErrors.priority = "Priority is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            try {
                setLoading(true);

                const paymentOrderPayload = {
                    user_id: userId,
                    purchase_order_id: selectedOrder?.id,
                    date: selectedOrder?.purchase_order_date,
                    attachment: selectedOrder?.attachment,
                };

                const response = await axios.post(
                    "/api/v1/payment-orders",
                    paymentOrderPayload
                );

                const paymentLogsPayload = {
                    ...formData,
                    payment_order_id: response.data.data?.id,
                };

                await axios.post(
                    "/api/v1/payment-order-logs",
                    paymentLogsPayload
                );

                setLoading(false);
                onClose();
                router.visit("/payment-orders");
            } catch (error) {
                setLoading(false);
                console.error("Error creating payment order:", error);
            }
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl">
                <div className="flex justify-between border-b pb-2 mb-6">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Create New Payment Order
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
                        <div className="w-full">
                            <SelectFloating
                                label="Action"
                                name="action"
                                value={formData.action}
                                onChange={handleChange}
                                options={[
                                    { id: "Approved", label: "Approved" },
                                    { id: "Reject", label: "Reject" },
                                    // { id: "Refer", label: "Refer" },
                                ]}
                            />
                            {errors.action && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.action}
                                </p>
                            )}
                        </div>
                        <div className="w-full">
                            <SelectFloating
                                label="Priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                options={[
                                    { id: "Urgent", label: "Urgent" },
                                    { id: "High", label: "High" },
                                    { id: "Standard", label: "Standard" },
                                    { id: "Low", label: "Low" },
                                ]}
                            />
                            {errors.priority && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.priority}
                                </p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative w-full">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full h-36 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                ></textarea>
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                            peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                            peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1
                            ${
                                formData.description
                                    ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                    : "top-4 text-base text-gray-400"
                            }`}
                                >
                                    Description
                                </label>
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="my-4 flex justify-center md:justify-end w-full">
                        <button
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto"
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentOrderModal;
