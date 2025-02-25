import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";

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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [brands, setBrands] = useState([]);
    const [attachments, setAttachments] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch organization email, city, etc. from the backend
                const response = await fetch('/api/v1/form-data', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)[1],
                    },
                    credentials: 'include'
                });
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    organization_email: data.organization_email,
                    city: data.city,
                    category_name: data.category_name,
                    warehouse: data.warehouse,
                    issue_date: data.issue_date,
                    closing_date: data.closing_date,
                    rfq_id: data.rfq_id,
                    payment_type: data.payment_type,
                    contact_no: data.contact_no
                }));
    
                // Fetch warehouses
                const warehousesResponse = await fetch('/api/v1/warehouses', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)[1],
                    },
                    credentials: 'include'
                });
                const warehousesData = await warehousesResponse.json();
                setWarehouses(warehousesData.data || []);
    
                // Fetch categories
                const categoriesResponse = await fetch('/api/v1/product-categories', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)[1],
                    },
                    credentials: 'include'
                });
                const categoriesData = await categoriesResponse.json();
                setCategories(categoriesData.data || []);
    
                // Fetch payment types
                const paymentTypesResponse = await fetch('/api/v1/payment-types', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)[1],
                    },
                    credentials: 'include'
                });
                const paymentTypesData = await paymentTypesResponse.json();
                setPaymentTypes(paymentTypesData.data || []);
    
                // Fetch units
                const unitsResponse = await fetch('/api/v1/units', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)[1],
                    },
                    credentials: 'include'
                });
                const unitsData = await unitsResponse.json();
                setUnits(unitsData.data || []);
    
                // Fetch brands
                const brandsResponse = await fetch('/api/v1/brands', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)[1],
                    },
                    credentials: 'include'
                });
                const brandsData = await brandsResponse.json();
                setBrands(brandsData.data || []);
    
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load form data');
            }
        };
    
        fetchData();
    }, []);
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formDataObj = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'items') {
                formDataObj.append(key, formData[key]);
            }
        });

        formData.items.forEach((item, index) => {
            Object.keys(item).forEach(key => {
                formDataObj.append(`items[${index}][${key}]`, item[key]);
            });
            
            if (attachments[index]) {
                formDataObj.append(`items[${index}][attachment]`, attachments[index]);
            }
        });

        router.post(route('quotations.store'), formDataObj, {
            forceFormData: true,
            onSuccess: () => {
                router.visit(route('quotations.index'));
            },
            onError: (errors) => {
                console.error(errors);
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

    const deleteItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachments(prev => ({
                ...prev,
                [index]: file
            }));
            
            const newItems = [...formData.items];
            newItems[index].attachment = file.name;
            setFormData({ ...formData, items: newItems });
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

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
                    <label className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer">
                        Upload CSV File
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

                {/* Items Table */}
                <table className="w-full mt-4">
                    <thead style={{ backgroundColor: '#C7E7DE' }} className="rounded-t-lg">
                        <tr>
                            <th className="px-4 py-2 text-left first:rounded-tl-lg last:rounded-tr-lg">Item Name</th>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-left">Unit</th>
                            <th className="px-4 py-2 text-left">Quantity</th>
                            <th className="px-4 py-2 text-left">Brand</th>
                            <th className="px-4 py-2 text-left">Attachment</th>
                            <th className="px-4 py-2 text-left">Expected Delivery Date</th>
                            <th className="px-4 py-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.item_name}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].item_name = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].description = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <select
                                        value={item.unit}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].unit = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    >
                                        <option value="---">---</option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.name}>{unit.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].quantity = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <select
                                        value={item.brand}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].brand = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    >
                                        <option value="---">---</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.name}>{brand.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <button className="text-blue-600">
                                        <PaperClipIcon className="h-5 w-5" />
                                    </button>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.expected_delivery_date}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].expected_delivery_date = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <button onClick={() => deleteItem(index)} className="text-red-600">
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
                        onClick={() => {/* Handle PDF download */}}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-full"
                    >
                        Download PDF
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-full"
                    >
                        Send Quotation by Mail
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}