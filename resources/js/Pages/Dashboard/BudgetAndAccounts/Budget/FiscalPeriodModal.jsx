import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const FiscalPeriodModal = ({ isOpen, onClose, onSave, fiscalPeriod, fetchFiscalPeriods }) => {
    const [formData, setFormData] = useState({
        fiscal_year_id: "",
        period_name: "",
        start_date: "",
        end_date: "",
        status: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fiscalYears, setFiscalYears] = useState([]);
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);

    // Fetch fiscal years for dropdown
    React.useEffect(() => {
        if (isOpen) {
            fetchFiscalYears();
        }
    }, [isOpen]);

    const fetchFiscalYears = async () => {
        try {
            const response = await axios.get('/api/v1/fiscal-years');
            if (response.data && response.data.data) {
                setFiscalYears(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching fiscal years:", error);
        }
    };

    // Update form data when fiscalPeriod prop changes (for editing)
    React.useEffect(() => {
        if (fiscalPeriod) {
            setFormData({
                fiscal_year_id: fiscalPeriod.fiscal_year_id || "",
                period_name: fiscalPeriod.period_name || "",
                start_date: fiscalPeriod.start_date || "",
                end_date: fiscalPeriod.end_date || "",
                status: fiscalPeriod.status || "",
            });
        } else {
            // Reset form for new creation
            setFormData({
                fiscal_year_id: "",
                period_name: "",
                start_date: "",
                end_date: "",
                status: "",
            });
        }
        setErrors({});
    }, [fiscalPeriod, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'fiscal_year_id') {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
            // Set selected fiscal year for date validation
            const selected = fiscalYears.find(fy => fy.id == value);
            setSelectedFiscalYear(selected);
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
            
            // Auto-generate period name when start_date or end_date changes
            if (name === 'start_date' || name === 'end_date') {
                const startDate = name === 'start_date' ? value : formData.start_date;
                const endDate = name === 'end_date' ? value : formData.end_date;
                
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
                    const startDay = start.getDate();
                    const startYear = start.getFullYear();
                    
                    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
                    const endDay = end.getDate();
                    const endYear = end.getFullYear();
                    
                    const periodName = `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
                    
                    setFormData((prevData) => ({
                        ...prevData,
                        period_name: periodName,
                    }));
                }
            }
        }
    };

    const validateForm = () => {
        let newErrors = {};
        
        // If editing a fiscal period with budgets, only validate status
        if (fiscalPeriod && fiscalPeriod.budgets_count > 0) {
            if (!formData.status) newErrors.status = "Status is required.";
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        }
        
        // Full validation for new fiscal periods or fiscal periods without budgets
        if (!formData.fiscal_year_id)
            newErrors.fiscal_year_id = "Fiscal Year is required.";
        if (!formData.period_name)
            newErrors.period_name = "Period Name is required.";
        if (!formData.start_date)
            newErrors.start_date = "Start Date is required.";
        if (!formData.end_date) newErrors.end_date = "End Date is required.";
        if (!formData.status) newErrors.status = "Status is required.";

        // Date validation against selected fiscal year
        if (selectedFiscalYear && formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            const fiscalStartDate = new Date(selectedFiscalYear.start_date);
            const fiscalEndDate = new Date(selectedFiscalYear.end_date);

            if (startDate < fiscalStartDate) {
                const formattedDate = new Date(selectedFiscalYear.start_date).toLocaleDateString('en-GB');
                newErrors.start_date = `Start date cannot be before ${formattedDate}`;
            }
            if (startDate > fiscalEndDate) {
                const formattedDate = new Date(selectedFiscalYear.end_date).toLocaleDateString('en-GB');
                newErrors.start_date = `Start date cannot exceed ${formattedDate}`;
            }
            if (endDate < fiscalStartDate) {
                const formattedDate = new Date(selectedFiscalYear.start_date).toLocaleDateString('en-GB');
                newErrors.end_date = `End date cannot be before ${formattedDate}`;
            }
            if (endDate > fiscalEndDate) {
                const formattedDate = new Date(selectedFiscalYear.end_date).toLocaleDateString('en-GB');
                newErrors.end_date = `End date cannot exceed ${formattedDate}`;
            }
        }

        if (
            formData.start_date &&
            formData.end_date &&
            new Date(formData.start_date) >= new Date(formData.end_date)
        ) {
            newErrors.end_date = "End date must be after start date.";
        }

        // Prevent same start and end date
        if (
            formData.start_date &&
            formData.end_date &&
            formData.start_date === formData.end_date
        ) {
            newErrors.end_date = "Start date and end date cannot be the same.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            let dataToSend = formData;
            
            // If editing a fiscal period with budgets, only send status
            if (fiscalPeriod && fiscalPeriod.budgets_count > 0) {
                dataToSend = { status: formData.status };
            }
            
            if (fiscalPeriod) {
                // Update existing fiscal period
                await axios.put(`/api/v1/fiscal-periods/${fiscalPeriod.id}`, dataToSend);
            } else {
                // Create new fiscal period
                await axios.post("/api/v1/fiscal-periods", dataToSend);
            }
            
            if (onSave) {
                onSave();
            } else {
                fetchFiscalPeriods();
                onClose();
            }
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
                        {fiscalPeriod 
                            ? (fiscalPeriod.budgets_count > 0 ? "Update Fiscal Period Status" : "Edit Fiscal Period") 
                            : "Add Fiscal Period"
                        }
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                {/* Display backend validation errors */}
                {errors.date_combination && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.date_combination}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Show all fields for new fiscal periods or fiscal periods without budgets */}
                    {(!fiscalPeriod || fiscalPeriod.budgets_count === 0) && (
                        <>
                            {/* Force Fiscal Year and Status side by side */}
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <SelectFloating
                                        label="Fiscal Year"
                                        name="fiscal_year_id"
                                        value={formData.fiscal_year_id}
                                        onChange={handleChange}
                                        options={fiscalYears.map(fy => ({
                                            id: fy.id,
                                            label: fy.fiscal_year.toString()
                                        }))}
                                    />
                                    {errors.fiscal_year_id && (
                                        <p className="text-red-500 text-sm">
                                            {errors.fiscal_year_id}
                                        </p>
                                    )}
                                </div>
                                <div className="w-1/2">
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>
                        </>
                    )}
                    
                    {/* Show only status field for fiscal periods with budgets */}
                    {fiscalPeriod && fiscalPeriod.budgets_count > 0 && (
                        <div className="w-full">
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
                    )}
                    
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={loading}
                        >
                            {loading 
                                ? "Saving..." 
                                : fiscalPeriod 
                                    ? (fiscalPeriod.budgets_count > 0 ? "Update Status" : "Update") 
                                    : "Submit"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FiscalPeriodModal;
