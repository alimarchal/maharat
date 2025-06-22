import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const AccountsModal = ({
    isOpen,
    onClose,
    onSave,
    account = null,
    isEdit = false,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        status: "",
        description: "",
        account_code_id: "",
        cost_center_id: "",
        credit_amount: "",
        debit_amount: "",
    });

    const [costCenters, setCostCenters] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isOpen) {
                setIsLoading(true);
                await fetchFormData();
                if (isEdit && account) {
                    const newFormData = {
                        name: account.name || "",
                        description: account.description || "",
                        account_code_id: account.account_code_id || "",
                        cost_center_id: account.cost_center_id || "",
                        status: account.status || "Pending",
                        credit_amount: account.credit_amount !== null && account.credit_amount !== undefined ? account.credit_amount.toString() : "",
                        debit_amount: account.debit_amount !== null && account.debit_amount !== undefined ? account.debit_amount.toString() : "",
                    };
                    setFormData(newFormData);
                } else {
                    setFormData({
                        name: "",
                        description: "",
                        account_code_id: "",
                        cost_center_id: "",
                        status: "Pending",
                        credit_amount: "",
                        debit_amount: "",
                    });
                }
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [isOpen, account, isEdit]);

    // Add debugging for formData changes
    useEffect(() => {
        if (isEdit && account) {
            console.log("Current formData:", formData);
        }
    }, [formData, isEdit, account]);

    const fetchFormData = async () => {
        try {
            const costCentersResponse = await axios.get("/api/v1/cost-centers");
            setCostCenters(costCentersResponse.data.data || []);

            // Fetch account types directly from account_codes table
            const accountCodesResponse = await axios.get("/api/v1/account-codes");
            
            const accountTypes = accountCodesResponse.data.data.map((accountCode) => ({
                id: accountCode.id,
                label: accountCode.account_type,
            }));

            setAccountTypes(accountTypes);
        } catch (error) {
            setErrors({ fetch: "Failed to load form data" });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "credit_amount") {
            // If user enters credit, clear and disable debit
            const numericValue = value.replace(/[^0-9.]/g, "");
            const parts = numericValue.split(".");
            const formattedValue =
                parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : numericValue;
            setFormData({
                ...formData,
                credit_amount: formattedValue,
                debit_amount: formattedValue ? "" : formData.debit_amount,
            });
        } else if (name === "debit_amount") {
            // If user enters debit, clear and disable credit
            const numericValue = value.replace(/[^0-9.]/g, "");
            const parts = numericValue.split(".");
            const formattedValue =
                parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : numericValue;
            setFormData({
                ...formData,
                debit_amount: formattedValue,
                credit_amount: formattedValue ? "" : formData.credit_amount,
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        const validationErrors = {};
        if (!formData.name) validationErrors.name = "Name is required";
        if (!formData.cost_center_id)
            validationErrors.cost_center_id = "Cost Center is required";
        if (!formData.account_code_id)
            validationErrors.account_code_id = "Type is required";
        if (!formData.status) validationErrors.status = "Status is required";

        // Validate credit and debit amounts
        if (
            formData.credit_amount &&
            isNaN(parseFloat(formData.credit_amount))
        ) {
            validationErrors.credit_amount =
                "Credit amount must be a valid number";
        }
        if (formData.debit_amount && isNaN(parseFloat(formData.debit_amount))) {
            validationErrors.debit_amount =
                "Debit amount must be a valid number";
        }

        // Only one of credit or debit can be filled
        if (formData.credit_amount && formData.debit_amount) {
            validationErrors.credit_amount =
                "Cannot have both credit and debit amounts";
            validationErrors.debit_amount =
                "Cannot have both credit and debit amounts";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            return;
        }

        // Ensure only one is sent as non-null
        const cleanFormData = {
            ...formData,
            credit_amount: formData.credit_amount
                ? parseFloat(formData.credit_amount)
                : null,
            debit_amount: formData.debit_amount
                ? parseFloat(formData.debit_amount)
                : null,
        };
        if (cleanFormData.credit_amount) cleanFormData.debit_amount = null;
        if (cleanFormData.debit_amount) cleanFormData.credit_amount = null;

        try {
            if (isEdit && account) {
                // Simplified Edit: Just update the account and its associated chart of account
                const updatedAccountData = {
                    ...cleanFormData,
                    id: account.id,
                    account_code_id: formData.account_code_id,
                };

                // Also update the associated chart of accounts record for consistency
                await axios.put(`/api/v1/chart-of-accounts/${account.chart_of_account_id}`, {
                    account_name: formData.name,
                    description: formData.description,
                    account_code_id: formData.account_code_id,
                });
                
                onSave(updatedAccountData);

            } else {
                // Add New Account
                const selectedTypeId = parseInt(formData.account_code_id, 10);
                const selectedType = accountTypes.find(
                    (type) => type.id === selectedTypeId
                );

                if (!selectedType) {
                    setErrors({ account_code_id: "Please select a valid account type" });
                    setIsSaving(false);
                    return;
                }

                try {
                    // Step 1: Create the chart_of_account record
                    const chartOfAccountData = {
                        account_name: formData.name,
                        description: formData.description,
                        account_code_id: selectedTypeId.toString(),
                        is_active: true,
                        parent_id: null,
                    };
                    const chartOfAccountResponse = await axios.post(
                        "/api/v1/chart-of-accounts",
                        chartOfAccountData
                    );

                    // Step 2: Create the account record, linking to the new chart and adding the type ID
                    const accountData = {
                        name: formData.name,
                        description: formData.description,
                        chart_of_account_id: chartOfAccountResponse.data.data.id.toString(),
                        account_code_id: selectedTypeId.toString(),
                        cost_center_id: formData.cost_center_id.toString(),
                        department_id: null,
                        status: formData.status,
                        credit_amount: cleanFormData.credit_amount,
                        debit_amount: cleanFormData.debit_amount,
                    };
                    onSave(accountData);
                } catch (chartError) {
                    if (chartError.response?.data?.errors) {
                        setErrors(chartError.response.data.errors);
                    } else {
                        setErrors({
                            submit:
                                chartError.response?.data?.message ||
                                "Failed to process chart of account",
                        });
                    }
                    setIsSaving(false);
                    return;
                }
            }
            onClose();
        } catch (error) {
            setErrors(error.response.data.errors);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const costCenterOptions = costCenters.map((center) => ({
        id: center.id,
        label: center.name,
    }));

    const statusOptions = [
        { id: "Approved", label: "Approved" },
        { id: "Pending", label: "Pending" },
    ];

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            options={isLoading ? [{ id: '', label: 'Loading...' }] : costCenterOptions}
                            disabled={isLoading}
                            error={errors.cost_center_id}
                        />
                        <SelectFloating
                            label="Type"
                            name="account_code_id"
                            value={formData.account_code_id}
                            onChange={handleChange}
                            options={isLoading ? [{ id: '', label: 'Loading...' }] : accountTypes}
                            disabled={isLoading}
                            error={errors.account_code_id}
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
                            label="Credit Amount"
                            name="credit_amount"
                            type="text"
                            value={formData.credit_amount}
                            onChange={handleChange}
                            error={errors.credit_amount}
                        />
                        <InputFloating
                            label="Debit Amount"
                            name="debit_amount"
                            type="text"
                            value={formData.debit_amount}
                            onChange={handleChange}
                            error={errors.debit_amount}
                        />
                    </div>
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
                            {isSaving
                                ? "Saving..."
                                : isEdit
                                ? "Update"
                                : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountsModal;
