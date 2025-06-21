import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";

const FiscalYearModal = ({ isOpen, onClose, onSave, fiscalYear, fetchFiscalYears }) => {
    const [formData, setFormData] = useState({
        fiscal_year: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [existingFiscalYears, setExistingFiscalYears] = useState([]);

    // Fetch existing fiscal years to check for duplicates
    React.useEffect(() => {
        if (isOpen) {
            fetchExistingFiscalYears();
        }
    }, [isOpen]);

    const fetchExistingFiscalYears = async () => {
        try {
            const response = await axios.get('/api/v1/fiscal-years');
            if (response.data && response.data.data) {
                const years = response.data.data.map(fy => fy.fiscal_year);
                setExistingFiscalYears(years);
            }
        } catch (error) {
            console.error("Error fetching existing fiscal years:", error);
        }
    };

    // Update form data when fiscalYear prop changes (for editing)
    React.useEffect(() => {
        if (fiscalYear) {
            setFormData({
                fiscal_year: fiscalYear.fiscal_year || "",
            });
        } else {
            // Reset form for new creation
            setFormData({
                fiscal_year: "",
            });
        }
        setErrors({});
    }, [fiscalYear, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'fiscal_year') {
            // Extract only the year from the date input
            const year = value ? new Date(value).getFullYear() : '';
            setFormData((prevData) => ({
                ...prevData,
                [name]: year,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.fiscal_year)
            newErrors.fiscal_year = "Fiscal Year is required.";
        else {
            const year = parseInt(formData.fiscal_year);
            if (isNaN(year) || year < 1900 || year > 2100) {
                newErrors.fiscal_year = "Fiscal Year must be a valid year between 1900 and 2100.";
            } else if (existingFiscalYears.includes(year) && (!fiscalYear || fiscalYear.fiscal_year !== year)) {
                newErrors.fiscal_year = `Fiscal Year ${year} is already added.`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (fiscalYear) {
                // Update existing fiscal year
                await axios.put(`/api/v1/fiscal-years/${fiscalYear.id}`, formData);
            } else {
                // Create new fiscal year
                await axios.post("/api/v1/fiscal-years", formData);
            }
            
            if (onSave) {
                onSave();
            } else {
                fetchFiscalYears();
                onClose();
            }
        } catch (error) {
            setErrors(error.response?.data.errors || {});
            console.error("Error saving fiscal year:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-md">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {fiscalYear ? "Edit Fiscal Year" : "Create Fiscal Year"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="w-full">
                        <InputFloating
                            label="Select Fiscal Year"
                            name="fiscal_year"
                            value={formData.fiscal_year ? `${formData.fiscal_year}-01-01` : ""}
                            onChange={handleChange}
                            type="date"
                            placeholder="Select Year"
                        />
                        {errors.fiscal_year && (
                            <p className="text-red-500 text-sm">
                                {errors.fiscal_year}
                            </p>
                        )}
                    </div>
                    <div className="w-full mt-4">
                        <button
                            type="submit"
                            className="px-6 py-2 text-lg font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : fiscalYear ? "Update" : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FiscalYearModal; 