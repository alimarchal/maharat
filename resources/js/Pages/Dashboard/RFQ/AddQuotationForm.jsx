import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { router, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { 
    DocumentTextIcon, 
    DocumentArrowDownIcon, 
    EnvelopeIcon,
    TrashIcon 
} from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { fetchRFQData, fetchLookupData, getSafeValue } from "./rfqUtils";

export default function AddQuotationForm({ auth }) {
    const { rfqId } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        organization_email: "",
        city: "",
        category_id: "",
        warehouse_id: "",
        issue_date: new Date().toISOString().split('T')[0],
        closing_date: "",
        rfq_id: "", 
        payment_type: "",
        contact_no: "",
        items: [{
            item_name: "",
            description: "",
            unit_id: "",
            quantity: "",
            brand_id: "",
            attachment: null,
            expected_delivery_date: "",
            rfq_id: null,
            status_id: 47
        }],
        status_id: 47,
    });

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [brands, setBrands] = useState([]);
    const [attachments, setAttachments] = useState({});
    const [unitNames, setUnitNames] = useState({});
    const [brandNames, setBrandNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch RFQ data if rfqId is provided (editing mode)
    useEffect(() => {
        if (rfqId) {
            fetchRFQData(rfqId, setFormData, setIsEditing, setLoading, setError);
        } else {
            // In create mode, get new RFQ number
            axios.get('/api/v1/rfqs/form-data')
                .then(response => {
                    if (response.data && response.data.rfq_number) {
                        setFormData(prev => ({
                            ...prev,
                            rfq_id: response.data.rfq_number,
                            issue_date: response.data.request_date || new Date().toISOString().split('T')[0]
                        }));
                    }
                })
                .catch(error => {
                    console.error("Error fetching new RFQ number:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [rfqId]);

    // Fetch lookup data (categories, warehouses, etc.)
    useEffect(() => {
        fetchLookupData(
            setLoading, 
            setError, 
            setUnits, 
            setBrands, 
            setCategories, 
            setWarehouses, 
            setPaymentTypes, 
            setUnitNames, 
            setBrandNames
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const formDataObj = new FormData();
    
            // Basic validation
            if (!formData.organization_email || !formData.city || !formData.category_id || 
                !formData.warehouse_id || !formData.issue_date || !formData.closing_date ||
                !formData.payment_type) {
                alert("Please fill out all required fields in the top section.");
                return;
            }
    
            // Main fields - add null/type checking
            formDataObj.append('organization_email', formData.organization_email || '');
            formDataObj.append('city', formData.city || '');
            
            // For numeric values, ensure we have valid numbers or send empty string
            const categoryId = formData.category_id ? parseInt(formData.category_id, 10) : '';
            const warehouseId = formData.warehouse_id ? parseInt(formData.warehouse_id, 10) : '';
            const paymentType = formData.payment_type ? parseInt(formData.payment_type, 10) : '';
            const statusId = formData.status_id ? parseInt(formData.status_id, 10) : 47;
            
            formDataObj.append('category_id', categoryId);
            formDataObj.append('warehouse_id', warehouseId);
            formDataObj.append('request_date', formData.issue_date || '');
            formDataObj.append('closing_date', formData.closing_date || '');
            
            // Only include rfq_number for editing existing RFQs
            if (rfqId) {
                formDataObj.append('rfq_number', formData.rfq_id || '');
            }
            
            formDataObj.append('payment_type', paymentType);
            formDataObj.append('contact_number', formData.contact_no || '');
            formDataObj.append('status_id', statusId);
            
            // Log what's being sent
            console.log("Sending main form fields:", {
                organization_email: formData.organization_email,
                city: formData.city,
                category_id: categoryId,
                warehouse_id: warehouseId,
                request_date: formData.issue_date,
                closing_date: formData.closing_date,
                rfq_number: rfqId ? formData.rfq_id : "Will be generated by backend",
                payment_type: paymentType,
                contact_number: formData.contact_no,
                status_id: statusId
            });
    
            // Filter and validate items
            const validItems = formData.items.filter(item => 
                item.item_name && item.unit_id && item.quantity && item.expected_delivery_date
            );
            
            if (validItems.length === 0) {
                alert("Please add at least one item with all required fields filled out.");
                return;
            }
            
            // Process each valid item
            validItems.forEach((item, index) => {
                // Add ID if it exists (for updating existing items)
                if (item.id) {
                    formDataObj.append(`items[${index}][id]`, item.id);
                }
                
                // Add main item fields
                formDataObj.append(`items[${index}][item_name]`, item.item_name || '');
                formDataObj.append(`items[${index}][description]`, item.description || '');
                formDataObj.append(`items[${index}][quantity]`, item.quantity || '');
                formDataObj.append(`items[${index}][expected_delivery_date]`, item.expected_delivery_date || '');
                
                // Add unit_id, brand_id, status_id - make sure they're integers
                if (item.unit_id) {
                    formDataObj.append(`items[${index}][unit_id]`, parseInt(item.unit_id, 10));
                }
                
                if (item.brand_id) {
                    formDataObj.append(`items[${index}][brand_id]`, parseInt(item.brand_id, 10));
                }
                
                // Default to status_id 47 if not set
                formDataObj.append(`items[${index}][status_id]`, item.status_id ? parseInt(item.status_id, 10) : 47);
                
                // For editing mode, add the rfq_id to each item
                if (rfqId) {
                    formDataObj.append(`items[${index}][rfq_id]`, rfqId);
                }
            });
            
            // Handle attachments (files)
            if (attachments && Object.keys(attachments).length > 0) {
                Object.keys(attachments).forEach(index => {
                    const itemIndex = validItems.findIndex((_, i) => i.toString() === index.toString());
                    if (itemIndex !== -1 && attachments[index]) {
                        formDataObj.append(`attachments[${itemIndex}]`, attachments[index]);
                        console.log(`Added attachment for item ${itemIndex}:`, attachments[index].name);
                    }
                });
            }
            
            // Use the appropriate URL and method based on whether creating or editing
            const url = rfqId ? `/api/v1/rfqs/${rfqId}` : '/api/v1/rfqs';
            const method = rfqId ? 'put' : 'post';
            
            console.log(`Making ${method.toUpperCase()} request to ${url}`);
            
            const response = await axios[method](url, formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
    
            if (response.data && (response.data.success || response.data.message?.includes('success'))) {
                alert(rfqId ? "RFQ updated successfully!" : "RFQ created successfully!");
                router.visit(route("rfq.index"));
            } else {
                console.error("Response didn't indicate success:", response.data);
                alert("Failed to save RFQ: " + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error saving RFQ:", error);
            console.error("Error details:", error.response?.data || error.message);
            
            if (error.response?.data?.errors) {
                // Handle validation errors
                const errorMessages = Object.values(error.response.data.errors)
                    .flat()
                    .join('\n');
                alert(`Validation Error:\n${errorMessages}`);
            } else {
                alert(error.response?.data?.message || "Failed to save RFQ. Check console for details.");
            }
        }
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    item_name: "",
                    description: "",
                    unit_id: "",
                    quantity: "",
                    brand_id: "",
                    attachment: null,
                    expected_delivery_date: "",
                    rfq_id: rfqId || null,
                    status_id: 47
                },
            ],
        }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        if (field === 'quantity') {
            if (value === '') {
                updatedItems[index][field] = '';
            } else {
                const numValue = parseFloat(value);
                if (numValue < 0) return;
                updatedItems[index][field] = numValue.toFixed(1);
            }
        } else {
            updatedItems[index][field] = value;
        }
        setFormData({ ...formData, items: updatedItems });
    };

    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachments(prev => ({
                ...prev,
                [index]: file
            }));
            
            const updatedItems = [...formData.items];
            updatedItems[index].attachment = file;
            updatedItems[index].tempUrl = URL.createObjectURL(file);
            setFormData({ ...formData, items: updatedItems });
        }
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length <= 1) {
            alert("You must have at least one item.");
            return;
        }
        
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
        
        setAttachments((prev) => {
            const newAttachments = { ...prev };
            delete newAttachments[index];
            return newAttachments;
        });
    };

    const handleFormInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDownloadPDF = async () => {
        try {
            // First save the quotation if it hasn't been saved
            if (!rfqId) {
                await handleSubmit();
                return; // The save function will redirect
            }

            // Open PDF in new tab
            window.open(route('rfq.pdf', rfqId), '_blank');
        } catch (error) {
            console.error('Error handling PDF:', error);
            alert('Failed to process PDF request');
        }
    };

    // Helper component for file display
    const FileDisplay = ({ file }) => {
        const fileName = file ? (
            typeof file === 'object' && file.name 
                ? file.name 
                : typeof file === 'string' 
                    ? decodeURIComponent(file.split('/').pop()) 
                    : file.name
        ) : null;
    
        const fileUrl = file ? (
            typeof file === 'object' && file.tempUrl 
                ? file.tempUrl 
                : typeof file === 'string' 
                    ? `/download/${encodeURIComponent(fileName)}` 
                    : null
        ) : null;
    
        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                {fileName && <DocumentArrowDownIcon 
                    className="h-6 w-6 text-gray-400 cursor-pointer" 
                    onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                />}
                {fileName && (
                    <span 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                        onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                    >
                        {fileName}
                    </span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title={isEditing ? "Edit RFQ" : "Create RFQ"} />
                <div className="min-h-screen p-6">
                    <div className="flex justify-center items-center h-screen">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (error) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Error Loading RFQ" />
                <div className="min-h-screen p-6">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p>{error}</p>
                        <div className="mt-4">
                            <button 
                                onClick={() => router.visit("/rfq")}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Return to RFQ List
                            </button>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isEditing ? "Edit RFQ" : "Create RFQ"} />
            <div className="min-h-screen p-6">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/rfq")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center justify-between mb-6 space-x-4">
                    <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2">
                        <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Procurement Center</Link>
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <Link href="/rfq" className="hover:text-[#009FDC] text-xl">RFQs</Link>
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <span className="text-[#009FDC] text-xl">
                            {isEditing ? "Edit RFQ" : "New RFQ Request"}
                        </span>
                    </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {isEditing ? "Edit Request for Quotation" : "Request for a Quotation"}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Share Requirements and Receive Tailored Estimates
                        </p>
                    </div>
                    <img src="/images/MCTC Logo.png" alt="Maharat Logo" className="h-12" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Info Grid */}
                    <div className="bg-blue-50 rounded-lg p-6 grid grid-cols-2 gap-6 shadow-md text-lg">
                        {/* Left Column */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                            <span className="font-medium text-gray-600">Organization Email:</span>
                            <input
                                type="email"
                                value={formData.organization_email}
                                onChange={(e) => handleFormInputChange('organization_email', e.target.value)}
                                className="text-black bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">City:</span>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleFormInputChange('city', e.target.value)}
                                className="text-black bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">Category:</span>
                            <div className="relative w-full">
                                <select
                                    value={formData.category_id || ""}
                                    onChange={(e) => handleFormInputChange("category_id", e.target.value)}
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                    style={{ colorScheme: "light" }}
                                    required
                                >
                                    {/* If a category is already selected, display its name as the default */}
                                    {!formData.category_id ? (
                                        <option value="">Select Category</option>
                                    ) : (
                                        <option value={formData.category_id} disabled>
                                            {categories.find((c) => c.id === formData.category_id)?.name || "Unknown Category"}
                                        </option>
                                    )}

                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id} className="text-[#009FDC] bg-blue-50">
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <span className="font-medium text-gray-600">Warehouse:</span>
                            <div className="relative w-full">
                                <select
                                    value={formData.warehouse_id || ''}
                                    onChange={(e) => handleFormInputChange('warehouse_id', e.target.value)}
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                    style={{ colorScheme: "light" }}
                                    required
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={warehouse.id}
                                            className="text-[#009FDC] bg-blue-50"
                                        >
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                            <span className="font-medium text-gray-600">Issue Date:</span> 
                            <input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => handleFormInputChange('issue_date', e.target.value)}
                                className="text-black bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">Closing Date:</span> 
                            <input
                                type="date"
                                value={formData.closing_date}
                                onChange={(e) => handleFormInputChange('closing_date', e.target.value)}
                                className="text-black bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">RFQ#:</span> 
                            <input
                                type="text"
                                value={formData.rfq_id}
                                onChange={(e) => handleFormInputChange('rfq_id', e.target.value)}
                                className="text-black bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full"
                                readOnly={!isEditing} // Make it readonly for new RFQs
                                placeholder={isEditing ? "" : "Auto-generated by system"}
                                required={isEditing} // Only required when editing
                            />

                            <span className="font-medium text-gray-600">Payment Type:</span>
                            <div className="relative w-full">
                                <select
                                    value={formData.payment_type || ''}
                                    onChange={(e) => handleFormInputChange('payment_type', e.target.value)}
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                    style={{ colorScheme: "light" }}
                                    required
                                >
                                    <option value="">Select Payment Type</option>
                                    {paymentTypes.map((type) => (
                                        <option key={type.id} value={type.id} className="text-[#009FDC] bg-blue-50">
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <span className="font-medium text-gray-600">Contact No#:</span>
                            <input
                                type="text"
                                value={formData.contact_no}
                                onChange={(e) => handleFormInputChange('contact_no', e.target.value)}
                                className="text-black bg-blue-50 border-b border-gray-300 focus:border-blue-500 focus:ring-0 w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Item Table */}
                    <table className="w-full mt-4 table-fixed border-collapse">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">Item Name</th>
                                <th className="px-2 py-2 text-center w-[11%] bg-[#C7E7DE]">Description</th>
                                <th className="px-2 py-2 text-center w-[12%] bg-[#C7E7DE]">Unit</th>
                                <th className="px-2 py-2 text-center w-[9%] bg-[#C7E7DE]">Quantity</th>
                                <th className="px-2 py-2 text-center w-[12%] bg-[#C7E7DE]">Brand</th>
                                <th className="px-2 py-2 text-center w-[9%] bg-[#C7E7DE]">Attachment</th>
                                <th className="px-2 py-2 text-center w-[13%] bg-[#C7E7DE]">Expected Delivery Date</th>
                                <th className="px-2 py-2 text-center w-[6%] bg-[#C7E7DE]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <input
                                            type="text"
                                            value={item.item_name || ''}
                                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal text-center"
                                            style={{ background: 'none', outline: 'none', textAlign: 'center' }}
                                            required
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <textarea
                                            value={item.description || ''}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal resize-none text-center"
                                            style={{ background: 'none', outline: 'none', overflow: 'hidden', textAlign: 'center' }}
                                            rows="1"
                                            required
                                            onInput={e => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <select
                                            value={item.unit_id || ''}
                                            onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent"
                                            style={{ background: 'none', outline: 'none', textAlign: 'center', paddingRight: '1rem' }}
                                            required
                                        >
                                            <option value="">Select Unit</option>
                                            {units.map((unit) => (
                                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm whitespace-normal text-center"
                                            style={{ background: 'none', outline: 'none', textAlign: 'center' }}
                                            required
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <select
                                            value={item.brand_id || ''}
                                            onChange={(e) => handleItemChange(index, 'brand_id', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent"
                                            style={{ background: 'none', outline: 'none', textAlign: 'center', paddingRight: '1rem' }}
                                            required
                                        >
                                            <option value="">Select Brand</option>
                                            {brands.map((brand) => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center justify-center w-full">
                                            <FileDisplay file={item.attachment} />
                                            <input
                                                type="file"
                                                onChange={(e) => handleFileChange(index, e)}
                                                className="hidden"
                                                id={`file-input-${index}`}
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <label 
                                                htmlFor={`file-input-${index}`}
                                                className="mt-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer break-words whitespace-normal text-center"
                                            >
                                                {item.attachment ? 'Replace file' : 'Attach file'}
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="date"
                                            value={item.expected_delivery_date || ''}
                                            onChange={(e) => handleItemChange(index, 'expected_delivery_date', e.target.value)}
                                            className="text-sm text-gray-900 bg-transparent border-none focus:ring-0 w-full"
                                            required
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-600 hover:text-red-900"
                                            disabled={formData.items.length <= 1}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Add Item Button */}
                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-blue-600 flex items-center"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-green-600 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50"
                        >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            {isEditing ? "Update RFQ" : "Save RFQ"}
                        </button>
                        {rfqId && (
                            <button
                                type="button"
                                onClick={handleDownloadPDF}
                                className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                Download PDF
                            </button>
                        )}
                        {rfqId && (
                            <button
                                type="button"
                                onClick={() => {
                                    // Implement email sending functionality
                                    alert("Email functionality will be implemented in the future.");
                                }}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <EnvelopeIcon className="h-5 w-5 mr-2" />
                                Send RFQ by Mail
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}