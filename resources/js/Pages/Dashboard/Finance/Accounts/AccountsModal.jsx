import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
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
        account_number: "",
        status: "",
        description: "",
        account_code_id: "",
        cost_center_id: "",
        credit_amount: "",
        debit_amount: "",
        invoice_number: "",
    });

    const [costCenters, setCostCenters] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tempFile, setTempFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isOpen) {
                setIsLoading(true);
                await fetchFormData();
                if (isEdit && account) {
                    const newFormData = {
                        name: account.name || "",
                        account_number: account.account_number || "",
                        description: account.description || "",
                        account_code_id: account.account_code_id || "",
                        cost_center_id: account.cost_center_id || "",
                        status: account.status || "Pending",
                        credit_amount: "", // Clear in edit mode
                        debit_amount: "", // Clear in edit mode
                        invoice_number: account.invoice_number || "",
                    };
                    setFormData(newFormData);
                } else {
                    setFormData({
                        name: "",
                        account_number: "",
                        description: "",
                        account_code_id: "",
                        cost_center_id: "",
                        status: "Pending",
                        credit_amount: "",
                        debit_amount: "",
                        invoice_number: "",
                    });
                }
                setTempFile(null); // Reset file on modal open
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
            const accountCodesResponse = await axios.get(
                "/api/v1/account-codes"
            );

            const accountTypes = accountCodesResponse.data.data.map(
                (accountCode) => ({
                    id: accountCode.id,
                    label: accountCode.account_type,
                })
            );

            setAccountTypes(accountTypes);
        } catch (error) {
            setErrors({ fetch: "Failed to load form data" });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrors({
                    ...errors,
                    attachment: "File size must be less than 10MB",
                });
                return;
            }

            // Validate file type (common document and image types)
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain",
            ];

            if (!allowedTypes.includes(file.type)) {
                setErrors({
                    ...errors,
                    attachment:
                        "Please select a valid file type (PDF, DOC, DOCX, XLS, XLSX, TXT, or image)",
                });
                return;
            }

            setTempFile(file);
            setErrors({ ...errors, attachment: "" }); // Clear any previous errors
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

            if (isEdit && account) {
                // In edit mode, treat the input as the increase amount
                const originalCredit = parseFloat(account.credit_amount || 0);
                const increaseAmount = parseFloat(formattedValue) || 0;
                const newTotalCredit = originalCredit + increaseAmount;

                setFormData({
                    ...formData,
                    credit_amount: formattedValue, // Keep the user input as is for display
                    debit_amount: "", // Clear debit
                });

                // Store the calculated total in a hidden field or state for backend
                setFormData((prev) => ({
                    ...prev,
                    _calculated_credit_amount: newTotalCredit,
                }));
            } else {
                // In create mode, use the value as is
                setFormData({
                    ...formData,
                    credit_amount: formattedValue,
                    debit_amount: formattedValue ? "" : formData.debit_amount,
                });
            }
        } else if (name === "debit_amount") {
            // Temporarily disable debit field in edit mode
            if (isEdit && account) {
                return; // Don't allow changes to debit field in edit mode
            }

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

    const uploadFile = async (file) => {
        if (!file) return null;

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", "accounts"); // Optional: organize files by folder

        try {
            const response = await axios.post(
                "/api/v1/upload",
                uploadFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data.file_path || response.data.url; // Adjust based on your API response
        } catch (error) {
            console.error("File upload failed:", error);
            throw new Error("Failed to upload file");
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

        try {
            // Upload file if present
            let attachmentPath = null;
            if (tempFile) {
                try {
                    attachmentPath = await uploadFile(tempFile);
                } catch (uploadError) {
                    setErrors({
                        attachment: "Failed to upload file. Please try again.",
                    });
                    setIsSaving(false);
                    return;
                }
            }

            // Ensure only one is sent as non-null
            const cleanFormData = {
                ...formData,
                credit_amount: formData.credit_amount
                    ? isEdit && account
                        ? formData._calculated_credit_amount
                        : parseFloat(formData.credit_amount)
                    : null,
                debit_amount: formData.debit_amount
                    ? parseFloat(formData.debit_amount)
                    : null,
                attachment: attachmentPath,
            };

            if (cleanFormData.debit_amount) cleanFormData.credit_amount = null;

            if (isEdit && account) {
                // Simplified Edit: Just update the account and its associated chart of account
                const updatedAccountData = {
                    ...cleanFormData,
                    id: account.id,
                    account_code_id: formData.account_code_id,
                };

                // Also update the associated chart of accounts record for consistency
                await axios.put(
                    `/api/v1/chart-of-accounts/${account.chart_of_account_id}`,
                    {
                        account_name: formData.name,
                        description: formData.description,
                        account_code_id: formData.account_code_id.toString(),
                    }
                );

                onSave(updatedAccountData);
            } else {
                // Add New Account
                const selectedTypeId = parseInt(formData.account_code_id, 10);
                const selectedType = accountTypes.find(
                    (type) => type.id === selectedTypeId
                );

                if (!selectedType) {
                    setErrors({
                        account_code_id: "Please select a valid account type",
                    });
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
                        account_number: formData.account_number,
                        description: formData.description,
                        chart_of_account_id:
                            chartOfAccountResponse.data.data.id.toString(),
                        account_code_id: selectedTypeId.toString(),
                        cost_center_id: formData.cost_center_id.toString(),
                        department_id: null,
                        status: formData.status,
                        credit_amount: cleanFormData.credit_amount,
                        debit_amount: cleanFormData.debit_amount,
                        invoice_number: formData.invoice_number,
                        attachment: cleanFormData.attachment,
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
            setErrors(
                error.response?.data?.errors || { submit: "An error occurred" }
            );
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
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        <InputFloating
                            label="Account Code"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            error={errors.account_number}
                        />
                        <SelectFloating
                            label="Cost Center"
                            name="cost_center_id"
                            value={formData.cost_center_id}
                            onChange={handleChange}
                            options={
                                isLoading
                                    ? [{ id: "", label: "Loading..." }]
                                    : costCenterOptions
                            }
                            disabled={isLoading}
                            error={errors.cost_center_id}
                        />
                        <SelectFloating
                            label="Type"
                            name="account_code_id"
                            value={formData.account_code_id}
                            onChange={handleChange}
                            options={
                                isLoading
                                    ? [{ id: "", label: "Loading..." }]
                                    : accountTypes
                            }
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
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            error={errors.description}
                        />
                        <InputFloating
                            label={
                                isEdit && account
                                    ? "Credit Amount Increase"
                                    : "Credit Amount"
                            }
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
                            disabled={isEdit && account}
                        />
                        <InputFloating
                            label="Invoice Number"
                            name="invoice_number"
                            value={formData.invoice_number}
                            onChange={handleChange}
                            error={errors.invoice_number}
                        />
                        {/* Attachment Section */}
                        <div className="flex justify-start">
                            <div className="space-y-2 w-full max-w-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                                    Attachment
                                </label>

                                {tempFile && (
                                    <div className="flex justify-center">
                                        <div
                                            className="text-sm text-orange-600 mb-2 truncate max-w-[220px] text-center"
                                            title={tempFile.name}
                                        >
                                            Selected: {tempFile.name}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center space-x-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="flex items-center px-4 py-2 bg-gray-100 text-blue-600 rounded-lg hover:bg-gray-200 transition duration-200"
                                    >
                                        <FontAwesomeIcon
                                            icon={faUpload}
                                            className="mr-2"
                                        />
                                        Choose File
                                    </button>
                                </div>
                                {errors.attachment && (
                                    <div className="text-red-500 text-sm text-center">
                                        {errors.attachment}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
