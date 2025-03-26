import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const FiscalPeriodModal = ({ isOpen, onClose, fetchFiscalPeriods }) => {
    const [formData, setFormData] = useState({
        fiscal_year: "",
        period_number: "",
        period_name: "",
        start_date: "",
        end_date: "",
        status: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.fiscal_year)
            newErrors.fiscal_year = "Fiscal Year is required.";
        if (!formData.period_number)
            newErrors.period_number = "Period Number is required.";
        if (!formData.period_name)
            newErrors.period_name = "Period Name is required.";
        if (!formData.start_date)
            newErrors.start_date = "Start Date is required.";
        if (!formData.end_date) newErrors.end_date = "End Date is required.";
        if (!formData.status) newErrors.status = "Status is required.";

        if (
            formData.start_date &&
            formData.end_date &&
            new Date(formData.start_date) >= new Date(formData.end_date)
        ) {
            newErrors.end_date = "End date must be after start date.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await axios.post("/api/v1/fiscal-periods", formData);
            fetchFiscalPeriods();
            onClose();
        } catch (error) {
            setErrors(error.response?.data.errors || {});
            console.error("Error saving fiscal period:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Add Fiscal Period
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <InputFloating
                                label="Select Fiscal Year"
                                name="fiscal_year"
                                value={formData.fiscal_year}
                                onChange={handleChange}
                                type="date"
                            />
                            {errors.fiscal_year && (
                                <p className="text-red-500 text-sm">
                                    {errors.fiscal_year}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Period Number"
                                name="period_number"
                                value={formData.period_number}
                                onChange={handleChange}
                                type="number"
                            />
                            {errors.period_number && (
                                <p className="text-red-500 text-sm">
                                    {errors.period_number}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Period Name"
                                name="period_name"
                                value={formData.period_name}
                                onChange={handleChange}
                                type="text"
                            />
                            {errors.period_name && (
                                <p className="text-red-500 text-sm">
                                    {errors.period_name}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Select Start Date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                type="date"
                            />
                            {errors.start_date && (
                                <p className="text-red-500 text-sm">
                                    {errors.start_date}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Select End Date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                type="date"
                            />
                            {errors.end_date && (
                                <p className="text-red-500 text-sm">
                                    {errors.end_date}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { id: "Open", label: "Open" },
                                    { id: "Closed", label: "Closed" },
                                    { id: "Adjusting", label: "Adjusting" },
                                ]}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-sm">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FiscalPeriodModal;
