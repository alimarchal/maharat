import React, { useState } from 'react';
import { useRfqRequests } from '@/Components/RfqRequestsContext';

const RfqRequestsTable = ({ onSelectRfqRequest }) => {
    const { pendingCount, getPendingRfqRequests, loading } = useRfqRequests();
    const [showTable, setShowTable] = useState(false);
    const pendingRequests = getPendingRfqRequests();

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-medium text-[#6E66AC] flex items-center">
                    RFQ Requests ({pendingCount})
                </h3>
                <button
                    onClick={() => setShowTable(!showTable)}
                    className="text-[#009FDC] hover:text-[#007CB8] font-medium"
                >
                    {showTable ? 'Hide' : 'Show'} RFQ Requests
                </button>
            </div>
            {showTable && (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">ID</th>
                                <th className="py-3 px-4">Item Name</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Quantity</th>
                                <th className="py-3 px-4">Requested Date</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D7D8D9] text-base font-medium text-center text-[#2C323C]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-3 px-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : pendingRequests.length > 0 ? (
                                pendingRequests.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 px-4">{item.id}</td>
                                        <td className="py-3 px-4">{item.name}</td>
                                        <td className="py-3 px-4">{item.description || 'No description'}</td>
                                        <td className="py-3 px-4">{item.quantity}</td>
                                        <td className="py-3 px-4">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                            <button
                                                onClick={() => onSelectRfqRequest(item)}
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#009FDC] text-white hover:bg-[#007CB8] transition-colors"
                                            >
                                                Make RFQ
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-3 px-4 text-sm text-gray-500 text-center">
                                        No RFQ requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RfqRequestsTable; 