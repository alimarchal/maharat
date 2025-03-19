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
    const [warehouseNames, setWarehouseNames] = useState({});
    const [categoryNames, setCategoryNames] = useState({});
    const [paymentTypeNames, setPaymentTypeNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (rfqId) {
            setLoading(true);
            setIsEditing(true);
            
            // Directly fetch RFQ data
            axios.get(`/api/v1/rfqs/${rfqId}`)
                .then(async response => {
                    const rfqData = response.data?.data;
                    
                    if (!rfqData) {
                        setError("RFQ not found or has invalid data format");
                        setLoading(false);
                        return;
                    }
                    
                    console.log("Raw RFQ data from API:", rfqData);
                    
                    // For category, we need to fetch from rfq_categories
                    let categoryId = rfqData.category_id ? String(rfqData.category_id) : "";
                    
                    // If category_id is empty, try to fetch from rfq_categories relationship
                    if (!categoryId && rfqId) {
                        try {
                            const categoryResponse = await axios.get(`/api/v1/rfq-categories/${rfqId}`);
                            console.log("Category data:", categoryResponse.data);
                            
                            if (categoryResponse.data && 
                                categoryResponse.data.data && 
                                categoryResponse.data.data.length > 0) {
                                categoryId = String(categoryResponse.data.data[0].category_id);
                            }
                        } catch (err) {
                            console.error("Error fetching category:", err);
                        }
                    }
                    
                    // Extract items from the response
                    const rfqItems = rfqData.items || [];
                    
                    // Format the items for the form
                    const formattedItems = rfqItems.map(item => {
                        // Process attachment info properly
                        let attachmentObj = null;
                        if (item.attachment) {
                            attachmentObj = {
                                attachment: item.attachment,
                                specifications: item.specifications || item.attachment.split('/').pop()
                            };
                        }
                        
                        return {
                            id: item.id,
                            item_name: item.item_name || '',
                            description: item.description || '',
                            unit_id: item.unit_id ? String(item.unit_id) : '',
                            quantity: item.quantity || '',
                            brand_id: item.brand_id ? String(item.brand_id) : '',
                            attachment: attachmentObj,
                            specifications: item.specifications || '',
                            expected_delivery_date: item.expected_delivery_date?.split('T')[0] || '',
                            rfq_id: rfqId,
                            status_id: item.status_id ? String(item.status_id) : '47'
                        };
                    });
                    
                    // If no items, add a default empty one
                    if (formattedItems.length === 0) {
                        formattedItems.push({
                            item_name: "",
                            description: "",
                            unit_id: "",
                            quantity: "",
                            brand_id: "",
                            attachment: null,
                            expected_delivery_date: "",
                            rfq_id: rfqId,
                            status_id: "47"
                        });
                    }
                    
                    // Format the main form data
                    // Fix: Ensure all IDs are strings with explicit conversion
                    const formattedData = {
                        organization_email: rfqData.organization_email || '',
                        city: rfqData.city || '',
                        category_id: categoryId, // Already converted to string above
                        warehouse_id: rfqData.warehouse_id ? String(rfqData.warehouse_id) : '',
                        issue_date: rfqData.request_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                        closing_date: rfqData.closing_date?.split('T')[0] || '',
                        rfq_id: rfqData.rfq_number || '',
                        payment_type: rfqData.payment_type ? String(rfqData.payment_type) : '',
                        contact_no: rfqData.contact_number || '',
                        status_id: rfqData.status_id ? String(rfqData.status_id) : '47',
                        items: formattedItems
                    };
                    
                    console.log("Setting form data:", formattedData);
                    setFormData(formattedData);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching RFQ data:", error);
                    setError("Failed to load RFQ data: " + (error.response?.data?.message || error.message || "Unknown error"));
                    setLoading(false);
                });
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
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Define the API endpoints to fetch
                const endpoints = [
                    { name: 'units', url: '/api/v1/units' },
                    { name: 'brands', url: '/api/v1/brands' },
                    { name: 'categories', url: '/api/v1/product-categories' },
                    { name: 'warehouses', url: '/api/v1/warehouses' },
                    { name: 'statuses', url: '/api/v1/statuses' },
                ];
    
                // Fetch each endpoint and handle potential errors individually
                const results = await Promise.all(
                    endpoints.map(async (endpoint) => {
                        try {
                            const response = await axios.get(endpoint.url);
                            return { 
                                name: endpoint.name,
                                data: response.data?.data || [] 
                            };
                        } catch (error) {
                            console.warn(`Failed to fetch ${endpoint.name}:`, error);
                            return { name: endpoint.name, data: [] };
                        }
                    })
                );
    
                // Apply results to state
                results.forEach(result => {
                    switch(result.name) {
                        case 'units':
                            setUnits(result.data);
                            
                            // Create lookup map for units
                            const unitLookup = {};
                            result.data.forEach(unit => {
                                if (unit && unit.id) {
                                    unitLookup[String(unit.id)] = unit.name; // Ensure keys are strings
                                }
                            });
                            setUnitNames(unitLookup);
                            break;
                            
                        case 'brands':
                            setBrands(result.data);
                            
                            // Create lookup map for brands
                            const brandLookup = {};
                            result.data.forEach(brand => {
                                if (brand && brand.id) {
                                    brandLookup[String(brand.id)] = brand.name; // Ensure keys are strings
                                }
                            });
                            setBrandNames(brandLookup);
                            break;
                            
                        case 'categories':
                            setCategories(result.data);
                            
                            // Create lookup map for categories
                            const categoryLookup = {};
                            result.data.forEach(category => {
                                if (category && category.id) {
                                    categoryLookup[String(category.id)] = category.name; // Ensure keys are strings
                                }
                            });
                            setCategoryNames(categoryLookup);
                            break;
                            
                        case 'warehouses':
                            setWarehouses(result.data);
                            
                            // Create lookup map for warehouses
                            const warehouseLookup = {};
                            result.data.forEach(warehouse => {
                                if (warehouse && warehouse.id) {
                                    warehouseLookup[String(warehouse.id)] = warehouse.name; // Ensure keys are strings
                                }
                            });
                            setWarehouseNames(warehouseLookup);
                            break;
                        
                        case 'statuses':
                            // Filter payment types from statuses
                            const paymentTypes = result.data.filter(
                                status => status.type === 'payment_type' || status.type?.includes('payment')
                            );
                            setPaymentTypes(paymentTypes.length > 0 ? paymentTypes : result.data.slice(0, 3));
                            
                            // Create lookup map for payment types
                            const paymentTypeLookup = {};
                            paymentTypes.forEach(type => {
                                if (type && type.id) {
                                    paymentTypeLookup[String(type.id)] = type.name; // Ensure keys are strings
                                }
                            });
                            setPaymentTypeNames(paymentTypeLookup);
                            break;
                            
                        default:
                            break;
                    }
                });
    
                // Log lookup information after loading
                console.log("Category mapping:", categoryNames);
                console.log("Warehouse mapping:", warehouseNames);
                console.log("Payment type mapping:", paymentTypeNames);
                console.log("Form data after loading lookup data:", formData);
    
                setLoading(false);
            } catch (error) {
                console.error('Error fetching lookup data:', error);
                setError('Failed to load reference data. Some options may be unavailable.');
                
                // Set empty arrays for all data to prevent further errors
                setUnits([]);
                setBrands([]);
                setCategories([]);
                setWarehouses([]);
                setPaymentTypes([]);
                setUnitNames({});
                setBrandNames({});
                setWarehouseNames({});
                setCategoryNames({});
                setPaymentTypeNames({});
                
                setLoading(false);
            }
        };
    
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const formDataObj = new FormData();
    
            // Basic validation
            if (!formData.organization_email || !formData.city || 
                !formData.issue_date || !formData.closing_date) {
                alert("Please fill out all required fields in the top section.");
                return;
            }
    
            // Main fields - add null/type checking
            formDataObj.append('organization_email', formData.organization_email || '');
            formDataObj.append('city', formData.city || '');
            
            // For numeric values, ensure we have valid numbers or send empty string
            const categoryId = formData.category_id || ''; // Don't convert to int if we have an empty string
            const warehouseId = formData.warehouse_id || ''; // Don't convert to int if we have an empty string
            const paymentType = formData.payment_type || ''; // Don't convert to int if we have an empty string
            const statusId = formData.status_id || '47';
            
            formDataObj.append('category_id', categoryId);
            formDataObj.append('warehouse_id', warehouseId);
            formDataObj.append('request_date', formData.issue_date || '');
            formDataObj.append('closing_date', formData.closing_date || '');
            
            // Always include rfq_number for both creating and editing
            formDataObj.append('rfq_number', formData.rfq_id || '');
            
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
                rfq_number: formData.rfq_id,
                payment_type: paymentType,
                contact_number: formData.contact_no,
                status_id: statusId
            });
    
            // Filter and validate items - allow items without category/warehouse/payment for update
            const validItems = formData.items.filter(item => 
                item.item_name && item.quantity
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
                
                // Add unit_id, brand_id, status_id - without parseInt which could convert empty strings to NaN
                formDataObj.append(`items[${index}][unit_id]`, item.unit_id || '');
                formDataObj.append(`items[${index}][brand_id]`, item.brand_id || '');
                formDataObj.append(`items[${index}][status_id]`, item.status_id || '47');
                
                // Always add rfq_id to each item
                formDataObj.append(`items[${index}][rfq_id]`, rfqId || null);
            });
            
            // Handle attachments (files)
            console.log("Attachments to be sent:", attachments);
            if (attachments && Object.keys(attachments).length > 0) {
                Object.keys(attachments).forEach(index => {
                    if (attachments[index]) {
                        // Find the corresponding item index in validItems
                        const itemIndex = validItems.findIndex((_, i) => i.toString() === index.toString());
                        if (itemIndex !== -1) {
                            formDataObj.append(`attachments[${itemIndex}]`, attachments[index]);
                            console.log(`Added attachment for item ${itemIndex}:`, attachments[index].name);
                        }
                    }
                });
            }
            
            // For PUT requests in Laravel, you need to include the _method field
            if (rfqId) {
                formDataObj.append('_method', 'PUT');
            }
            
            // Use the appropriate URL based on whether creating or editing
            const url = rfqId ? `/api/v1/rfqs/${rfqId}` : '/api/v1/rfqs';
            
            // Always use POST for FormData with method spoofing for PUT
            console.log(`Making ${rfqId ? 'PUT' : 'POST'} request to ${url}`);
            
            // Print out all formDataObj keys and values for debugging
            for (let pair of formDataObj.entries()) {
                console.log(pair[0], pair[1]);
            }
            
            const response = await axios.post(url, formDataObj, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
            });
    
            if (response.data && response.data.success === true) {
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
            // Store the file object for FormData submission
            setAttachments(prev => ({
                ...prev,
                [index]: file
            }));
            
            // For display and storage in formData state
            // We store the file object but when saved to database it will be stored as path
            // in the format "rfq-attachments/hash" 
            const updatedItems = [...formData.items];
            updatedItems[index].attachment = file;
            updatedItems[index].tempUrl = URL.createObjectURL(file);
            // Also store original filename in specifications
            updatedItems[index].specifications = file.name;
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
        // Get the display filename - prioritize specifications field which contains the original filename
        let fileName = null;
        let fileUrl = null;
        
        if (file) {
            // For new files uploaded in the current session
            if (typeof file === 'object' && file.name) {
                fileName = file.name;
                fileUrl = file.tempUrl || null;
            }
            // For files with specifications field from the database
            else if (typeof file === 'object' && file.specifications) {
                fileName = file.specifications;
                // If attachment is a string path
                if (typeof file.attachment === 'string') {
                    // Use the full path stored in the database for download
                    fileUrl = `/download/${encodeURIComponent(file.attachment)}`;
                }
            }
            // For simple string paths from database
            else if (typeof file === 'string') {
                // For stored path like "rfq-attachments/filename.pdf"
                // Extract just the filename for display but use full path for URL
                fileName = file.split('/').pop();
                fileUrl = `/download/${encodeURIComponent(file)}`;
            }
            // For objects with attachment property
            else if (typeof file === 'object' && file.attachment) {
                // If attachment is a string (path)
                if (typeof file.attachment === 'string') {
                    // Display just filename but use full path for download
                    fileName = file.attachment.split('/').pop();
                    fileUrl = `/download/${encodeURIComponent(file.attachment)}`;
                } else {
                    // If attachment is another object (shouldn't happen, but just in case)
                    fileName = "Attachment";
                }
            }
        }
    
        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                {fileName && (
                    <DocumentArrowDownIcon 
                        className="h-6 w-6 text-gray-400 cursor-pointer" 
                        onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                    />
                )}
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
                                className="text-black bg-blue-50 border-none focus:ring-0 focus:outline-none w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">City:</span>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleFormInputChange('city', e.target.value)}
                                className="text-black bg-blue-50 border-none focus:ring-0 focus:outline-none w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">Category:</span>
                            <div className="relative w-full">
                                <select
                                    value={formData.category_id || ''}
                                    onChange={(e) => handleFormInputChange('category_id', e.target.value)}
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none focus:ring-0 focus:outline-none w-full appearance-none cursor-pointer"
                                    style={{ colorScheme: "light" }}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={String(category.id)}
                                            className="text-[#009FDC] bg-blue-50"
                                            selected={String(category.id) === String(formData.category_id)}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Debug info - can be removed in production */}
                                {isEditing && formData.category_id && (
                                    <div className="text-xs text-gray-500">
                                        ID: {formData.category_id}, Name: {categoryNames[formData.category_id] || 'Not found'}
                                    </div>
                                )}
                            </div>

                            <span className="font-medium text-gray-600">Warehouse:</span>
                            <div className="relative w-full">
                                <select
                                    value={formData.warehouse_id || ''}
                                    onChange={(e) => handleFormInputChange('warehouse_id', e.target.value)}
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none focus:ring-0 focus:outline-none w-full appearance-none cursor-pointer"
                                    style={{ colorScheme: "light" }}
                                    required
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={String(warehouse.id)}
                                            className="text-[#009FDC] bg-blue-50"
                                            selected={String(warehouse.id) === String(formData.warehouse_id)}
                                        >
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Debug info - can be removed in production */}
                                {isEditing && formData.warehouse_id && (
                                    <div className="text-xs text-gray-500">
                                        ID: {formData.warehouse_id}, Name: {warehouseNames[formData.warehouse_id] || 'Not found'}
                                    </div>
                                )}
                            </div>
                            </div>


                        {/* Right Column */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                            <span className="font-medium text-gray-600">Issue Date:</span> 
                            <input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => handleFormInputChange('issue_date', e.target.value)}
                                className="text-black bg-blue-50 border-none focus:ring-0 focus:outline-none w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">Closing Date:</span> 
                            <input
                                type="date"
                                value={formData.closing_date}
                                onChange={(e) => handleFormInputChange('closing_date', e.target.value)}
                                className="text-black bg-blue-50 border-none focus:ring-0 focus:outline-none w-full"
                                required
                            />

                            <span className="font-medium text-gray-600">RFQ#:</span> 
                            <input
                                type="text"
                                value={formData.rfq_id}
                                onChange={(e) => handleFormInputChange('rfq_id', e.target.value)}
                                className="text-black bg-blue-50 border-none focus:ring-0 focus:outline-none w-full"
                                readOnly={!isEditing} // Make it readonly for new RFQs
                                placeholder={isEditing ? "" : "Auto-generated by system"}
                                required={isEditing} // Only required when editing
                            />

                            <span className="font-medium text-gray-600">Payment Type:</span>
                            <div className="relative w-full">
                                <select
                                    value={formData.payment_type || ''}
                                    onChange={(e) => handleFormInputChange('payment_type', e.target.value)}
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none focus:ring-0 focus:outline-none w-full appearance-none cursor-pointer"
                                    style={{ colorScheme: "light" }}
                                    required
                                >
                                    <option value="">Select Payment Type</option>
                                    {paymentTypes.map((type) => (
                                        <option 
                                            key={type.id} 
                                            value={String(type.id)} 
                                            className="text-[#009FDC] bg-blue-50"
                                            selected={String(type.id) === String(formData.payment_type)}
                                        >
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Debug info - can be removed in production */}
                                {isEditing && formData.payment_type && (
                                    <div className="text-xs text-gray-500">
                                        ID: {formData.payment_type}, Name: {paymentTypeNames[formData.payment_type] || 'Not found'}
                                    </div>
                                )}
                            </div>

                            <span className="font-medium text-gray-600">Contact No#:</span>
                            <input
                                type="text"
                                value={formData.contact_no}
                                onChange={(e) => handleFormInputChange('contact_no', e.target.value)}
                                className="text-black bg-blue-50 border-none focus:ring-0 focus:outline-none w-full"
                                required
                            />
                        </div>
                        </div>

                    {/* Item Table */}
                    <table className="w-full mt-4 table-fixed border-collapse">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">Item Name</th>
                                <th className="px-2 py-2 text-center w-[15%] bg-[#C7E7DE]">Description</th>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">Unit</th>
                                <th className="px-2 py-2 text-center w-[8%] bg-[#C7E7DE]">Quantity</th>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">Brand</th>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">Attachment</th>
                                <th className="px-2 py-2 text-center w-[14%] bg-[#C7E7DE]">Expected Delivery Date</th>
                                <th className="px-2 py-2 text-center w-[6%] bg-[#C7E7DE]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <input
                                            type="text"
                                            value={item.item_name || ''}
                                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal text-center min-h-[3rem]"
                                            style={{ background: 'none', outline: 'none', textAlign: 'center' }}
                                            required
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <textarea
                                            value={item.description || ''}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal resize-none text-center min-h-[3rem]"
                                            style={{ 
                                                background: 'none', 
                                                outline: 'none', 
                                                overflow: 'hidden', 
                                                textAlign: 'center',
                                                wordWrap: 'break-word',
                                                whiteSpace: 'normal'
                                            }}
                                            rows="2"
                                            required
                                            onInput={e => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = (e.target.scrollHeight) + 'px';
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
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
                                    <td className="px-6 py-6 text-center align-middle">
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
                                    <td className="px-6 py-6 text-center align-middle">
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
                                    <td className="px-6 py-6 text-center">
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
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <input
                                            type="date"
                                            value={item.expected_delivery_date || ''}
                                            onChange={(e) => handleItemChange(index, 'expected_delivery_date', e.target.value)}
                                            className="text-sm text-gray-900 bg-transparent border-none focus:ring-0 w-full"
                                            required
                                        />
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
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
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}