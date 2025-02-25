import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { PaperClipIcon, DocumentTextIcon, DocumentArrowDownIcon, EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function AddQuotationForm({ auth }) {
    const [formData, setFormData] = useState({
        organization_email: '',
        city: '',
        category_name: '',
        warehouse: '',
        issue_date: '',
        closing_date: '',
        rfq_id: '',
        payment_type: '',
        contact_no: '',
        items: []
    });

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [brands, setBrands] = useState([]);
    const [attachments, setAttachments] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    warehousesRes,
                    categoriesRes,
                    paymentTypesRes,
                    unitsRes,
                    brandsRes
                ] = await Promise.all([
                    axios.get(route('api.warehouses.index')),
                    axios.get(route('api.categories.index')),
                    axios.get(route('api.payment-types.index')),
                    axios.get(route('api.units.index')),
                    axios.get(route('api.brands.index'))
                ]);

                setWarehouses(warehousesRes.data.data);
                setCategories(categoriesRes.data.data);
                setPaymentTypes(paymentTypesRes.data.data);
                setUnits(unitsRes.data.data);
                setBrands(brandsRes.data.data);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formDataObj = new FormData();
        
        // Append main form fields
        Object.keys(formData).forEach(key => {
            if (key !== 'items') {
                formDataObj.append(key, formData[key]);
            }
        });

        // Append items and their attachments
        formData.items.forEach((item, index) => {
            Object.keys(item).forEach(key => {
                formDataObj.append(`items[${index}][${key}]`, item[key]);
            });
            
            if (attachments[index]) {
                formDataObj.append(`items[${index}][attachment]`, attachments[index]);
            }
        });

        router.post(route('rfq.store'), formDataObj, {
            forceFormData: true,
            onSuccess: () => {
                router.visit(route('rfq.index'));
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            }
        });
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                item_name: '',
                description: '',
                unit: '---',
                quantity: '',
                brand: '---',
                attachment: null,
                expected_delivery_date: ''
            }]
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachments(prev => ({
                ...prev,
                [index]: file
            }));
            handleItemChange(index, 'attachment', file.name);
        }
    };

    const handleCSVUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            // Handle CSV file upload
        } else {
            alert('Please upload a valid CSV file.');
        }
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
        setAttachments(prev => {
            const newAttachments = { ...prev };
            delete newAttachments[index];
            return newAttachments;
        });
    };

    const handleSave = () => {
        router.post(route('quotations.store'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                // Show success message or redirect
            },
        });
    };

    const handleDownloadPDF = async () => {
        try {
            // First save the quotation if it hasn't been saved
            if (!formData.id) {
                await handleSave();
            }

            // Download PDF
            const response = await axios.get(route('quotations.pdf', formData.id), {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RFQ-${formData.rfq_number}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            // You might want to show an error message to the user
        }
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
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>

                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6 space-x-4">
                    <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2">
                        <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Purchases</Link>
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <Link href="/rfq" className="hover:text-[#009FDC] text-xl">RFQs</Link>
                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <span className="text-[#009FDC] text-xl">New RFQ Request</span>
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
                        <h2 className="text-xl font-semibold">Request for a Quotation</h2>
                        <p className="text-gray-500 text-sm">Share Requirements and Receive Tailored Estimates</p>
                    </div>
                    <img src="/images/MCTC Logo.png" alt="Maharat Logo" className="h-12" />
                </div>

                {/* Info Grid */}
                <div className="bg-blue-50 rounded-lg p-6 grid grid-cols-2 gap-6 shadow-md text-lg">
                    {/* Left Column */}
                    <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                        <span className="font-medium text-gray-600">Organization Email:</span> 
                        <span className="text-black">{formData.organization_email}</span>

                        <span className="font-medium text-gray-600">City:</span> 
                        <span className="text-black">{formData.city}</span>

                        <span className="font-medium text-gray-600">Category Name:</span> 
                        <div className="relative w-full">
                            <select
                                value={formData.category_name}
                                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none outline-none focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                style={{ colorScheme: "light" }}
                            >
                                {categories.map(category => (
                                    <option key={category.id} value={category.name} className="text-[#009FDC] bg-blue-50">
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="font-medium text-gray-600">Warehouse:</span> 
                        <div className="relative w-full">
                            <select
                                value={formData.warehouse}
                                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none outline-none focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                style={{ colorScheme: "light" }}
                            >
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.name} className="text-[#009FDC] bg-blue-50">
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

                        <span className="font-medium text-gray-600">RFQ-ID:</span> 
                        <span className="text-black">{formData.rfq_id}</span>

                        <span className="font-medium text-gray-600">Payment Type:</span> 
                        <div className="relative w-full">
                            <select
                                value={formData.payment_type}
                                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                className="text-lg text-[#009FDC] font-medium bg-blue-50 border-none outline-none focus:ring-0 w-full appearance-none pl-0 pr-6 cursor-pointer"
                                style={{ colorScheme: "light" }}
                            >
                                {paymentTypes.map(type => (
                                    <option key={type.id} value={type.name} className="text-[#009FDC] bg-blue-50">
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="font-medium text-gray-600">Contact No#:</span> 
                        <span className="text-black">{formData.contact_no}</span>
                    </div>
                </div>

                {/* Item Table */}
                <table className="w-full mt-4 table-fixed border-collapse">
                <thead style={{ backgroundColor: '#C7E7DE' }} className="rounded-t-lg">
                    <tr>
                        <th className="px-2 py-2 text-center w-[10%]">Item Name</th>
                        <th className="px-2 py-2 text-center w-[11%]">Description</th>
                        <th className="px-2 py-2 text-center w-[7%]">Unit</th>
                        <th className="px-2 py-2 text-center w-[7%]">Quantity</th>
                        <th className="px-2 py-2 text-center w-[10%]">Brand</th>
                        <th className="px-2 py-2 text-center w-[10%]">Attachment</th>
                        <th className="px-2 py-2 text-center w-[15%]">Expected Delivery Date</th>
                        <th className="px-2 py-2 text-center w-[6%]">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {formData.items.map((item, index) => (
                        <tr key={index} className="border-b text-center">
                            <td className="px-2 py-2">
                                <input
                                    type="text"
                                    value={item.item_name}
                                    onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index].item_name = e.target.value;
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 text-center"
                                />
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index].description = e.target.value;
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 text-center break-words whitespace-normal"
                                />
                            </td>
                            <td className="px-2 py-2">
                                <select
                                    value={item.unit}
                                    onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index].unit = e.target.value;
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 text-center"
                                >
                                    <option value="---">---</option>
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.name}>{unit.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index].quantity = Math.max(0, parseInt(e.target.value) || 0);
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 text-center"
                                />
                            </td>
                            <td className="px-2 py-2">
                                <select
                                    value={item.brand}
                                    onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index].brand = e.target.value;
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 text-center"
                                >
                                    <option value="---">---</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-2 py-2 flex items-center justify-center">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file && file.type === "application/pdf") {
                                            const newItems = [...formData.items];
                                            newItems[index].attachment = file.name;
                                            setFormData({ ...formData, items: newItems });
                                        } else {
                                            alert("Only PDF files are allowed.");
                                        }
                                    }}
                                    className="hidden"
                                    id={`fileInput-${index}`}
                                />
                                <label htmlFor={`fileInput-${index}`} className="cursor-pointer text-blue-600 flex items-center space-x-2">
                                    <PaperClipIcon className="h-5 w-5 relative top-3" />
                                    {item.attachment && <span className="text-sm text-gray-600 relative top-3">{item.attachment}</span>}
                                </label>
                            </td>
                            <td className="px-2 py-2 text-center">
                            <div className="relative flex justify-center items-center">
                                <input
                                    type="date"
                                    value={item.expected_delivery_date
                                        ?.split('/').reverse().join('-') || ''} // Convert DD/MM/YYYY -> YYYY-MM-DD for the input
                                    onChange={(e) => {
                                        if (!e.target.value) return;

                                        const [year, month, day] = e.target.value.split('-');
                                        const formattedDate = `${day}/${month}/${year}`; // Convert back to DD/MM/YYYY

                                        const newItems = [...formData.items];
                                        newItems[index].expected_delivery_date = formattedDate;
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="bg-transparent border border-gray-300 rounded-md px-2 py-1 text-center text-sm 
                                            appearance-none focus:ring-0 focus:outline-none focus:border-transparent 
                                            active:outline-none active:ring-0 border-none"
                                />
                            </div>
                        </td>

                            <td className="px-2 py-2">
                                <button
                                    onClick={() => {
                                        const newItems = [...formData.items];
                                        newItems.splice(index, 1);
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="text-red-600"
                                >
                                    Delete
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
                        Save Quotation
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
                        Send Quotation by Mail
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}