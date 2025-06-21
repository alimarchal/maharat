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
        chart_of_account_id: "",
        cost_center_id: "",
        credit_amount: "",
        debit_amount: "",
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
                    status: account.status || "Pending",
                    credit_amount: account.credit_amount || "",
                    debit_amount: account.debit_amount || "",
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    chart_of_account_id: "",
                    cost_center_id: "",
                    status: "Pending",
                    credit_amount: "",
                    debit_amount: "",
                });
            }
        }
    }, [isOpen, account, isEdit]);

    const fetchFormData = async () => {
        try {
            const costCentersResponse = await axios.get("/api/v1/cost-centers");
            setCostCenters(costCentersResponse.data.data || []);

            const chartOfAccountsResponse = await axios.get(
                "/api/v1/chart-of-accounts?include=accountCode"
            );

            const uniqueTypes = new Map();
            chartOfAccountsResponse.data.data.forEach((item) => {
                if (
                    item.account_code &&
                    !uniqueTypes.has(item.account_code.id)
                ) {
                    uniqueTypes.set(item.account_code.id, {
                        id: item.account_code.id,
                        label: item.account_code.account_type,
                    });
                }
            });

            const formattedTypes = Array.from(uniqueTypes.values());
            setAccountTypes(formattedTypes);
        } catch (error) {
            setErrors({ fetch: "Failed to load form data" });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle numeric fields for credit and debit amounts
        if (name === "credit_amount" || name === "debit_amount") {
            // Allow only numbers and decimal points
            const numericValue = value.replace(/[^0-9.]/g, "");
            // Prevent multiple decimal points
            const parts = numericValue.split(".");
            const formattedValue =
                parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : numericValue;

            setFormData({ ...formData, [name]: formattedValue });
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
        if (!formData.chart_of_account_id)
            validationErrors.chart_of_account_id = "Type is required";
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

        // Optional: Add validation to ensure both credit and debit are not entered simultaneously
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

        try {
            if (isEdit && account) {
                onSave(formData);
            } else {
                const selectedTypeId = parseInt(
                    formData.chart_of_account_id,
                    10
                );
                const selectedType = accountTypes.find(
                    (type) => type.id === selectedTypeId
                );

                if (!selectedType) {
                    setErrors({
                        chart_of_account_id:
                            "Please select a valid account type",
                    });
                    setIsSaving(false);
                    return;
                }

                try {
                    const chartOfAccountData = {
                        account_name: formData.name,
                        description: formData.description,
                        account_code_id: selectedType.id.toString(),
                        is_active: true,
                        parent_id: null,
                    };
                    const chartOfAccountResponse = await axios.post(
                        "/api/v1/chart-of-accounts",
                        chartOfAccountData
                    );
                    const accountData = {
                        name: formData.name,
                        description: formData.description,
                        chart_of_account_id:
                            chartOfAccountResponse.data.data.id.toString(),
                        cost_center_id: formData.cost_center_id.toString(),
                        department_id: null,
                        status: formData.status,
                        credit_amount: formData.credit_amount
                            ? parseFloat(formData.credit_amount)
                            : null,
                        debit_amount: formData.debit_amount
                            ? parseFloat(formData.debit_amount)
                            : null,
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
