import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

export default function CreateMaharatInvoice() {
    const { invoiceId } = usePage().props;
    const { user } = usePage().props.auth;
    const user_detail = user;
    const user_id = user.id;
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        client_id: "",
        representative: "",
        address: "",
        cr_no: "",
        vat_no: "",
        email: "",
        mobile: "",
        invoice_date: new Date().toISOString().split("T")[0],
        payment_terms: "",
        vat_rate: "",
        vat_amount: "",
        subtotal: "0.00",
        total: "0.00",
        discount: "0",
        items: [
            {
                item_id: "",
                description: "",
                quantity: "",
                unit_price: "",
                subtotal: "",
            },
        ],
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [itemErrors, setItemErrors] = useState([]);
    const [itemTouched, setItemTouched] = useState([]);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [paymentMethods] = useState([
        "Cash",
        "Credit upto 30 days",
        "Credit upto 60 days",
        "Credit upto 90 days",
        "Credit upto 120 days",
    ]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [companyDetails, setCompanyDetails] = useState({
        name: "",
        address: "",
        contact_number: "",
        vat_no: "",
        cr_no: "",
        account_name: "",
        account_no: "",
        currency: "",
        license_no: "",
        iban: "",
        bank: "",
        branch: "",
        swift: "",
    });
    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [headerCompanyDetails, setHeaderCompanyDetails] = useState({
        name: "",
        address: "",
        contact_number: "",
        vat_no: "",
        cr_no: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fiscalPeriods, setFiscalPeriods] = useState([]);
    const [selectedFiscalPeriod, setSelectedFiscalPeriod] = useState(null);
    const [budgetValidation, setBudgetValidation] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState("");

    useEffect(() => {
        setItemErrors(formData.items.map(() => ({})));
        setItemTouched(formData.items.map(() => ({})));
    }, []);

    useEffect(() => {
        fetchHeaderCompanyDetails();
        fetchCompanies();
        fetchUsers();
        fetchClients();

        if (invoiceId) {
            setIsEditMode(true);
            fetchInvoiceData();
        } else {
            fetchNextInvoiceNumber();
        }
    }, [invoiceId]);

    // Check fiscal periods when invoice date changes
    useEffect(() => {
        if (formData.invoice_date) {
            checkFiscalPeriods(formData.invoice_date);
        }
    }, [formData.invoice_date]);

    const checkFiscalPeriods = async (invoiceDate) => {
        try {
            const response = await axios.get('/api/v1/invoices/applicable-fiscal-periods', {
                params: { date: invoiceDate }
            });
            
            if (response.data.success) {
                const periods = response.data.data;
                setFiscalPeriods(periods);
                
                if (periods.length === 0) {
                    // Don't show error immediately, just set the state
                    setErrors(prev => ({
                        ...prev,
                        fiscal_period: 'Invoice date is not within any fiscal period range'
                    }));
                } else if (periods.length === 1) {
                    setSelectedFiscalPeriod(periods[0]);
                    await validateBudget(periods[0].id);
                } else {
                    // Multiple periods overlap - user needs to select
                    setErrors(prev => ({
                        ...prev,
                        fiscal_period: 'Multiple fiscal periods overlap for this invoice date. Please select one.'
                    }));
                }
            }
        } catch (error) {
            console.error('Error checking fiscal periods:', error);
            setErrors(prev => ({
                ...prev,
                fiscal_period: 'Failed to check fiscal periods'
            }));
        }
    };

    const validateBudget = async (fiscalPeriodId) => {
        try {
            const response = await axios.post('/api/v1/invoices/validate-budget', {
                department_id: 1, // Default department
                cost_center_id: 1, // Default cost center
                sub_cost_center_id: 1, // Default sub cost center
                fiscal_period_id: fiscalPeriodId,
                amount: 0 // For invoices, we don't need to reserve budget, just check if budget exists
            });
            
            setBudgetValidation(response.data);
            
            if (!response.data.success) {
                setErrors(prev => ({
                    ...prev,
                    budget: response.data.data.message
                }));
            } else {
                // Clear budget error if validation passes
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.budget;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Error validating budget:', error);
            setErrors(prev => ({
                ...prev,
                budget: 'Failed to validate budget'
            }));
        }
    };

    const showError = (message) => {
        setErrorModalMessage(message);
        setShowErrorModal(true);
    };

    const fetchHeaderCompanyDetails = async () => {
        try {
            const response = await axios.get(
                "/api/v1/companies/1?include=currency"
            );
            const company = response.data.data;

            if (company) {
                setHeaderCompanyDetails({
                    name: company.name || "",
                    address: company.address || "",
                    contact_number: company.contact_number || "",
                    vat_no: company.vat_no || "",
                    cr_no: company.cr_no || "",
                });

                setCompanyDetails({
                    name: company.name || "",
                    address: company.address || "",
                    contact_number: company.contact_number || "",
                    vat_no: company.vat_no || "",
                    cr_no: company.cr_no || "",
                    account_name: company.account_name || "",
                    account_no: company.account_no || "",
                    currency: company.currency?.name || "SAR",
                    currency_code: company.currency?.code || "SAR",
                    license_no: company.license_no || "",
                    iban: company.iban || "",
                    bank: company.bank || "",
                    branch: company.branch || "",
                    swift: company.swift || "",
                });
            }
        } catch (error) {
            console.error("Error fetching company details:", error);
            setErrors((prev) => ({
                ...prev,
                company: "Failed to load company details",
            }));
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            setCompanies(response.data.data);
        } catch (error) {
            console.error("Error fetching companies:", error);
            setErrors((prev) => ({
                ...prev,
                companies: "Failed to load companies",
            }));
        }
    };

    const fetchNextInvoiceNumber = async () => {
        try {
            // The proper endpoint from routes/api.php is /api/v1/next-invoice-number
            let retries = 3;
            let success = false;
            let error = null;

            while (retries > 0 && !success) {
                try {
                    const response = await axios.get(
                        "/api/v1/next-invoice-number",
                        {
                            timeout: 5000,
                        }
                    );

                    if (response.data && response.data.success) {
                        setInvoiceNumber(response.data.next_number);
                        success = true;
                        break;
                    } else {
                        retries--;
                    }
                } catch (err) {
                    error = err;
                    retries--;
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            if (!success) {
                if (error?.response?.data?.message) {
                    console.error(
                        "Server error message:",
                        error.response.data.message
                    );
                }
                generateFallbackInvoiceNumber();
            }
        } catch (error) {
            console.error("Error in invoice number generation:", error);
            generateFallbackInvoiceNumber();
        }
    };

    // Fallback function to generate an invoice number when the API fails
    const generateFallbackInvoiceNumber = async () => {
        try {
            // Attempt to determine the next invoice number based on existing invoices
            const response = await axios.get("/api/v1/invoices");

            if (
                response.data &&
                response.data.data &&
                response.data.data.length > 0
            ) {
                // Find the pattern INV-XXXXX that matches the backend format
                const invoiceNumbers = response.data.data
                    .map((invoice) => {
                        // Extract the numeric part, matching the backend format exactly
                        const match =
                            invoice.invoice_number?.match(/INV-(\d+)/);
                        return match ? parseInt(match[1], 10) : 0;
                    })
                    .filter((num) => !isNaN(num));

                if (invoiceNumbers.length > 0) {
                    // Get the highest number and add 1
                    const highestNumber = Math.max(0, ...invoiceNumbers);
                    const nextNumber = `INV-${String(
                        highestNumber + 1
                    ).padStart(5, "0")}`;
                    setInvoiceNumber(nextNumber);
                    return;
                }
            }

            // If we couldn't extract any numbers, use the default
            generateDefaultInvoiceNumber();
        } catch (error) {
            console.error("Fallback invoice number generation failed:", error);
            generateDefaultInvoiceNumber();
        }
    };

    // Final fallback with default pattern if all else fails
    const generateDefaultInvoiceNumber = () => {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const defaultNumber = `INV-${randomNum.toString().padStart(5, "0")}`;
        setInvoiceNumber(defaultNumber);

        setErrors((prev) => ({
            ...prev,
            fetch: "Generated a temporary invoice number due to server error",
        }));
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get("/api/v1/users");
            setUsers(response.data.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            setErrors((prev) => ({
                ...prev,
                users: "Failed to load users",
            }));
        }
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get("/api/v1/customers");
            setClients(response.data.data);
        } catch (error) {
            console.error("Error fetching clients:", error);
            setErrors((prev) => ({
                ...prev,
                clients: "Failed to load clients",
            }));
        }
    };

    const fetchInvoiceData = async () => {
        try {
            const response = await axios.get(`/api/v1/invoices/${invoiceId}`);
            const invoice = response.data.data;

            const formattedDate = invoice.issue_date
                ? invoice.issue_date.split("T")[0]
                : "";

            // Set invoice number
            setInvoiceNumber(invoice.invoice_number);

            // First, get client details if client_id exists
            let clientDetails = {};
            if (invoice.client_id) {
                try {
                    const clientResponse = await axios.get(
                        `/api/v1/customers/${invoice.client_id}`
                    );
                    clientDetails = clientResponse.data.data;
                } catch (error) {
                    console.error("Error fetching client details:", error);
                    setErrors((prev) => ({
                        ...prev,
                        clientDetails: "Failed to load client details",
                    }));
                }
            }
            let itemDetails;
            if (invoice.id) {
                try {
                    const itemResponse = await axios.get(`/api/v1/invoices/${invoice.id}/items`);
                    itemDetails = itemResponse.data.data
                } catch (error) {
                    console.error("Error fetching item details:", error);
                }
            }

            // Set form data with invoice details and client details
            setFormData((prevData) => ({
                ...prevData,
                client_id: invoice.client_id || "",
                representative: invoice.representative_id || "",
                // Use client details instead of company details
                address: clientDetails.address || "",
                cr_no: clientDetails.cr_no || "",
                vat_no: clientDetails.vat_number || "", // Note: using vat_number from customer
                email: clientDetails.email || "",
                mobile: clientDetails.contact_number || "",
                invoice_date: formattedDate,
                payment_terms: invoice.payment_method || "",
                vat_rate: invoice.vat_rate || "",
                vat_amount: invoice.tax_amount || "",
                subtotal: invoice.subtotal || "0.00",
                total: invoice.total_amount || "0.00",
                discount: invoice.discount_amount || "0",
                items:
                    itemDetails?.length > 0
                        ? itemDetails.map((item) => ({
                              id: item.id,
                              item_id: item.name,
                              description: item.description,
                              quantity: item.quantity.toString(),
                              unit_price: item.unit_price.toString(),
                              subtotal: item.subtotal.toString(),
                          }))
                        : [
                              {
                                  item_id: "",
                                  description: "",
                                  quantity: "",
                                  unit_price: "",
                                  subtotal: "",
                              },
                          ],
            }));

            // Set company details for the bottom section (this remains unchanged)
            if (invoice.company) {
                const companyResponse = await axios.get(
                    `/api/v1/companies/1?include=currency`
                );
                const companyData = companyResponse.data.data;

                setCompanyDetails({
                    name: companyData.name || "",
                    address: companyData.address || "",
                    contact_number: companyData.contact_number || "",
                    vat_no: companyData.vat_no || "",
                    cr_no: companyData.cr_no || "",
                    account_name: companyData.account_name || "",
                    account_no: companyData.account_no || "",
                    currency: companyData.currency?.name || "",
                    currency_code: companyData.currency?.code || "SAR",
                    license_no: companyData.license_no || "",
                    iban: companyData.iban || "",
                    bank: companyData.bank || "",
                    branch: companyData.branch || "",
                    swift: companyData.swift || "",
                });
            }
        } catch (error) {
            setErrors({ fetch: "Failed to load invoice data" });
        }
    };

    const handleBlur = (field) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true,
        }));
        validateField(field);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        // Recalculate totals when VAT rate or discount changes
        if (name === "vat_rate" || name === "discount") {
            const subtotal = formData.items.reduce((sum, item) => {
                return sum + (parseFloat(item.subtotal) || 0);
            }, 0);

            const vatRate =
                name === "vat_rate"
                    ? parseFloat(value) || 0
                    : parseFloat(formData.vat_rate) || 0;
            const discount =
                name === "discount"
                    ? parseFloat(value) || 0
                    : parseFloat(formData.discount) || 0;

            // Apply discount to subtotal first
            const discountedSubtotal = Math.max(subtotal - discount, 0);

            // Calculate VAT amount based on the discounted subtotal
            const vatAmount = (discountedSubtotal * vatRate) / 100;

            // Calculate final total = discounted subtotal + VAT
            const total = discountedSubtotal + vatAmount;

            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
                vat_amount: vatAmount.toFixed(2),
                total: total.toFixed(2),
            }));
        }
    };

    const addItemRow = () => {
        const updatedItems = [
            ...formData.items,
            {
                item_id: "",
                description: "",
                quantity: "",
                unit_price: "",
                subtotal: "",
            },
        ];

        setFormData((prev) => ({
            ...prev,
            items: updatedItems,
        }));

        setItemErrors((prev) => [...prev, {}]);
        setItemTouched((prev) => [...prev, {}]);

        // Recalculate totals with new empty row
        calculateTotals(updatedItems);
    };

    const removeItemRow = (index) => {
        if (index === 0 || formData.items.length <= 1) return;

        const updatedItems = formData.items.filter((_, i) => i !== index);
        const updatedItemErrors = itemErrors.filter((_, i) => i !== index);
        const updatedItemTouched = itemTouched.filter((_, i) => i !== index);

        setFormData((prev) => ({
            ...prev,
            items: updatedItems,
        }));

        setItemErrors(updatedItemErrors);
        setItemTouched(updatedItemTouched);

        // Recalculate totals after removing row
        calculateTotals(updatedItems);
    };

    const calculateTotals = (items) => {
        // Calculate subtotal by summing up all item subtotals
        const subtotal = items.reduce((sum, item) => {
            const itemSubtotal = parseFloat(item.subtotal) || 0;
            return sum + itemSubtotal;
        }, 0);

        // Get current VAT rate and discount from form data
        const vatRate = parseFloat(formData.vat_rate) || 0;
        const discount = parseFloat(formData.discount) || 0;

        // Apply discount to subtotal first
        const discountedSubtotal = Math.max(subtotal - discount, 0);

        // Calculate VAT amount based on the discounted subtotal
        const vatAmount = (discountedSubtotal * vatRate) / 100;

        // Calculate final total (Net Amount) = discounted subtotal + VAT
        const total = discountedSubtotal + vatAmount;

        // Update form data with new calculations
        setFormData((prevData) => ({
            ...prevData,
            subtotal: subtotal.toFixed(2),
            vat_amount: vatAmount.toFixed(2),
            total: total.toFixed(2),
        }));
    };

    const validateField = (field) => {
        const newErrors = { ...errors };

        switch (field) {
            case "invoice_date":
                if (!formData.invoice_date) {
                    newErrors.invoice_date = "Invoice date is required";
                } else {
                    delete newErrors.invoice_date;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const validationErrors = {};
        let isValid = true;

        if (!formData.invoice_date)
            validationErrors.invoice_date = "Invoice date is required";

        const newItemErrors = formData.items.map((item, index) => {
            const itemValidationErrors = {};

            if (!item.item_id) {
                itemValidationErrors.item_id = "Item name is required";
                isValid = false;
            }

            if (!item.quantity) {
                itemValidationErrors.quantity = "Quantity is required";
                isValid = false;
            } else if (parseFloat(item.quantity) <= 0) {
                itemValidationErrors.quantity =
                    "Quantity must be greater than 0";
                isValid = false;
            }

            if (!item.unit_price) {
                itemValidationErrors.unit_price = "Unit price is required";
                isValid = false;
            } else if (parseFloat(item.unit_price) < 0) {
                itemValidationErrors.unit_price =
                    "Unit price cannot be negative";
                isValid = false;
            }

            return itemValidationErrors;
        });

        setErrors(validationErrors);
        setItemErrors(newItemErrors);

        setTouched({
            invoice_date: true,
        });

        const allItemsTouched = formData.items.map(() => ({
            item_id: true,
            quantity: true,
            unit_price: true,
        }));
        setItemTouched(allItemsTouched);

        return isValid && Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Check for fiscal period errors first
            if (errors.fiscal_period) {
                showError(errors.fiscal_period);
                setIsSubmitting(false);
                return;
            }

            // Check for budget errors
            if (errors.budget) {
                showError(errors.budget);
                setIsSubmitting(false);
                return;
            }

            // Check if fiscal period is selected (for overlapping periods)
            if (fiscalPeriods.length > 1 && !selectedFiscalPeriod) {
                const errorMsg = "Please select a fiscal period from the overlapping options";
                setErrors({
                    submit: errorMsg,
                });
                showError(errorMsg);
                setIsSubmitting(false);
                return;
            }

            // Check budget validation
            if (budgetValidation && !budgetValidation.success) {
                const errorMsg = budgetValidation.data.message;
                setErrors({
                    submit: errorMsg,
                });
                showError(errorMsg);
                setIsSubmitting(false);
                return;
            }

            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Maharat Invoice Approval"
            );
            const process = processResponse.data?.data?.[0];
            const processSteps = process?.steps || [];

            // Check if process and steps exist
            if (!process || processSteps.length === 0) {
                const errorMsg = "No Process or steps found for Maharat Invoice Approval";
                setErrors({
                    submit: errorMsg,
                });
                showError(errorMsg);
                setIsSubmitting(false);
                return;
            }
            const processStep = processSteps[0];

            const processResponseViaUser = await axios.get(
                `/api/v1/process-steps/${processStep.id}/user/${user_id}`
            );
            const assignUser = processResponseViaUser?.data?.data;
            if (!assignUser) {
                const errorMsg = "No assignee found for this process step and user";
                setErrors({
                    submit: errorMsg,
                });
                showError(errorMsg);
                setIsSubmitting(false);
                return;
            }

            const formattedItems = formData.items.map((item) => {
                const itemSubtotal = Number(item.subtotal);
                const discount = Number(formData.discount) || 0;
                const vatRate = Number(formData.vat_rate) || 0;
                
                // Apply discount to subtotal first (distribute discount across items)
                const discountedSubtotal = Math.max(itemSubtotal - (discount / formData.items.length), 0);
                
                // Calculate VAT on discounted subtotal
                const itemTaxAmount = (discountedSubtotal * vatRate) / 100;
                const itemTotal = discountedSubtotal + itemTaxAmount;

                return {
                    name: item.item_id,
                    description: item.description,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    subtotal: discountedSubtotal,
                    tax_rate: formData.vat_rate.toString(), // Use string to preserve precision
                    tax_amount: itemTaxAmount,
                    total: itemTotal,
                };
            });

            const invoicePayload = {
                invoice_number: invoiceNumber,
                issue_date: formData.invoice_date,
                payment_method: formData.payment_terms,
                vat_rate: formData.vat_rate.toString(),
                client_id: formData.client_id,
                representative_id: formData.representative || null,
                subtotal: (parseFloat(formData.subtotal) - parseFloat(formData.discount || 0)).toFixed(2),
                discount_amount: formData.discount,
                tax_amount: formData.vat_amount,
                total_amount: formData.total,
                status: "Draft",
                currency: "SAR",
                account_code_id: 4,
                fiscal_period_id: selectedFiscalPeriod?.id,
                items: formattedItems,
            };

            let response;
            let newInvoiceId;

            if (isEditMode) {
                response = await axios.put(
                    `/api/v1/invoices/${invoiceId}`,
                    invoicePayload
                );
                newInvoiceId = invoiceId;
            } else {
                const invoiceDataOnly = { ...invoicePayload };
                delete invoiceDataOnly.items;

                response = await axios.post(
                    "/api/v1/invoices",
                    invoiceDataOnly
                );
                newInvoiceId = response.data?.data?.id;

                if (newInvoiceId && formattedItems.length > 0) {
                    // Now save the invoice items
                    await saveInvoiceItems(newInvoiceId, formattedItems);
                }
            }

            // Create transaction record
            const transactionPayload = {
                invoice_id: newInvoiceId,
                requester_id: user_id,
                assigned_to: assignUser?.approver_id,
                order: String(processStep.order),
                description: processStep.description,
                status: "Pending",
            };

            await axios.post(
                "/api/v1/mahrat-invoice-approval-trans",
                transactionPayload
            );

            // Create task
            const taskPayload = {
                process_step_id: processStep.id,
                process_id: processStep.process_id,
                assigned_at: new Date().toISOString(),
                urgency: "Normal",
                assigned_to_user_id: assignUser?.approver_id,
                assigned_from_user_id: user_id,
                read_status: null,
                invoice_id: newInvoiceId,
            };

            await axios.post("/api/v1/tasks", taskPayload);

            // Navigate to invoices page regardless of approval process success
            router.visit("/maharat-invoices");
        } catch (error) {
            console.error("Invoice creation error:", error.response?.data);
            
            let errorMessage = "Failed to save invoice";
            
            // Check for nested error structure
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                // Handle validation errors
                const firstError = Object.values(error.response.data.errors)[0];
                if (Array.isArray(firstError)) {
                    errorMessage = firstError[0];
                } else {
                    errorMessage = firstError;
                }
            }
            
            // Show error in modal
            showError(errorMessage);
            
            setErrors({
                submit: errorMessage,
                ...error.response?.data?.errors,
            });
            setIsSubmitting(false);
        }
    };

    // Helper function to save invoice items separately
    const saveInvoiceItems = async (invoiceId, items) => {
        if (!invoiceId || !items || items.length === 0) {
            console.warn("No invoice ID or items to save");
            return;
        }

        try {
            const formattedItems = items.map((item) => {
                // Calculate tax amount based on subtotal and vat rate
                const vatRate = parseFloat(item.tax_rate || formData.vat_rate);
                const itemSubtotal = parseFloat(item.subtotal);
                const discount = parseFloat(formData.discount) || 0;
                
                // Apply discount to subtotal first
                const discountedSubtotal = Math.max(itemSubtotal - (discount / items.length), 0);
                
                // Calculate VAT on discounted subtotal
                const vatAmount = discountedSubtotal * (vatRate / 100);
                const total = discountedSubtotal + vatAmount;

                return {
                    item_name: item.name, // For validation
                    name: item.name, // Actual database field
                    description: item.description || "",
                    quantity: parseFloat(item.quantity),
                    unit_price: parseFloat(item.unit_price),
                    subtotal: discountedSubtotal, // Use discounted subtotal
                    tax_rate: formData.vat_rate.toString(), // Use string to preserve precision
                    tax_amount: vatAmount,
                    total: total,
                    discount: discount / items.length, // Distribute discount across items
                };
            });
            const response = await axios.post(
                `/api/v1/invoices/${invoiceId}/items`,
                {
                    items: formattedItems,
                }
            );
            return response.data;
        } catch (error) {
            console.error(
                "Error saving invoice items:",
                error.response?.data || error
            );
            throw error; // Re-throw to be handled by the caller
        }
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;

        // Calculate subtotal if quantity or unit_price changes
        if (field === "quantity" || field === "unit_price") {
            const quantity = parseFloat(updatedItems[index].quantity) || 0;
            const unitPrice = parseFloat(updatedItems[index].unit_price) || 0;
            updatedItems[index].subtotal = (quantity * unitPrice).toFixed(2);
        }

        setFormData((prevData) => ({
            ...prevData,
            items: updatedItems,
        }));

        // Recalculate all totals
        calculateTotals(updatedItems);
    };

    const handleClientChange = async (e) => {
        const clientId = e.target.value;

        setFormData((prevData) => ({
            ...prevData,
            client_id: clientId,
        }));

        if (!clientId) {
            // Clear client-related fields if no client is selected
            setFormData((prevData) => ({
                ...prevData,
                address: "",
                cr_no: "",
                vat_no: "",
                mobile: "",
                email: "",
            }));
            return;
        }

        try {
            const response = await axios.get(`/api/v1/customers/${clientId}`);
            const client = response.data.data;

            setFormData((prevData) => ({
                ...prevData,
                address: client.address || "",
                cr_no: client.cr_no || "",
                vat_no: client.vat_number || "",
                mobile: client.contact_number || "",
                email: client.email || "",
            }));
        } catch (error) {
            console.error("Error fetching client details:", error);
            setErrors((prev) => ({
                ...prev,
                clientDetails: "Failed to load client details",
            }));
        }
    };

    // QR Code content
    function toTLV(tag, value) {
        const textEncoder = new TextEncoder();
        const valueBytes = textEncoder.encode(value);
        return new Uint8Array([tag, valueBytes.length, ...valueBytes]);
    }

    const tlvArray = [
        toTLV(1, companyDetails.name),
        toTLV(2, companyDetails.vat_no),
        toTLV(3, new Date().toISOString()),
        toTLV(4, parseFloat(formData.total).toFixed(2)),
        toTLV(5, parseFloat(formData.vat_amount).toFixed(2)),
    ];

    const qrCodeText = btoa(
        String.fromCharCode(
            ...new Uint8Array(
                tlvArray.reduce((acc, curr) => acc.concat(Array.from(curr)), [])
            )
        )
    );

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-lg p-6 max-w-7xl mx-auto">
            {/* Display general errors at the top of the form */}
            {(errors.general || errors.submit || errors.fetch || errors.fiscal_period || errors.budget) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errors.general && <p>{errors.general}</p>}
                    {errors.submit && <p>{errors.submit}</p>}
                    {errors.fetch && <p>{errors.fetch}</p>}
                    {errors.fiscal_period && <p>{errors.fiscal_period}</p>}
                    {errors.budget && <p>{errors.budget}</p>}
                </div>
            )}

            {/* Fiscal Period Selection */}
            {fiscalPeriods.length > 1 && (
                <div className="bg-[#009FDC] bg-opacity-10 border border-[#009FDC] text-[#009FDC] px-4 py-3 rounded relative mb-4">
                    <div className="mb-3">
                        <strong>Multiple fiscal periods overlap for this invoice date. Please select one:</strong>
                    </div>
                    <select
                        value={selectedFiscalPeriod?.id || ""}
                        onChange={(e) => {
                            const period = fiscalPeriods.find(p => p.id === parseInt(e.target.value));
                            setSelectedFiscalPeriod(period);
                            if (period) {
                                validateBudget(period.id);
                            }
                        }}
                        className="w-full p-2 border border-[#009FDC] rounded text-black"
                    >
                        <option value="">Select Fiscal Period</option>
                        {fiscalPeriods.map((period) => (
                            <option key={period.id} value={period.id}>
                                {period.period_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="w-full flex justify-center">
                <img
                    src="/images/MCTC Logo.png"
                    alt="Maharat Logo"
                    className="w-48 h-20"
                />
            </div>

            <header className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-2">
                <div className="w-full flex flex-col justify-end text-center md:text-left md:items-start">
                    <h1 className="text-3xl font-bold uppercase mb-2 truncate">
                        {headerCompanyDetails.name}
                    </h1>
                    <p>
                        <span className="font-semibold">Address:</span>{" "}
                        {headerCompanyDetails.address}
                    </p>
                    <p>
                        <span className="font-semibold">Mobile:</span>{" "}
                        {headerCompanyDetails.contact_number}
                    </p>
                    <p>
                        <span className="font-semibold">VAT No:</span>{" "}
                        {headerCompanyDetails.vat_no}
                    </p>
                    <p>
                        <span className="font-semibold">CR No:</span>{" "}
                        {headerCompanyDetails.cr_no}
                    </p>
                </div>
                {invoiceId && (
                    <div className="flex justify-end items-center">
                        <QRCodeCanvas value={qrCodeText} size={120} />
                    </div>
                )}
            </header>

            <section className="mt-6">
                <div className="p-2 flex justify-center text-center bg-[#C7E7DE] rounded-2xl">
                    <h2 className="text-3xl font-bold">VAT Invoice</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-start gap-8 mb-2">
                            <strong className="w-32">Invoice #:</strong>
                            <p className="w-full">{invoiceNumber}</p>
                        </div>
                        <div className="flex justify-start items-center gap-8">
                            <strong className="w-32">Invoice Date:</strong>
                            <div className="w-full">
                                <input
                                    type="date"
                                    id="invoice_date"
                                    name="invoice_date"
                                    value={formData.invoice_date}
                                    className="block w-full rounded-lg bg-gray-100 outline-none border-none focus:outline-none focus:border-none focus:ring-0"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-center gap-5">
                            <strong className="w-1/4">Payment:</strong>
                            <div className="w-full">
                                <select
                                    id="payment_terms"
                                    name="payment_terms"
                                    value={formData.payment_terms}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-lg border border-gray-300"
                                >
                                    <option value="">
                                        Select payment terms
                                    </option>
                                    {paymentMethods.map((method) => (
                                        <option key={method} value={method}>
                                            {method}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-start items-center gap-5 mt-2">
                            <strong className="w-1/4">VAT Rate (%):</strong>
                            <div className="w-full">
                                <input
                                    type="number"
                                    id="vat_rate"
                                    name="vat_rate"
                                    value={formData.vat_rate}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="block w-full rounded-lg border border-gray-300"
                                    placeholder="Enter VAT Rate"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-center gap-8">
                            <strong className="w-32">Customer:</strong>
                            <div className="w-full">
                                <select
                                    id="client_id"
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleClientChange}
                                    className="block w-full rounded-lg border border-gray-300"
                                >
                                    <option value="">Select Customer</option>
                                    {clients.map((client) => (
                                        <option
                                            key={client.id}
                                            value={client.id}
                                        >
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-start items-center gap-4 my-4">
                            <strong className="w-36">Representative:</strong>
                            <div className="w-full">
                                <select
                                    id="representative"
                                    name="representative"
                                    value={formData.representative}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-lg border border-gray-300"
                                >
                                    <option value="">
                                        Select Representative
                                    </option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-start items-start gap-6">
                            <strong className="w-32">Address:</strong>
                            <p className="w-full">{formData.address}</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 p-4 rounded-2xl">
                        <div className="flex flex-col space-y-6">
                            <div className="flex justify-start items-start gap-6">
                                <strong className="w-32">CR No:</strong>
                                <p className="w-full">{formData.cr_no}</p>
                            </div>

                            <div className="flex justify-start items-start gap-6">
                                <strong className="w-32">VAT No:</strong>
                                <p className="w-full">{formData.vat_no}</p>
                            </div>

                            <div className="flex justify-start items-start gap-6">
                                <strong className="w-32">Contact No:</strong>
                                <p className="w-full">{formData.mobile}</p>
                            </div>

                            <div className="flex justify-start items-start gap-6">
                                <strong className="w-32">Email:</strong>
                                <p className="w-full">{formData.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-8">
                <h3 className="text-2xl font-bold mb-2">Invoice Items</h3>
                <div className="w-full overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center w-[60px]">
                                    S/N
                                </th>
                                <th className="py-3 px-4 text-center w-[180px]">
                                    Item Name
                                </th>
                                <th className="py-3 px-4 text-center w-[220px]">
                                    Description
                                </th>
                                <th className="py-3 px-4 text-center w-[100px]">
                                    Quantity
                                </th>
                                <th className="py-3 px-4 text-center w-[120px]">
                                    Unit Price
                                </th>
                                <th className="py-3 px-4 text-center w-[120px]">
                                    Total
                                </th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center w-[80px]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-200">
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-4 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="w-full">
                                            <textarea
                                                name="item_id"
                                                value={item.item_id}
                                                onChange={(e) =>
                                                    handleItemChange(
                                                        index,
                                                        "item_id",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300"
                                                rows="1"
                                                onInput={(e) => {
                                                    e.target.style.height =
                                                        "auto";
                                                    e.target.style.height = `${Math.min(
                                                        e.target.scrollHeight,
                                                        150
                                                    )}px`;
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="w-full">
                                            <textarea
                                                name="description"
                                                value={item.description}
                                                onChange={(e) =>
                                                    handleItemChange(
                                                        index,
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300"
                                                rows="3"
                                                onInput={(e) => {
                                                    e.target.style.height =
                                                        "auto";
                                                    e.target.style.height = `${Math.min(
                                                        e.target.scrollHeight,
                                                        150
                                                    )}px`;
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            className="w-full rounded-lg border border-gray-300"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="number"
                                            name="unit_price"
                                            value={item.unit_price}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "unit_price",
                                                    e.target.value
                                                )
                                            }
                                            min="0"
                                            className="w-full rounded-lg border border-gray-300"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="text"
                                            value={parseFloat(
                                                item.subtotal || 0
                                            ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            readOnly
                                            className="w-full rounded-lg border border-gray-300"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center h-full">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeItemRow(index)
                                                }
                                                className="text-red-600 hover:text-red-900"
                                                disabled={
                                                    formData.items.length <= 1
                                                }
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center mt-4">
                <button
                    type="button"
                    onClick={addItemRow}
                    className="px-4 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-200"
                    title="Add Item"
                >
                    <FaPlus className="inline-block mr-2" /> Add Item
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4 w-full mt-6">
                <div className="bg-gray-100 p-4 rounded-2xl w-full md:w-1/2">
                    <div className="w-full flex flex-col text-center md:text-left space-y-4">
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                Account Name:
                            </span>
                            <span>{companyDetails.account_name}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                Account No:
                            </span>
                            <span>{companyDetails.account_no}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                Currency:
                            </span>
                            <span>{companyDetails.currency}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                License No:
                            </span>
                            <span>{companyDetails.license_no}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                IBAN Number:
                            </span>
                            <span>{companyDetails.iban}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                Bank Name:
                            </span>
                            <span>{companyDetails.bank}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                Branch Name:
                            </span>
                            <span>{companyDetails.branch}</span>
                        </div>
                        <div className="flex items-start gap-8">
                            <span className="font-semibold w-32">
                                Swift Code:
                            </span>
                            <span>{companyDetails.swift}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-5/12">
                    <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-between items-center gap-2 mb-4">
                            <strong className="w-1/4">Subtotal:</strong>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">
                                    {parseFloat(
                                        formData.subtotal
                                    ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                                <span className="font-medium">
                                    {companyDetails.currency_code || "SAR"}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                            <strong className="w-1/4">Discount:</strong>
                            <div className="flex items-center gap-2 justify-end -mt-1">
                                <input
                                    type="number"
                                    id="discount"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-gray-300"
                                    placeholder="Enter Discount"
                                />
                                <span className="font-medium">
                                    {companyDetails.currency_code || "SAR"}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center gap-2 mt-4">
                            <strong className="w-1/4">VAT Amount:</strong>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">
                                    {parseFloat(
                                        formData.vat_amount || 0
                                    ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                                <span className="font-medium">
                                    {companyDetails.currency_code || "SAR"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-2xl mt-4">
                        <div className="flex justify-between items-center gap-2 font-medium text-2xl text-red-500">
                            <strong>Net Amount:</strong>
                            <div className="flex items-center gap-2">
                                <p>
                                    {parseFloat(formData.total).toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}
                                </p>
                                <span>
                                    {companyDetails.currency_code || "SAR"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="m-2 flex justify-start items-center gap-4 font-medium text-lg">
                        <strong>Prepared By:</strong>
                        <p>{user_detail.name}</p>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className={`text-white text-lg font-medium px-6 py-3 rounded-full ${
                                isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-[#009FDC] hover:bg-[#007CB8]"
                            }`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? isEditMode
                                    ? "Updating..."
                                    : "Creating..."
                                : isEditMode
                                ? "Update Invoice"
                                : "Create Invoice"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-8 rounded-2xl w-[90%] max-w-md">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-2xl font-bold text-red-600">
                                Error
                            </h2>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="text-gray-500 hover:text-gray-800 text-xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-700 text-lg">
                                {errorModalMessage}
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-200"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
