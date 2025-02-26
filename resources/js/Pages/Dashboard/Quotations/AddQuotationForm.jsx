import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { router, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { DocumentTextIcon, DocumentArrowDownIcon, EnvelopeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight, } from "@fortawesome/free-solid-svg-icons";

export default function AddQuotationForm({ auth, quotationId = null }) {
    const [formData, setFormData] = useState({
        organization_email: "",
        city: "",
        category_name: "",
        warehouse: "",
        issue_date: "",
        closing_date: "",
        rfq_id: "",
        payment_type: "",
        contact_no: "",
        items: [],
    });

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [brands, setBrands] = useState([]);
    const [attachments, setAttachments] = useState({});
    const [rfqs, setRfqs] = useState([]);
    const [unitNames, setUnitNames] = useState({});
    const [brandNames, setBrandNames] = useState({});
    const [editingRow, setEditingRow] = useState(null);
    const [rfqItems, setRfqItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    rfqsResponse, 
                    warehousesRes, 
                    categoriesRes, 
                    statusesRes,
                    unitsRes, 
                    brandsRes
                ] = await Promise.all([
                    axios.get('/api/v1/rfqs'),
                    axios.get('/api/v1/warehouses'),
                    axios.get('/api/v1/product-categories'),
                    axios.get('/api/v1/statuses'),
                    axios.get('/api/v1/units'),
                    axios.get('/api/v1/brands')
                ]);

                // Set RFQs data
                if (rfqsResponse.data.data.length > 0) {
                    const rfq = rfqsResponse.data.data[0];
                    setFormData({
                        ...formData,
                        organization_email: rfq.organization_email,
                        city: rfq.city,
                        rfq_id: rfq.rfq_number,
                        issue_date: rfq.request_date?.split('T')[0] || '',
                        closing_date: rfq.closing_date?.split('T')[0] || '',
                        contact_no: rfq.contact_number,
                        items: rfq.items || []
                    });
                }
                
                // Filter payment types from statuses
                const paymentTypes = statusesRes.data.data.filter(
                    status => status.type === 'payment_type'
                );
                
                setWarehouses(warehousesRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
                setPaymentTypes(paymentTypes);
                setUnits(unitsRes.data.data || []);
                setBrands(brandsRes.data.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get RFQ items with their relationships
                const rfqItemsResponse = await axios.get('/api/v1/rfq-items');
                setRfqItems(rfqItemsResponse.data.data);

                // Get units and brands for dropdowns
                const [unitsRes, brandsRes] = await Promise.all([
                    axios.get('/api/v1/units'),
                    axios.get('/api/v1/brands')
                ]);
                
                setUnits(unitsRes.data.data);
                setBrands(brandsRes.data.data);
                
                // Create lookup maps
                const unitLookup = {};
                unitsRes.data.data.forEach(unit => {
                    unitLookup[unit.id] = unit.name;
                });
                setUnitNames(unitLookup);

                const brandLookup = {};
                brandsRes.data.data.forEach(brand => {
                    brandLookup[brand.id] = brand.name;
                });
                setBrandNames(brandLookup);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);    

    useEffect(() => {
        if (quotationId) {
            axios.get(`/api/v1/rfq-items/${quotationId}`)
                .then(response => {
                    const item = response.data.data;
                    setFormData(prevData => ({
                        ...prevData,
                        items: [{
                            ...item,
                            unit_id: item.unit?.id,
                            brand_id: item.brand?.id,
                        }]
                    }));
                })
                .catch(error => console.error('Error fetching data:', error));
        }
    }, [quotationId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataObj = new FormData();

        // Append main form fields
        Object.keys(formData).forEach((key) => {
            if (key !== "items") {
                formDataObj.append(key, formData[key]);
            }
        });

        // Append items and their attachments
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

        router.post(route("rfq.store"), formDataObj, {
            forceFormData: true,
            onSuccess: () => {
                router.visit(route("rfq.index"));
            },
            onError: (errors) => {
                console.error("Validation errors:", errors);
            },
        });
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    item_name: "",
                    description: "",
                    unit: "---",
                    quantity: "",
                    brand: "---",
                    attachment: null,
                    expected_delivery_date: "",
                },
            ],
        }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        if (field === 'quantity') {
            // Allow empty string for typing
            if (value === '') {
                updatedItems[index][field] = '';
            } else {
                // Convert to number and prevent negative values
                const numValue = parseFloat(value);
                if (numValue < 0) return;
                // Format to 1 decimal place
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

    const handleCSVUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/csv") {
            // Handle CSV file upload
        } else {
            alert("Please upload a valid CSV file.");
        }
    };

    const handleRemoveItem = (index) => {
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
            // First save the quotation if it hasn't been saved
            if (!formData.id) {
                await handleSave();
            }

            // Option 1: View PDF in new tab
            window.open(route('quotations.pdf.view', formData.id), '_blank');

            // Option 2: Direct download
            // window.location.href = route('quotations.pdf.download', formData.id);
        } catch (error) {
            console.error('Error handling PDF:', error);
            alert('Failed to process PDF request');
        }
    };

    // Add this component for file display
    const FileDisplay = ({ file, onFileClick }) => {
        const fileName = file ? (
            typeof file === 'object' && file.name 
                ? file.name 
                : typeof file === 'string' 
                    ? decodeURIComponent(file.split('/').pop()) 
                    : file.name
        ) : null;

        const fileUrl = file ? (
            typeof file === 'object' && file.url 
                ? `/api/download/${fileName}` 
                : typeof file === 'string' 
                    ? `/api/download/${fileName}` 
                    : null
        ) : null;

        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon 
                    className="h-6 w-6 text-gray-400 cursor-pointer" 
                    onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                />
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

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Quotation" />
            <div className="min-h-screen p-6">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/dashboard")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}
                            className="mr-2 text-2xl"
                        />
                        Back
                    </button>
                </div>

                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6 space-x-4">
                    <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2">
                        <Link
                            href="/dashboard"
                            className="hover:text-[#009FDC] text-xl"
                        >
                            Home
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xl text-[#9B9DA2]"
                        />
                        <Link
                            href="/purchase"
                            className="hover:text-[#009FDC] text-xl"
                        >
                            Purchases
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xl text-[#9B9DA2]"
                        />
                        <Link
                            href="/rfq"
                            className="hover:text-[#009FDC] text-xl"
                        >
                            RFQs
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xl text-[#9B9DA2]"
                        />
                        <span className="text-[#009FDC] text-xl">
                            New RFQ Request
                        </span>
                    </div>
                    <label className="text-green-600 px-4 py-2 cursor-pointer flex items-center space-x-2 border border-green-600 rounded-lg">
                        {/* CSV Icon with Thin, Readable Text */}
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z" />
                            <path d="M13 9V3.5L18.5 9H13Z" />
                            <text x="5.5" y="16.5" fontSize="6" fontWeight="400" fill="currentColor">CSV</text>
                        </svg>
                        <span className="text-green-600">Upload CSV File</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                    </label>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Request for a Quotation
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Share Requirements and Receive Tailored Estimates
                        </p>
                    </div>
                    <img
                        src="/images/MCTC Logo.png"
                        alt="Maharat Logo"
                        className="h-12"
                    />
                </div>

                {/* Info Grid */}
                <div className="bg-blue-50 rounded-lg p-6 grid grid-cols-2 gap-6 shadow-md text-lg">
                    {/* Left Column */}
                    <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                        <span className="font-medium text-gray-600">
                            Organization Email:
                        </span>
                        <span className="text-black">
                            {formData.organization_email}
                        </span>

                        <span className="font-medium text-gray-600">City:</span>
                        <span className="text-black">{formData.city}</span>

                        <span className="font-medium text-gray-600">
                            Category Name:
                        </span>
                        <div className="relative w-full">
                            <select
                                value={formData.category_name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category_name: e.target.value,
                                    })
                                }
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none outline-none focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                style={{ colorScheme: "light" }}
                            >
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.name}
                                        className="text-[#009FDC] bg-blue-50"
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="font-medium text-gray-600">
                            Warehouse:
                        </span>
                        <div className="relative w-full">
                            <select
                                value={formData.warehouse}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        warehouse: e.target.value,
                                    })
                                }
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none outline-none focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                style={{ colorScheme: "light" }}
                            >
                                {warehouses.map((warehouse) => (
                                    <option
                                        key={warehouse.id}
                                        value={warehouse.name}
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
                        <span className="text-black">{formData.issue_date}</span>

                        <span className="font-medium text-gray-600">Closing Date:</span> 
                        <span className="text-black">{formData.closing_date}</span>

                        <span className="font-medium text-gray-600">RFQ#:</span> 
                        <span className="text-black">{formData.rfq_id}</span>

                        <span className="font-medium text-gray-600">
                            Payment Type:
                        </span>
                        <div className="relative w-full">
                            <select
                                value={formData.payment_type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        payment_type: e.target.value,
                                    })
                                }
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none outline-none focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                style={{ colorScheme: "light" }}
                            >
                                <option value="">Select Payment Type</option>
                                {paymentTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="font-medium text-gray-600">
                            Contact No#:
                        </span>
                        <span className="text-black">
                            {formData.contact_no}
                        </span>
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
                                    />
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <textarea
                                        value={item.description || ''}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal resize-none text-center"
                                        style={{ background: 'none', outline: 'none', overflow: 'hidden', textAlign: 'center' }}
                                        rows="1"
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
                                    >
                                        <option value="" className="bg-white text-gray-600 hover:text-gray-900">Select Unit</option>
                                        {units.map((unit) => (
                                            <option 
                                                key={unit.id} 
                                                value={unit.id} 
                                                className="bg-transparent text-gray-600 hover:text-gray-900"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                {unit.name}
                                            </option>
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
                                        onBlur={() => handleQuantityBlur(index)}
                                        className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm whitespace-normal text-center"
                                        style={{ background: 'none', outline: 'none', textAlign: 'center' }}
                                    />
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <select
                                        value={item.brand_id || ''}
                                        onChange={(e) => handleItemChange(index, 'brand_id', e.target.value)}
                                        className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent"
                                        style={{ background: 'none', outline: 'none', textAlign: 'center', paddingRight: '1rem' }}
                                    >
                                        <option value="" className="bg-white text-gray-600 hover:text-gray-900">Select Brand</option>
                                        {brands.map((brand) => (
                                            <option 
                                                key={brand.id} 
                                                value={brand.id} 
                                                className="bg-transparent text-gray-600 hover:text-gray-900"
                                                style={{ backgroundColor: 'transparent' }}
                                            >
                                                {brand.name}
                                            </option>
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="date"
                                        value={item.expected_delivery_date || ''}
                                        onChange={(e) => handleItemChange(index, 'expected_delivery_date', e.target.value)}
                                        className="text-sm text-gray-900 bg-transparent border-none focus:ring-0 w-full"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-red-600 hover:text-red-900"
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
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center px-4 py-2 border border-green-600 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50"
                    >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Save RFQ
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Download PDF
                    </button>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        Send RFQ by Mail
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
