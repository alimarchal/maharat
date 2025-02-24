import { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

export default function QuotationPDF({ quotation }) {
    const formattedDate = useMemo(() => {
        return format(new Date(quotation.issue_date), 'dd MMM yyyy');
    }, [quotation.issue_date]);

    return (
        <>
            <Head title={`RFQ - ${quotation.quotation_number}`} />

            <div className="min-h-screen bg-white p-8" id="pdf-content">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <img 
                            src="/images/logo.png" 
                            alt="Company Logo" 
                            className="h-16 w-auto"
                        />
                        <div className="mt-2">
                            <p className="text-gray-600">info@maharat.com</p>
                            <p className="text-gray-600">Nuariyah</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-gray-900">REQUEST FOR QUOTATION</h1>
                        <p className="text-gray-600 mt-2">RFQ Number: {quotation.quotation_number}</p>
                        <p className="text-gray-600">Date: {formattedDate}</p>
                    </div>
                </div>

                {/* RFQ Details */}
                <div className="mb-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">RFQ Details</h2>
                            <div className="space-y-1">
                                <p><span className="font-medium">Category:</span> {quotation.category_name}</p>
                                <p><span className="font-medium">Warehouse:</span> {quotation.warehouse}</p>
                                <p><span className="font-medium">Payment Type:</span> {quotation.payment_type}</p>
                                <p><span className="font-medium">Contact:</span> {quotation.contact_no}</p>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Important Dates</h2>
                            <div className="space-y-1">
                                <p><span className="font-medium">Issue Date:</span> {quotation.issue_date}</p>
                                <p><span className="font-medium">Closing Date:</span> {quotation.closing_date}</p>
                                <p><span className="font-medium">RFQ ID:</span> {quotation.rfq_id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Requested Items</h2>
                    <table className="min-w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    Item Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    Description
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    Unit
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    Quantity
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    Brand
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                    Expected Delivery
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.items.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.item_name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.description}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.unit}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.brand}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.expected_delivery_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Terms and Notes */}
                {(quotation.terms_and_conditions || quotation.notes) && (
                    <div className="mb-8 grid grid-cols-2 gap-8">
                        {quotation.terms_and_conditions && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Terms and Conditions</h2>
                                <p className="text-sm text-gray-600">{quotation.terms_and_conditions}</p>
                            </div>
                        )}
                        {quotation.notes && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Additional Notes</h2>
                                <p className="text-sm text-gray-600">{quotation.notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="text-center text-sm text-gray-500">
                        <p>This is a system generated RFQ document.</p>
                        <p className="mt-1">For any queries, please contact support at info@maharat.com</p>
                    </div>
                </div>
            </div>
        </>
    );
} 