import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { router, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { DocumentTextIcon, DocumentArrowDownIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight, faTrash } from "@fortawesome/free-solid-svg-icons";
import { fetchRFQData, fetchLookupData, getSafeValue } from "./rfqUtils";
import { FaTrash } from "react-icons/fa";

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
            status_id: 48
        }],
        status_id: 48,
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
                    
                    const rfqItems = rfqData.items || [];
                    
                    const formattedItems = rfqItems.map(item => {
                        let attachmentObj = null;
                        if (item.attachment) {
                            if (typeof item.attachment === 'string') {
                                // Extract just the path part, removing any domain
                                let path = item.attachment;
                                
                                // If it's a full URL, extract just the path portion
                                if (path.startsWith('http')) {
                                    const urlObj = new URL(path);
                                    path = urlObj.pathname; // This gives just the path part: /storage/rfq-attachments/
                                }
                                
                                // Create object with relative path
                                attachmentObj = {
                                    url: path, 
                                    name: item.specifications || path.split('/').pop()
                                };
                            } else if (typeof item.attachment === 'object') {
                                // Handle object attachment
                                attachmentObj = {
                                    url: item.attachment.url || item.attachment.path || '',
                                    name: item.specifications || item.attachment.name || 'Attachment'
                                };
                            }
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
                            status_id: item.status_id ? String(item.status_id) : '48'
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
                            status_id: "48"
                        });
                    }
                    
                    // Format the main form data
                    const formattedData = {
                        organization_email: rfqData.organization_email || '',
                        city: rfqData.city || '',

                        category_id: rfqData.categories && rfqData.categories.length > 0 
                            ? String(rfqData.categories[0].id) 
                            : '',

                        warehouse_id: rfqData.warehouse 
                            ? String(rfqData.warehouse.id) 
                            : '',
                        issue_date: rfqData.request_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                        closing_date: rfqData.closing_date?.split('T')[0] || '',
                        rfq_id: rfqData.rfq_number || '',

                        payment_type: rfqData.payment_type 
                            ? String(rfqData.payment_type.id) 
                            : '',
                        contact_no: rfqData.contact_number || '',
                        status_id: rfqData.status?.id ? String(rfqData.status.id) : '48',
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

    // Fetch lookup data 
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Define the API endpoints 
                const endpoints = [
                    { name: 'units', url: '/api/v1/units' },
                    { name: 'brands', url: '/api/v1/brands' },
                    { name: 'categories', url: '/api/v1/product-categories' },
                    { name: 'warehouses', url: '/api/v1/warehouses' },
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
                                    unitLookup[String(unit.id)] = unit.name; 
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
                                    brandLookup[String(brand.id)] = brand.name; 
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
                                    categoryLookup[String(category.id)] = category.name; 
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
                                    warehouseLookup[String(warehouse.id)] = warehouse.name; 
                                }
                            });
                            setWarehouseNames(warehouseLookup);
                            break;
                        
                        default:
                            break;
                    }
                });
    
                try {
                    const statusesResponse = await axios.get('/api/v1/statuses', {
                        params: {
                            per_page: 100 
                        }
                    });
                    
                    console.log("Statuses response with per_page=100:", statusesResponse.data);
                    
                    let allStatuses = [];
                    
                    if (statusesResponse.data && statusesResponse.data.data) {
                        allStatuses = statusesResponse.data.data;
                        
                        const meta = statusesResponse.data.meta;
                        if (meta) {
                            console.log("Pagination metadata:", meta);
                            
                            if (meta.last_page && meta.last_page > 1 && meta.current_page === 1) {
                                const remainingRequests = [];
                                
                                for (let page = 2; page <= meta.last_page; page++) {
                                    remainingRequests.push(
                                        axios.get('/api/v1/statuses', {
                                            params: {
                                                per_page: 100,
                                                page: page
                                            }
                                        })
                                    );
                                }
                                
                                console.log(`Fetching ${remainingRequests.length} additional pages of statuses...`);
                                
                                const remainingResponses = await Promise.all(remainingRequests);
                                
                                remainingResponses.forEach(response => {
                                    if (response.data && response.data.data) {
                                        allStatuses = [...allStatuses, ...response.data.data];
                                    }
                                });
                            }
                        }
                        
                        console.log(`Total statuses fetched: ${allStatuses.length}`);
                        
                        // Filter for payment types
                        const paymentTypes = allStatuses.filter(status => 
                            status.type && status.type.toLowerCase() === 'payment'
                        );
                        
                        console.log("Filtered payment types:", paymentTypes);
                        
                        if (paymentTypes.length > 0) {
                            setPaymentTypes(paymentTypes);
                            
                            // lookup map for payment types
                            const paymentTypeLookup = {};
                            paymentTypes.forEach(type => {
                                if (type && type.id) {
                                    paymentTypeLookup[String(type.id)] = type.name;
                                }
                            });
                            setPaymentTypeNames(paymentTypeLookup);
                        } else {
                            console.log("No payment types found, using all statuses instead");
                            setPaymentTypes(allStatuses);
                            
                            // Create lookup map for all statuses
                            const statusesLookup = {};
                            allStatuses.forEach(status => {
                                if (status && status.id) {
                                    statusesLookup[String(status.id)] = `${status.name} (${status.type})`;
                                }
                            });
                            setPaymentTypeNames(statusesLookup);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching all statuses:", error);
                    
                    try {
                        const fallbackResponse = await axios.get('/api/v1/statuses');
                        if (fallbackResponse.data && fallbackResponse.data.data) {
                            const fallbackStatuses = fallbackResponse.data.data;
                            console.log("Fallback: using initial statuses:", fallbackStatuses);
                            
                            setPaymentTypes(fallbackStatuses);
                            
                            const fallbackLookup = {};
                            fallbackStatuses.forEach(status => {
                                if (status && status.id) {
                                    fallbackLookup[String(status.id)] = `${status.name} (${status.type})`;
                                }
                            });
                            setPaymentTypeNames(fallbackLookup);
                        }
                    } catch (fallbackError) {
                        console.error("Fallback fetch also failed:", fallbackError);
                        setPaymentTypes([]);
                        setPaymentTypeNames({});
                    }
                }
    
                console.log("Category mapping:", categoryNames);
                console.log("Warehouse mapping:", warehouseNames);
                console.log("Payment type mapping:", paymentTypeNames);
                console.log("Form data after loading lookup data:", formData);
    
                setLoading(false);
            } catch (error) {
                console.error('Error fetching lookup data:', error);
                setError('Failed to load reference data. Some options may be unavailable.');
                
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
    
            // Main fields
            formDataObj.append('organization_email', formData.organization_email || '');
            formDataObj.append('city', formData.city || '');
            formDataObj.append('category_id', formData.category_id || '');
            formDataObj.append('warehouse_id', formData.warehouse_id || '');
            formDataObj.append('request_date', formData.issue_date || '');
            formDataObj.append('closing_date', formData.closing_date || '');
            formDataObj.append('rfq_number', formData.rfq_id || '');
            formDataObj.append('payment_type', formData.payment_type || '');
            formDataObj.append('contact_number', formData.contact_no || '');
            formDataObj.append('status_id', formData.status_id || '48');
    
            formData.items.forEach((item, index) => {
                if (item.id) {
                    formDataObj.append(`items[${index}][id]`, item.id);
                }
                
                // Add main item fields
                formDataObj.append(`items[${index}][item_name]`, item.item_name || '');
                formDataObj.append(`items[${index}][description]`, item.description || '');
                formDataObj.append(`items[${index}][quantity]`, item.quantity || '');
                formDataObj.append(`items[${index}][expected_delivery_date]`, item.expected_delivery_date || '');
                formDataObj.append(`items[${index}][unit_id]`, item.unit_id || '');
                formDataObj.append(`items[${index}][brand_id]`, item.brand_id || '');
                formDataObj.append(`items[${index}][status_id]`, item.status_id || '48');
                formDataObj.append(`items[${index}][rfq_id]`, rfqId || null);
    
                // Handle file attachment
                formData.items.forEach((item, index) => {
                    Object.keys(item).forEach((key) => {
                        formDataObj.append(`items[${index}][${key}]`, item[key]);
                    });
        
                    if (attachments[index]) {
                        formDataObj.append(
                            `items[${index}][attachment]`,
                            attachments[index]
                        );
                    }
                });
            });

            if (rfqId) {
                formDataObj.append('_method', 'PUT');
            }
    
            const url = rfqId ? `/api/v1/rfqs/${rfqId}` : '/api/v1/rfqs';
    
            const response = await axios.post(url, formDataObj, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
            });
    
            if (response.data && response.data.success === true) {
                alert(rfqId ? "RFQ updated successfully!" : "RFQ created successfully!");
                //router.visit(route("rfq.index"));
            } else {
                console.error("Response didn't indicate success:", response.data);
                alert("Failed to save RFQ: " + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error saving RFQ:", error);
            console.error("Error details:", error.response?.data || error.message);
            
            if (error.response?.data?.errors) {
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
                    status_id: 48
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
            // Store the actual file object
            setAttachments(prev => ({
                ...prev,
                [index]: file
            }));
            
            // Update the form data with the file info
            const updatedItems = [...formData.items];
            updatedItems[index].attachment = file;
            setFormData({ ...formData, items: updatedItems });

            // Optionally create a temporary URL for immediate display
            updatedItems[index].tempUrl = URL.createObjectURL(file);
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

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        
        try {
            const formDataToSend = new FormData();
            
            // Add basic form data
            Object.keys(formData).forEach(key => {
                if (key !== 'items' && formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add items as a JSON string
            if (formData.items && formData.items.length > 0) {
                formDataToSend.append('items', JSON.stringify(formData.items));
            }

            // Add attachments separately
            if (attachments) {
                Object.keys(attachments).forEach(index => {
                    formDataToSend.append(`attachments[${index}]`, attachments[index]);
                });
            }

            const response = await axios.post('/api/v1/rfq-items', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                alert('Items saved successfully!');
                router.visit(route('rfq.index'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert(error.response?.data?.message || 'Failed to save items');
        }
    }; 

    const handleDownloadPDF = async () => {
        try {
            if (!formData.id) {
                await handleSave();
            }

            // View PDF in new tab
            window.open(route('quotations.pdf.view', formData.id), '_blank');

            // Direct download
            // window.location.href = route('quotations.pdf.download', formData.id);
        } catch (error) {
            console.error('Error handling PDF:', error);
            alert('Failed to process PDF request');
        }
    };

    const handleSaveAndSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await handleSubmit(e);
        } catch (error) {
            console.error("Error saving RFQ:", error);
            alert("RFQ save failed. Please check your data and try again.");
            return; 
        }
    
        try {
            await handleSave();
        } catch (error) {
            console.error("Error saving item table or attachments:", error);
            alert("Item table or attachments save failed. Please try again.");
            return; 
        }
    
        alert("RFQ successfully saved with all attachments!");
        router.visit(route("rfq.index"));
    };

    const FileDisplay = ({ file, onFileClick }) => {
        if (!file) {
            return (
                <div className="flex flex-col items-center justify-center space-y-2">
                    <DocumentArrowDownIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-500">No file attached</span>
                </div>
            );
        }
    
        const origin = window.location.origin;
        
        let fileName = '';
        let fileUrl = null;
        
        // Case 1: File is a string URL (path)
        if (typeof file === 'string') {
            fileName = file.split('/').pop();
            try {
                fileName = decodeURIComponent(fileName);
            } catch (e) {
                console.error('Error decoding filename:', e);
            }
            
            const path = file.startsWith('/') ? file : `/${file}`;
            fileUrl = `${origin}${path}`;
        } 

        // Case 2: File is a File object
        else if (file instanceof File) {
            fileName = file.name;
            fileUrl = URL.createObjectURL(file);
        } 

        // Case 3: File is an object with properties
        else if (file && typeof file === 'object') {
            if (file.url) {
                fileName = file.name || file.url.split('/').pop();
                try {
                    fileName = decodeURIComponent(fileName);
                } catch (e) {
                    console.error('Error decoding filename:', e);
                }
                
                // Convert to absolute URL 
                if (file.url.startsWith('http')) {
                    fileUrl = file.url;
                } else {
                    // Relative path 
                    const path = file.url.startsWith('/') ? file.url : `/${file.url}`;
                    fileUrl = `${origin}${path}`;
                }
            } else {
                fileName = file.name || 'Attachment';
                fileUrl = `${origin}/storage/rfq-attachments/${fileName}`;
            }
        }
        
        console.log('FileDisplay final URL:', { 
            origin,
            fileName, 
            fileUrl 
        });
        
        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon 
                    className="h-6 w-6 text-blue-500 cursor-pointer hover:text-blue-700" 
                    onClick={() => {
                        if (fileUrl) {
                            console.log("Opening file URL:", fileUrl);
                            window.open(fileUrl, '_blank');
                        }
                    }}
                />
                {fileName && (
                    <span 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                        onClick={() => {
                            if (fileUrl) {
                                console.log("Opening file URL:", fileUrl);
                                window.open(fileUrl, '_blank');
                            }
                        }}
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
                <form onSubmit={handleSaveAndSubmit}>
                    {/* Info Grid */}
                    <div className="bg-blue-50 rounded-lg p-6 grid grid-cols-2 gap-6 shadow-md text-lg">
                        {/* Left Column */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                            <span className="font-medium text-gray-600">Organization Email:</span>
                            <input
                                type="email"
                                value={formData.organization_email}
                                onChange={(e) => handleFormInputChange('organization_email', e.target.value)}
                                className="text-black bg-blue-50 focus:ring-0 w-full outline-none border-none text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">City:</span>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleFormInputChange('city', e.target.value)}
                                className="text-black bg-blue-50 focus:ring-0 w-full outline-none border-none text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">Category:</span>
                            <div className="relative ml-3">
                            <select
                                value={formData.category_id || ""}
                                onChange={(e) => handleFormInputChange('category_id', e.target.value)}
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 focus:ring-0 w-64 appearance-none pl-0 pr-6 cursor-pointer outline-none border-none"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((category) => (
                                <option 
                                    key={category.id} 
                                    value={category.id.toString()} 
                                    className="text-[#009FDC] bg-blue-50"
                                >
                                    {category.name}
                                </option>
                                ))}
                            </select>
                            </div>

                            <span className="font-medium text-gray-600">Warehouse:</span>
                            <div className="relative ml-3">
                            <select
                                value={formData.warehouse_id || ""}
                                onChange={(e) => handleFormInputChange('warehouse_id', e.target.value)}
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 focus:ring-0 w-64 appearance-none pl-0 pr-6 cursor-pointer outline-none border-none"
                                required
                            >
                                <option value="">Select Warehouse</option>
                                {warehouses.map((warehouse) => (
                                <option 
                                    key={warehouse.id} 
                                    value={warehouse.id.toString()} 
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
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-40 ml-2 text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">Closing Date:</span> 
                            <input
                                type="date"
                                value={formData.closing_date}
                                onChange={(e) => handleFormInputChange('closing_date', e.target.value)}
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-40 ml-2 text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">RFQ#:</span> 
                            <input
                                type="text"
                                value={formData.rfq_id}
                                onChange={(e) => handleFormInputChange('rfq_id', e.target.value)}
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-full ml-2 text-lg"
                                readOnly={!isEditing} 
                                placeholder={isEditing ? "" : "Auto-generated by system"}
                                required={isEditing}
                            />

                            <span className="font-medium text-gray-600">Payment Type:</span>
                            <div className="relative ml-5"> 
                            <select
                                value={formData.payment_type || ""}
                                onChange={(e) => handleFormInputChange('payment_type', e.target.value)}
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 focus:ring-0 w-64 appearance-none pl-0 pr-6 cursor-pointer outline-none border-none"
                                required
                            >
                                <option value="">Select Payment Type</option>
                                {paymentTypes.map((type) => (
                                <option 
                                    key={type.id} 
                                    value={type.id.toString()} 
                                    className="text-[#009FDC] bg-blue-50"
                                >
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
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-full ml-2 text-lg"
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
                                        <textarea
                                            value={item.item_name || ''}
                                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal text-center min-h-[3rem] resize-none overflow-hidden"
                                            style={{ background: 'none', outline: 'none', textAlign: 'center' }}
                                            rows={1}
                                            required
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <textarea
                                            value={item.description || ''}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal text-center min-h-[3rem] resize-none overflow-hidden"
                                            style={{ 
                                                background: 'none', 
                                                outline: 'none', 
                                                textAlign: 'center',
                                                wordWrap: 'break-word',
                                                whiteSpace: 'normal'
                                            }}
                                            rows="1"
                                            required
                                            onInput={(e) => {
                                                e.target.style.height = 'auto';  // Reset height
                                                e.target.style.height = `${e.target.scrollHeight}px`;  // Adjust height dynamically
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                    <select
                                        value={item.unit_id || ''}
                                        onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                                        className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent cursor-pointer"
                                        style={{
                                            background: 'none',
                                            outline: 'none',
                                            textAlign: 'center',
                                            paddingRight: '1rem',
                                            appearance: 'none' /* Removes default dropdown arrow in most browsers */
                                        }}
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
                                        className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none"
                                        style={{
                                            background: 'none',
                                            outline: 'none',
                                            textAlign: 'center',
                                        }}
                                        required
                                        onWheel={(e) => e.target.blur()} // Prevents changing value with mouse scroll
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
                                    <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center justify-center w-full">
                                        <FileDisplay 
                                            file={item.attachment} 
                                            onFileClick={(url) => window.open(url, '_blank')}
                                        />
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
                                    <td className="px-8 py-3 whitespace-nowrap text-right pl-2"> {/* Adjusted alignment */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-600 hover:text-red-900 ml-2" // Added margin to move it right
                                            disabled={formData.items.length <= 1}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
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