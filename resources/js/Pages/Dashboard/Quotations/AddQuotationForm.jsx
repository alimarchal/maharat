import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { FaChevronRight } from 'react-icons/fa';

export default function AddQuotationForm({ auth }) {
    const [formData, setFormData] = useState({
        organization_email: 'info@maharat.com',
        city: 'Nuariyah',
        category_name: 'Furniture',
        warehouse: 'مستودع حي النخيل',
        issue_date: '05 Jan 2025',
        closing_date: '15 Jan 2025',
        rfq_id: '1234567',
        payment_type: 'Cash',
        contact_no: '580647619',
        items: [
            {
                item_name: 'Sofa',
                description: 'Three Seat Sofa',
                unit: '---',
                quantity: '01',
                brand: '---',
                attachment: null,
                expected_delivery_date: '08-Jan-2025'
            },
            {
                item_name: 'Chair',
                description: 'Office Chair',
                unit: '---',
                quantity: '01',
                brand: '---',
                attachment: null,
                expected_delivery_date: '08-Jan-2025'
            }
        ]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('quotations.store'), formData, {
            forceFormData: true,
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

    const handleCSVUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            // Handle CSV file upload
        } else {
            alert('Please upload a valid CSV file.');
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Quotation" />

            <div className="p-6">
            <button onClick={() => router.get(route('rfq'))} className="text-black">
                            ← Back
            </button>
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <span onClick={() => router.get(route('dashboard'))} className="text-gray-500 cursor-pointer">Home</span>
                        <FaChevronRight className="text-gray-400" />
                        <span onClick={() => router.get(route('rfq'))} className="text-gray-500 cursor-pointer">Requests</span>
                        <FaChevronRight className="text-gray-400" />
                        <span className="text-blue-600">Make a New Request</span>
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
                    <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                        <span className="font-medium text-gray-600">Organization Email:</span> 
                        <span className="text-gray-800">{formData.organization_email}</span>

                        <span className="font-medium text-gray-600">City:</span> 
                        <span className="text-gray-800">{formData.city}</span>

                        <span className="font-medium text-gray-600">Category Name:</span> 
                        <select
                            value={formData.category_name}
                            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                            className="text-gray-800 appearance-none bg-transparent border-none focus:ring-0 cursor-pointer"
                        >
                            <option>Furniture</option>
                        </select>

                        <span className="font-medium text-gray-600">Warehouse:</span> 
                        <select
                            value={formData.warehouse}
                            onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                            className="text-gray-800 appearance-none bg-transparent border-none focus:ring-0 cursor-pointer"
                        >
                            <option>مستودع حي النخيل</option>
                        </select>
                    </div>

                    {/* Right Column */}
                    <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                        <span className="font-medium text-gray-600">Issue Date:</span> 
                        <span className="text-gray-800">{formData.issue_date}</span>

                        <span className="font-medium text-gray-600">Closing Date:</span> 
                        <span className="text-gray-800">{formData.closing_date}</span>

                        <span className="font-medium text-gray-600">RFQ-ID:</span> 
                        <span className="text-gray-800">{formData.rfq_id}</span>

                        <span className="font-medium text-gray-600">Payment Type:</span> 
                        <select
                            value={formData.payment_type}
                            onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                            className="text-gray-800 appearance-none bg-transparent border-none focus:ring-0 cursor-pointer"
                        >
                            <option>Cash</option>
                        </select>

                        <span className="font-medium text-gray-600">Contact No#:</span> 
                        <span className="text-gray-800">{formData.contact_no}</span>
                    </div>
                </div>

                {/* Space for Table */}
                <div className="mt-4"></div>

                        {/* Items Table */}
                        <table className="w-full">
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
                                        <td className="px-4 py-2 text-gray-700">{item.unit}</td>
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
                                        <td className="px-4 py-2 text-gray-700">{item.brand}</td>
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
                                className="px-4 py-2 bg-blue-600 text-white rounded-full"
                            >
                                Send Quotation by Mail
                            </button>
                        </div>
                        </div>
        </AuthenticatedLayout>
    );
}