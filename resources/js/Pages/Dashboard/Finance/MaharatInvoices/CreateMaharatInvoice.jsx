import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";

export default function CreateMaharatInvoice() {
    const { invoiceId } = usePage().props;
    const [customers, setCustomers] = useState([]);
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
        cr_no: ''
    });

    useEffect(() => {
        setItemErrors(formData.items.map(() => ({})));
        setItemTouched(formData.items.map(() => ({})));
    }, []);

    useEffect(() => {
        fetchCustomers();
        fetchPaymentMethods();
        fetchCompanyDetails();
        
        if (invoiceId) {
            console.log('Edit mode - Invoice ID:', invoiceId);
            setIsEditMode(true);
            fetchInvoiceData();
        } else {
            console.log('Create mode - Fetching next invoice number');
            fetchNextInvoiceNumber();
        }
    }, [invoiceId]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get("/api/v1/customers");
            console.log(response.data.data);
            setCustomers(response.data.data);
        } catch (error) {
            console.error("Error fetching customers:", error);
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

    const fetchInvoiceData = async () => {
        try {
            const response = await axios.get(`/api/v1/invoices/${invoiceId}`);
            const invoice = response.data.data;
            
            if (!invoice) {
                console.error('No invoice data found');
                return;
            }

            console.log('Fetched invoice data:', invoice);

            setInvoiceNumber(invoice.invoice_number);

            setFormData(prevData => ({
                ...prevData,
                company_id: invoice.client_id || '',
                invoice_date: invoice.issue_date || '',
                payment_terms: invoice.payment_method || '',
                vat_rate: invoice.tax_rate?.toString() || "15",
                vat_amount: invoice.tax_amount?.toString() || "0.00",
                subtotal: invoice.subtotal?.toString() || "0.00",
                total: invoice.total_amount?.toString() || "0.00",
                discount: invoice.discount_amount?.toString() || "0",
                items: invoice.items?.map(item => ({
                    item_id: item.name || "",
                    description: item.description || "",
                    quantity: item.quantity?.toString() || "",
                    unit_price: item.unit_price?.toString() || "",
                    subtotal: item.subtotal?.toString() || "0.00"
                })) || [
                    {
                        item_id: "",
                        description: "",
                        quantity: "",
                        unit_price: "",
                        subtotal: "0.00"
                    }
                ]
            }));

            if (invoice.client_id) {
                const customerResponse = await axios.get(`/api/v1/customers/${invoice.client_id}`);
                const customer = customerResponse.data.data;
                if (customer) {
                    setFormData(prevData => ({
                        ...prevData,
                        representative: customer.account_name || "",
                        address: customer.city || "",
                        cr_no: customer.commercial_registration_number || "",
                        vat_no: customer.tax_number || "",
                        mobile: customer.contact_number || "",
                        email: customer.email || "",
                    }));
                }
            }

            setIsEditMode(true);
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

    const handleCompanyChange = (event) => {
        const selectedCompanyId = Number(event.target.value);
        const selectedCompany = customers.find(
            (c) => c.id === selectedCompanyId
        );

        if (selectedCompany) {
            setFormData({
                ...formData,
                company_id: selectedCompanyId,
                representative: selectedCompany.account_name || "",
                address: selectedCompany.city || "",
                cr_no: selectedCompany.commercial_registration_number || "",
                vat_no: selectedCompany.tax_number || "",
                mobile: selectedCompany.contact_number || "",
                email: selectedCompany.email || "",
            });
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

    const handleInputChange = (e, index = null) => {
        const { name, value } = e.target;

        if (index !== null) {
            const updatedItems = [...formData.items];
            if (!updatedItems[index]) return;

            updatedItems[index][name] = value;

            if (["quantity", "unit_price"].includes(name)) {
                const quantity = Number(updatedItems[index].quantity) || 0;
                const unitPrice = Number(updatedItems[index].unit_price) || 0;
                const subtotal = (quantity * unitPrice).toFixed(2);
                updatedItems[index].subtotal = subtotal;
            }

            setFormData((prev) => ({
                ...prev,
                items: updatedItems,
            }));

            updateSummary(updatedItems);

            if (itemErrors[index] && itemErrors[index][name]) {
                const newItemErrors = [...itemErrors];
                delete newItemErrors[index][name];
                setItemErrors(newItemErrors);
            }

            return;
        }

        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };

            if (name === "vat_rate" || name === "discount") {
                updateSummary(prev.items, value, name);
            }

            return updatedData;
        });

        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
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

        updateSummary(updatedItems);
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

        updateSummary(updatedItems);
    };

    const updateSummary = (
        updatedItems,
        newValue = null,
        changedField = null
    ) => {
        let subtotal = updatedItems.reduce(
            (sum, item) => sum + (parseFloat(item.subtotal) || 0),
            0
        );

        let vatRate =
            changedField === "vat_rate"
                ? parseFloat(newValue) || 0
                : parseFloat(formData.vat_rate) || 0;

        let vatAmount = (subtotal * vatRate) / 100;
        let totalBeforeDiscount = subtotal + vatAmount;

        let discount =
            changedField === "discount"
                ? parseFloat(newValue) || 0
                : parseFloat(formData.discount) || 0;

        let finalTotal = totalBeforeDiscount - discount;
        finalTotal = finalTotal > 0 ? finalTotal : 0;

        setFormData((prevState) => ({
            ...prevState,
            subtotal: subtotal.toFixed(2),
            vat_amount: vatAmount.toFixed(2),
            total: finalTotal.toFixed(2),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const payload = {
                invoice_number: invoiceNumber,
                client_id: formData.company_id,
                payment_method: formData.payment_terms,
                issue_date: formData.invoice_date,
                tax_amount: formData.vat_rate,
                subtotal: formData.subtotal,
                discount_amount: formData.discount,
                total_amount: formData.total,
                status: 'Draft'
            };

            let response;
            if (isEditMode) {
                response = await axios.put(`/api/v1/invoices/${invoiceId}`, payload);
            } else {
                response = await axios.post('/api/v1/invoices', payload);
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
                                    {customers && customers.length > 0 ? (
                                        customers.map((customer) => (
                                            <option
                                                key={customer.id}
                                                value={customer.id}
                                            >
                                                {customer.name}
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
                            <p className="w-full">{formData.representative}</p>
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
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="p-3 rounded-tl-2xl rounded-bl-2xl w-[5%]">
                                    SN
                                </th>
                                <th className="p-3 w-1/6">Item Name</th>
                                <th className="p-3 w-1/3">Description</th>
                                <th className="p-3 w-1/6">Qty</th>
                                <th className="p-3 w-1/6">Unit Price</th>
                                <th className="p-3 w-[10%]">Total</th>
                                <th className="p-3 text-center rounded-tr-2xl rounded-br-2xl w-[8%]">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">
                                        <div>
                                            <input
                                                type="text"
                                                id={`item_id_${index}`}
                                                name="item_id"
                                                value={item.item_id}
                                                onChange={(e) =>
                                                    handleInputChange(e, index)
                                                }
                                                onBlur={() =>
                                                    handleItemBlur(
                                                        index,
                                                        "item_id"
                                                    )
                                                }
                                                className={`block w-full rounded ${
                                                    itemTouched[index]
                                                        ?.item_id &&
                                                    itemErrors[index]?.item_id
                                                        ? "border-red-500"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="Item Name"
                                            />
                                            {itemTouched[index]?.item_id &&
                                                itemErrors[index]?.item_id && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {
                                                            itemErrors[index]
                                                                .item_id
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            id={`description_${index}`}
                                            name="description"
                                            value={item.description}
                                            onChange={(e) =>
                                                handleInputChange(e, index)
                                            }
                                            className="block w-full rounded border-gray-300"
                                            placeholder="Enter Description"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div>
                                            <input
                                                type="number"
                                                id={`quantity_${index}`}
                                                name="quantity"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleInputChange(e, index)
                                                }
                                                onBlur={() =>
                                                    handleItemBlur(
                                                        index,
                                                        "quantity"
                                                    )
                                                }
                                                min="0"
                                                step="1"
                                                className={`block w-full rounded ${
                                                    itemTouched[index]
                                                        ?.quantity &&
                                                    itemErrors[index]?.quantity
                                                        ? "border-red-500"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="Qty"
                                            />
                                            {itemTouched[index]?.quantity &&
                                                itemErrors[index]?.quantity && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {
                                                            itemErrors[index]
                                                                .quantity
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div>
                                            <input
                                                type="number"
                                                id={`unit_price_${index}`}
                                                name="unit_price"
                                                value={item.unit_price}
                                                onChange={(e) =>
                                                    handleInputChange(e, index)
                                                }
                                                onBlur={() =>
                                                    handleItemBlur(
                                                        index,
                                                        "unit_price"
                                                    )
                                                }
                                                min="0"
                                                step="0.01"
                                                className={`block w-full rounded ${
                                                    itemTouched[index]
                                                        ?.unit_price &&
                                                    itemErrors[index]
                                                        ?.unit_price
                                                        ? "border-red-500"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="Unit Price"
                                            />
                                            {itemTouched[index]?.unit_price &&
                                                itemErrors[index]
                                                    ?.unit_price && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {
                                                            itemErrors[index]
                                                                .unit_price
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            id={`subtotal_${index}`}
                                            name="subtotal"
                                            value={item.subtotal || "0.00"}
                                            className="block w-full rounded bg-gray-50 border-gray-300"
                                            readOnly
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center text-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeItemRow(index)
                                                }
                                                className={`p-1 text-red-500 hover:text-red-700 ${
                                                    index === 0 ||
                                                    formData.items.length <= 1
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                }`}
                                                title="Remove Item"
                                                disabled={
                                                    index === 0 ||
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
                            MAHARAT CONSTRUCTION TRAINING CENTER (MCTC)
                        </p>
                        <p>
                            <span className="font-semibold">Account No:</span>{" "}
                            242-089787-001
                        </p>
                        <p>
                            <span className="font-semibold">Currency:</span>{" "}
                            +966 SAR
                        </p>
                        <p>
                            <span className="font-semibold">License No:</span>{" "}
                            L-310522
                        </p>
                        <p>
                            <span className="font-semibold">IBAN Number:</span>{" "}
                            SA0345000000242089787001
                        </p>
                        <p>
                            <span className="font-semibold">Bank Name:</span>{" "}
                            Saudi National Bank (SNB)
                        </p>
                        <p>
                            <span className="font-semibold">Branch Name:</span>{" "}
                            Khobar Main Branch
                        </p>
                        <p>
                            <span className="font-semibold">
                                SABB Swift Code:
                            </span>{" "}
                            SABBSARI
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
