import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const AccountsModal = ({ isOpen, onClose, onSave, account = null, isEdit = false }) => {
    const [formData, setFormData] = useState({
        name: "",
        status: "",
        description: "",
        chart_of_account_id: "",
        cost_center_id: "",
    });

    const [costCenters, setCostCenters] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFormData();
            if (account && isEdit) {
                setFormData({
                    name: account.name || "",
                    description: account.description || "",
                    chart_of_account_id: account.chart_of_account_id || "",
                    cost_center_id: account.cost_center_id || "",
                    status: account.status || "Pending"
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    chart_of_account_id: "",
                    cost_center_id: "",
                    status: "Pending"
                });
            }
        }
    }, [isOpen, account, isEdit]);

    const fetchFormData = async () => {
        try {
            // Fetch cost centers
            const costCentersResponse = await axios.get('/api/v1/cost-centers');
            setCostCenters(costCentersResponse.data.data || []);
            
            // Fetch chart of accounts with account code relationship
            const chartOfAccountsResponse = await axios.get('/api/v1/chart-of-accounts?include=accountCode');
            console.log('Chart of accounts response:', chartOfAccountsResponse.data);
            
            // Extract unique account types from chart of accounts
            const uniqueTypes = new Map();
            chartOfAccountsResponse.data.data.forEach(item => {
                if (item.account_code && !uniqueTypes.has(item.account_code.id)) {
                    uniqueTypes.set(item.account_code.id, {
                        id: item.account_code.id,
                        label: item.account_code.account_type
                    });
                }
            });
            
            const formattedTypes = Array.from(uniqueTypes.values());
            console.log('Formatted account types:', formattedTypes);
            setAccountTypes(formattedTypes);
        } catch (error) {
            console.error('Error fetching form data:', error);
            setErrors({ fetch: "Failed to load form data" });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted with data:', formData);
        setIsSaving(true);
        setErrors({});
        
        // Validate required fields
        const validationErrors = {};
        if (!formData.name) validationErrors.name = "Name is required";
        if (!formData.cost_center_id) validationErrors.cost_center_id = "Cost Center is required";
        if (!formData.chart_of_account_id) validationErrors.chart_of_account_id = "Type is required";
        if (!formData.status) validationErrors.status = "Status is required";
        
        if (Object.keys(validationErrors).length > 0) {
            console.log('Validation errors:', validationErrors);
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }
        
        try {
            if (isEdit && account) {
                // For editing, just pass the form data to the parent component
                console.log('Editing account with data:', formData);
                onSave(formData);
            } else {
                // For creating a new account, first create a chart of account
                console.log('Creating new account with data:', formData);
                console.log('Available account types:', accountTypes);
                
                // Convert chart_of_account_id to a number for comparison
                const selectedTypeId = parseInt(formData.chart_of_account_id, 10);
                console.log('Looking for account type with ID:', selectedTypeId);
                
                const selectedType = accountTypes.find(type => type.id === selectedTypeId);
                console.log('Selected account type:', selectedType);
                
                if (!selectedType) {
                    console.error('No valid account type selected');
                    setErrors({ chart_of_account_id: "Please select a valid account type" });
                    setIsSaving(false);
                    return;
                }
                
                try {
                    // Create a new chart of account
                    const chartOfAccountData = {
                        account_name: formData.name,
                        description: formData.description,
                        account_code_id: selectedType.id.toString(), // Convert to string
                        is_active: true,
                        parent_id: null
                    };
                    
                    console.log('Creating chart of account with:', chartOfAccountData);
                    
                    const chartOfAccountResponse = await axios.post('/api/v1/chart-of-accounts', chartOfAccountData);
                    console.log('Chart of account created:', chartOfAccountResponse.data);
                    
                    // Use the new chart of account's ID for the account
                    const accountData = {
                        name: formData.name,
                        description: formData.description,
                        chart_of_account_id: chartOfAccountResponse.data.data.id.toString(), // Convert to string
                        cost_center_id: formData.cost_center_id.toString(), // Convert to string
                        department_id: null,
                        status: formData.status
                    };
                    
                    console.log('Creating account with data:', accountData);
                    
                    // Pass the account data to the parent component
                    onSave(accountData);
                } catch (chartError) {
                    console.error("Error with chart of account:", chartError);
                    if (chartError.response?.data?.errors) {
                        console.log('Chart of account validation errors:', chartError.response.data.errors);
                        setErrors(chartError.response.data.errors);
                    } else {
                        setErrors({ submit: chartError.response?.data?.message || "Failed to process chart of account" });
                    }
                    setIsSaving(false);
                    return;
                }
            }
            
            onClose();
        } catch (error) {
            console.error("Error saving account:", error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: error.response?.data?.message || "Failed to save account" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Format cost centers for SelectFloating
    const costCenterOptions = costCenters.map(center => ({
        id: center.id,
        label: center.name
    }));

    // Status options
    const statusOptions = [
        { id: "Approved", label: "Approved" },
        { id: "Pending", label: "Pending" }
    ];

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-lg">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit ? "Edit Account" : "Add Account"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputFloating
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                    />
                    <SelectFloating
                        label="Cost Center"
                        name="cost_center_id"
                        value={formData.cost_center_id}
                        onChange={handleChange}
                        options={costCenterOptions}
                        error={errors.cost_center_id}
                    />
                    <SelectFloating
                        label="Type"
                        name="chart_of_account_id"
                        value={formData.chart_of_account_id}
                        onChange={handleChange}
                        options={accountTypes}
                        error={errors.chart_of_account_id}
                    />
                    <SelectFloating
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                        error={errors.status}
                    />
                    <InputFloating
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        error={errors.description}
                    />
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : (isEdit ? "Save" : "Submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountsModal;
