import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";

export default function CreateMaharatInvoice() {
    const { invoiceId } = usePage().props;
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        company_id: "",
        representative: "",
        address: "",
        cr_no: "",
        vat_no: "",
        email: "",
        mobile: "",
        invoice_date: "",
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
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [companyDetails, setCompanyDetails] = useState({
        name: '',
        address: '',
        contact_number: '',
        vat_no: '',
        cr_no: '',
        account_name: '',
        account_no: '',
        currency: '',
        license_no: '',
        iban: '',
        bank: '',
        branch: '',
        swift: ''
    });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        setItemErrors(formData.items.map(() => ({})));
        setItemTouched(formData.items.map(() => ({})));
    }, []);

    useEffect(() => {
        fetchCompanies();
        fetchPaymentMethods();
        fetchUsers();
        
        if (invoiceId) {
            console.log('Edit mode - Invoice ID:', invoiceId);
            setIsEditMode(true);
            fetchInvoiceData();
        } else {
            console.log('Create mode - Fetching next invoice number');
            fetchNextInvoiceNumber();
        }
    }, [invoiceId]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            console.log("Companies data:", response.data.data);
            setCompanies(response.data.data);
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const fetchNextInvoiceNumber = async () => {
        try {
            const response = await axios.get('/api/v1/invoices/next-number');
            if (response.data.success) {
                setInvoiceNumber(response.data.next_number);
            } else {
                console.error('Failed to get next invoice number:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching next invoice number:', error);
            setErrors(prev => ({
                ...prev,
                fetch: 'Failed to generate invoice number'
            }));
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await axios.get("/api/v1/invoices");
            const uniqueMethods = [...new Set(response.data.data
                .map(invoice => invoice.payment_method)
                .filter(method => method))];
            setPaymentMethods(uniqueMethods.length > 0 ? uniqueMethods : ['Cash', 'Credit']);
        } catch (error) {
            console.error("Error fetching payment methods:", error);
            setPaymentMethods(['Cash', 'Credit']);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get("/api/v1/users");
            setUsers(response.data.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchInvoiceData = async () => {
        try {
            const response = await axios.get(`/api/v1/invoices/${invoiceId}`);
            const invoice = response.data.data;
            console.log('Received invoice data:', invoice);

            // Format the date from the API response (YYYY-MM-DDTHH:mm:ss.SSSSSSZ)
            const formattedDate = invoice.issue_date ? invoice.issue_date.split('T')[0] : '';

            // Set invoice number
            setInvoiceNumber(invoice.invoice_number);

            // Set form data with invoice details
            setFormData(prevData => ({
                ...prevData,
                company_id: invoice.company_id || '',
                representative: invoice.representative_id || '',
                address: invoice.company?.address || '',
                cr_no: invoice.company?.cr_no || '',
                vat_no: invoice.company?.vat_no || '',
                email: invoice.company?.email || '',
                mobile: invoice.company?.contact_number || '',
                invoice_date: formattedDate,
                payment_terms: invoice.payment_method || '',
                vat_rate: invoice.vat_rate || '',
                vat_amount: invoice.tax_amount || '',
                subtotal: invoice.subtotal || '0.00',
                total: invoice.total_amount || '0.00',
                discount: invoice.discount_amount || '0',
                items: invoice.items?.length > 0 ? invoice.items.map(item => ({
                    id: item.id,
                    item_id: item.name,
                    description: item.description,
                    quantity: item.quantity.toString(),
                    unit_price: item.unit_price.toString(),
                    subtotal: item.subtotal.toString()
                })) : [{
                    item_id: "",
                    description: "",
                    quantity: "",
                    unit_price: "",
                    subtotal: ""
                }]
            }));

            // Set company details
            if (invoice.company) {
                setCompanyDetails({
                    name: invoice.company.name || '',
                    address: invoice.company.address || '',
                    contact_number: invoice.company.contact_number || '',
                    vat_no: invoice.company.vat_no || '',
                    cr_no: invoice.company.cr_no || '',
                    account_name: invoice.company.account_name || '',
                    account_no: invoice.company.account_no || '',
                    currency: invoice.company.currency?.name || '',
                    license_no: invoice.company.license_no || '',
                    iban: invoice.company.iban || '',
                    bank: invoice.company.bank || '',
                    branch: invoice.company.branch || '',
                    swift: invoice.company.swift || ''
                });
            }

        } catch (error) {
            console.error('Error fetching invoice data:', error);
            setErrors({ fetch: 'Failed to load invoice data' });
        }
    };

    const fetchCompanyDetails = async () => {
        try {
            const response = await axios.get("/api/v1/companies");
            const company = response.data.data?.find(comp => comp.id === 1);
            
            if (company) {
                setCompanyDetails({
                    name: company.name,
                    address: `${company.city}, ${company.country}`,
                    contact_number: company.contact_number,
                    vat_no: company.vat_no,
                    cr_no: company.cr_no
                });
            } else {
                console.log('Company with ID 1 not found');
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const fetchCompanyDetailsById = async (companyId) => {
        try {
            const response = await axios.get(`/api/v1/companies/${companyId}?include=currency`);
            const company = response.data.data;
            
            if (company) {
                setFormData(prevData => ({
                    ...prevData,
                    address: company.address || "",
                    cr_no: company.cr_no || "",
                    vat_no: company.vat_no || "",
                    mobile: company.contact_number || "",
                    email: company.email || "",
                }));

                setCompanyDetails({
                    name: company.name || '',
                    address: company.address || '',
                    contact_number: company.contact_number || '',
                    vat_no: company.vat_no || '',
                    cr_no: company.cr_no || '',
                    account_name: company.account_name || '',
                    account_no: company.account_no || '',
                    currency: company.currency?.name || '',
                    license_no: company.license_no || '',
                    iban: company.iban || '',
                    bank: company.bank || '',
                    branch: company.branch || '',
                    swift: company.swift || ''
                });
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const handleBlur = (field) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true,
        }));
        validateField(field);
    };

    const handleItemBlur = (index, field) => {
        const newItemTouched = [...itemTouched];
        if (!newItemTouched[index]) {
            newItemTouched[index] = {};
        }
        newItemTouched[index][field] = true;
        setItemTouched(newItemTouched);

        validateItemField(index, field);
    };

    const handleCompanyChange = async (companyId) => {
        try {
            const response = await axios.get(`/api/v1/companies/${companyId}?include=currency`);
            const company = response.data.data;
            
            if (company) {
                setFormData(prevData => ({
                    ...prevData,
                    company_id: company.id,
                    address: company.address || "",
                    cr_no: company.cr_no || "",
                    vat_no: company.vat_no || "",
                    mobile: company.contact_number || "",
                    email: company.email || "",
                }));

                setCompanyDetails({
                    name: company.name || '',
                    address: company.address || '',
                    contact_number: company.contact_number || '',
                    vat_no: company.vat_no || '',
                    cr_no: company.cr_no || '',
                    account_name: company.account_name || '',
                    account_no: company.account_no || '',
                    currency: company.currency?.name || '',
                    license_no: company.license_no || '',
                    iban: company.iban || '',
                    bank: company.bank || '',
                    branch: company.branch || '',
                    swift: company.swift || ''
                });
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const validateItemField = (index, field) => {
        if (index >= itemErrors.length) return;

        const newItemErrors = [...itemErrors];
        if (!newItemErrors[index]) {
            newItemErrors[index] = {};
        }

        const item = formData.items[index];

        switch (field) {
            case "item_id":
                if (!item.item_id) {
                    newItemErrors[index].item_id = "Item name is required";
                } else {
                    delete newItemErrors[index].item_id;
                }
                break;
            case "quantity":
                if (!item.quantity) {
                    newItemErrors[index].quantity = "Quantity is required";
                } else if (parseFloat(item.quantity) <= 0) {
                    newItemErrors[index].quantity =
                        "Quantity must be greater than 0";
                } else {
                    delete newItemErrors[index].quantity;
                }
                break;
            case "unit_price":
                if (!item.unit_price) {
                    newItemErrors[index].unit_price = "Unit price is required";
                } else if (parseFloat(item.unit_price) < 0) {
                    newItemErrors[index].unit_price =
                        "Unit price cannot be negative";
                } else {
                    delete newItemErrors[index].unit_price;
                }
                break;
            default:
                break;
        }

        setItemErrors(newItemErrors);
    };

    const validateField = (field) => {
        const newErrors = { ...errors };

        switch (field) {
            case "company_id":
                if (!formData.company_id) {
                    newErrors.company_id = "Company is required";
                } else {
                    delete newErrors.company_id;
                }
                break;
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

        if (!formData.company_id)
            validationErrors.company_id = "Company is required";

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
            company_id: true,
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));

        // Recalculate totals when VAT rate or discount changes
        if (name === 'vat_rate' || name === 'discount') {
            const subtotal = formData.items.reduce((sum, item) => {
                return sum + (parseFloat(item.subtotal) || 0);
            }, 0);

            const vatRate = name === 'vat_rate' ? (parseFloat(value) || 0) : (parseFloat(formData.vat_rate) || 0);
            const discount = name === 'discount' ? (parseFloat(value) || 0) : (parseFloat(formData.discount) || 0);

            const vatAmount = (subtotal * vatRate) / 100;
            const total = Math.max(subtotal + vatAmount - discount, 0);

            setFormData(prevData => ({
                ...prevData,
                [name]: value,
                vat_amount: vatAmount.toFixed(2),
                total: total.toFixed(2)
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
            console.log('Item subtotal:', itemSubtotal); // Debug log
            return sum + itemSubtotal;
        }, 0);
        
        console.log('Total subtotal:', subtotal); // Debug log

        // Get current VAT rate and discount
        const vatRate = parseFloat(formData.vat_rate) || 0;
        const discount = parseFloat(formData.discount) || 0;

        // Calculate VAT amount
        const vatAmount = (subtotal * vatRate) / 100;

        // Calculate final total
        const total = Math.max(subtotal + vatAmount - discount, 0);

        // Update form data with new calculations
        setFormData(prevData => ({
            ...prevData,
            subtotal: subtotal.toFixed(2),
            vat_amount: vatAmount.toFixed(2),
            total: total.toFixed(2)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const payload = {
                invoice_number: invoiceNumber,
                company_id: formData.company_id,
                representative_id: formData.representative,
                payment_method: formData.payment_terms,
                issue_date: formData.invoice_date,
                vat_rate: formData.vat_rate,
                vat_amount: formData.vat_amount,
                subtotal: formData.subtotal,
                discount_amount: formData.discount,
                total_amount: formData.total,
                status: 'Draft'
            };

            let response;
            if (isEditMode) {
                response = await axios.put(`/api/v1/invoices/${invoiceId}`, payload);
                await axios.put(`/api/v1/invoices/${invoiceId}/items`, {
                    items: formData.items.map(item => ({
                        id: item.id,
                        item_name: item.item_id,
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        subtotal: Number(item.subtotal)
                    }))
                });
            } else {
                response = await axios.post('/api/v1/invoices', payload);
                await axios.post(`/api/v1/invoices/${response.data.data.id}/items`, {
                    items: formData.items.map(item => ({
                        item_name: item.item_id,
                        description: item.description,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        subtotal: Number(item.subtotal)
                    }))
                });
                await axios.post('/api/v1/mahrat-invoice-approval-trans', {
                    invoice_id: response.data.data.id,
                    status: 'Pending',
                });
            }

            router.visit('/maharat-invoices');
        } catch (error) {
            setErrors(error.response?.data?.errors || {
                general: "An error occurred while saving the invoice"
            });
        }
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;

        // Calculate subtotal if quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
            const quantity = parseFloat(updatedItems[index].quantity) || 0;
            const unitPrice = parseFloat(updatedItems[index].unit_price) || 0;
            updatedItems[index].subtotal = (quantity * unitPrice).toFixed(2);
            console.log(`Row ${index + 1} subtotal:`, updatedItems[index].subtotal); // Debug log
        }

        setFormData(prevData => ({
            ...prevData,
            items: updatedItems
        }));

        // Recalculate all totals
        calculateTotals(updatedItems);
    };

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-lg p-6 max-w-7xl mx-auto">
            <div className="w-full flex justify-center">
                <img
                    src="/images/MCTC Logo.png"
                    alt="Maharat Logo"
                    className="w-48 h-20"
                />
            </div>
            <header className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-2">
                <div className="w-full flex flex-col justify-end text-center md:text-left md:items-start">
                    <h1 className="text-3xl font-bold uppercase mb-2 truncate">
                        {companyDetails.name}
                    </h1>
                    <p>
                        <span className="font-semibold">Address:</span>{" "}
                        {companyDetails.address}
                    </p>
                    <p>
                        <span className="font-semibold">Mobile:</span>{" "}
                        {companyDetails.contact_number}
                    </p>
                    <p>
                        <span className="font-semibold">VAT No:</span>{" "}
                        {companyDetails.vat_no}
                    </p>
                    <p>
                        <span className="font-semibold">CR No:</span>{" "}
                        {companyDetails.cr_no}
                    </p>
                </div>
            </header>

            <section className="mt-6">
                <div className="p-2 flex justify-center text-center bg-[#C7E7DE] rounded-2xl">
                    <h2 className="text-3xl font-bold">VAT Invoice</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">Invoice #:</strong>
                            <p className="w-full">{invoiceNumber}</p>
                        </div>
                        <div className="flex justify-start items-center gap-2">
                            <strong className="w-1/4">Invoice Date:</strong>
                            <div className="w-full">
                                <input
                                    type="date"
                                    id="invoice_date"
                                    name="invoice_date"
                                    value={formData.invoice_date}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur("invoice_date")}
                                    className={`mt-1 block w-full rounded ${
                                        touched.invoice_date &&
                                        errors.invoice_date
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                                {touched.invoice_date &&
                                    errors.invoice_date && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.invoice_date}
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-center gap-2">
                            <strong className="w-1/4">Payment:</strong>
                            <div className="w-full">
                                <select
                                    id="payment_terms"
                                    name="payment_terms"
                                    value={formData.payment_terms}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded border-gray-300"
                                >
                                    <option value="">Select payment terms</option>
                                    {paymentMethods.map((method) => (
                                        <option key={method} value={method}>
                                            {method}
                                    </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">VAT Rate (%):</strong>
                            <input
                                type="number"
                                id="vat_rate"
                                name="vat_rate"
                                value={formData.vat_rate}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                step="0.01"
                                className="mt-1 block w-full rounded border-gray-300"
                                placeholder="Enter VAT Rate"
                            />
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-center gap-2">
                            <strong className="w-1/4">Company:</strong>
                            <div className="w-full">
                                <select
                                    id="company_id"
                                    name="company_id"
                                    value={formData.company_id}
                                    onChange={handleCompanyChange}
                                    onBlur={() => handleBlur("company_id")}
                                    className={`block w-full rounded ${
                                        touched.company_id && errors.company_id
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <option value="">Select Company</option>
                                    {companies && companies.length > 0 ? (
                                        companies.map((company) => (
                                            <option
                                                key={company.id}
                                                value={company.id}
                                            >
                                                {company.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>
                                            Loading companies...
                                        </option>
                                    )}
                                </select>
                                {touched.company_id && errors.company_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.company_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">Representative:</strong>
                            <div className="w-full">
                                <select
                                    id="representative"
                                    name="representative"
                                    value={formData.representative}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded border-gray-300"
                                >
                                    <option value="">Select Representative</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">Address:</strong>
                            <p className="w-full">{formData.address}</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">CR No:</strong>
                            <p className="w-full">{formData.cr_no}</p>
                        </div>

                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">VAT No:</strong>
                            <p className="w-full">{formData.vat_no}</p>
                        </div>

                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">Contact No:</strong>
                            <p className="w-full">{formData.mobile}</p>
                        </div>

                        <div className="flex justify-start items-center gap-2 mt-4">
                            <strong className="w-1/4">Email:</strong>
                            <p className="w-full">{formData.email}</p>
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
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center w-[60px]">S/N</th>
                                <th className="py-3 px-4 text-center w-[180px]">Item Name</th>
                                <th className="py-3 px-4 text-center w-[220px]">Description</th>
                                <th className="py-3 px-4 text-center w-[100px]">Quantity</th>
                                <th className="py-3 px-4 text-center w-[120px]">Unit Price</th>
                                <th className="py-3 px-4 text-center w-[120px]">Total</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center w-[80px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-200">
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-4 text-center">{index + 1}</td>
                                    <td className="py-3 px-4">
                                        <div className="min-w-[180px] max-w-[250px]">
                                            <textarea
                                                name="item_id"
                                                value={item.item_id}
                                                onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                                                className="w-full text-center bg-transparent border-none focus:ring-0 resize-none overflow-hidden"
                                                rows="1"
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="min-w-[220px] max-w-[300px]">
                                            <textarea
                                                name="description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                className="w-full text-center bg-transparent border-none focus:ring-0 resize-none overflow-hidden"
                                                rows="1"
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            min="0"
                                            className="w-full text-center bg-transparent border-none focus:ring-0"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="number"
                                            name="unit_price"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                            min="0"
                                            className="w-full text-center bg-transparent border-none focus:ring-0"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="text"
                                            value={item.subtotal}
                                            readOnly
                                            className="w-full text-center bg-transparent border-none focus:ring-0"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center h-full">
                                            <button
                                                type="button"
                                                onClick={() => removeItemRow(index)}
                                                className="text-red-600 hover:text-red-900"
                                                disabled={formData.items.length <= 1}
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

            <div className="flex justify-start mt-4">
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
                    <div className="w-full flex flex-col text-center md:text-left space-y-2">
                        <p>
                            <span className="font-semibold">Account Name:</span>{" "}
                            {companyDetails.account_name}
                        </p>
                        <p>
                            <span className="font-semibold">Account No:</span>{" "}
                            {companyDetails.account_no}
                        </p>
                        <p>
                            <span className="font-semibold">Currency:</span>{" "}
                            {companyDetails.currency}
                        </p>
                        <p>
                            <span className="font-semibold">License No:</span>{" "}
                            {companyDetails.license_no}
                        </p>
                        <p>
                            <span className="font-semibold">IBAN Number:</span>{" "}
                            {companyDetails.iban}
                        </p>
                        <p>
                            <span className="font-semibold">Bank Name:</span>{" "}
                            {companyDetails.bank}
                        </p>
                        <p>
                            <span className="font-semibold">Branch Name:</span>{" "}
                            {companyDetails.branch}
                        </p>
                        <p>
                            <span className="font-semibold">SABB Swift Code:</span>{" "}
                            {companyDetails.swift}
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-5/12">
                    <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex justify-between items-center gap-2 mb-4">
                            <strong className="w-1/4">Subtotal:</strong>
                            <p className="font-medium">
                                {parseFloat(formData.subtotal).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{" "}
                                SAR
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-center gap-2">
                            <strong className="w-full md:w-1/3">
                                Discount:
                            </strong>
                            <div className="w-full">
                                <input
                                    type="number"
                                    id="discount"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="mt-1 block w-full rounded border-gray-300"
                                    placeholder="Enter Discount"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center gap-2 mt-4">
                            <strong className="w-1/4">VAT Amount:</strong>
                            <p className="font-medium">
                                {parseFloat(formData.vat_amount).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{" "}
                                SAR
                            </p>
                        </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded mt-4">
                        <div className="flex justify-between items-center gap-2 font-medium text-2xl text-red-500">
                            <strong>Net Amount:</strong>
                            <p>
                                {parseFloat(formData.total).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}{" "}
                                SAR
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="my-8 flex flex-col md:flex-row justify-center md:justify-end w-full gap-4">
                <button
                    onClick={handleSubmit}
                    className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto"
                >
                    {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                </button>
            </div>
        </div>
    );
}
