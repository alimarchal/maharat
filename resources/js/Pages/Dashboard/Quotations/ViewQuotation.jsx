import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DocumentArrowDownIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ViewQuotation({ auth, quotation }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`RFQ - ${quotation.quotation_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => router.get(route('quotations.index'))} 
                                className="text-gray-600"
                            >
                                ← Back
                            </button>
                            <span className="text-gray-400 mx-2">|</span>
                            <div>
                                <span className="text-gray-500">RFQ Management</span>
                                <span className="text-gray-400 mx-2">/</span>
                                <span className="text-blue-600">View RFQ Details</span>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => {/* Handle PDF download */}}
                                className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                Download PDF
                            </button>
                            <button
                                onClick={() => {/* Handle email sending */}}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <EnvelopeIcon className="h-5 w-5 mr-2" />
                                Send Quotation by Mail
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-lg shadow">
                        {/* RFQ Information */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">RFQ Information</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Organization Email</label>
                                        <div className="text-sm font-medium">{quotation.organization_email}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">City</label>
                                        <div className="text-sm font-medium">{quotation.city}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Category Name</label>
                                        <div className="text-sm font-medium">{quotation.category_name}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Warehouse</label>
                                        <div className="text-sm font-medium">{quotation.warehouse}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Issue Date</label>
                                        <div className="text-sm font-medium">{quotation.issue_date}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Closing Date</label>
                                        <div className="text-sm font-medium">{quotation.closing_date}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">RFQ-ID</label>
                                        <div className="text-sm font-medium">{quotation.rfq_id}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Payment Type</label>
                                        <div className="text-sm font-medium">{quotation.payment_type}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Contact No#</label>
                                        <div className="text-sm font-medium">{quotation.contact_no}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold
                                            ${quotation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            quotation.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            quotation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'}`}
                                        >
                                            {quotation.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Requested Items</h2>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Delivery Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {quotation.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brand}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.expected_delivery_date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Attachments Section */}
                        {quotation.documents?.length > 0 && (
                            <div className="p-6 border-t border-gray-200">
                                <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {quotation.documents.map((doc, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />
                                            <a href={doc.file_path} className="text-blue-600 hover:underline">
                                                {doc.original_name}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 