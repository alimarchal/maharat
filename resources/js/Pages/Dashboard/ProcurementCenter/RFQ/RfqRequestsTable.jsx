import React, { useState } from 'react';
import { useRfqRequests } from '@/Components/RfqRequestsContext';
import axios from 'axios';

const RfqRequestsTable = ({ onSelectRfqRequest }) => {
    const { pendingCount, getPendingRfqRequests, loading, updateRfqRequestStatus } = useRfqRequests();
    const [showTable, setShowTable] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const pendingRequests = getPendingRfqRequests();

    const handleReject = async (item) => {
        if (!confirm('Are you sure you want to reject this RFQ request?')) {
            return;
        }

        setRejectingId(item.id);
        try {
            await axios.put(`/api/v1/rfq-requests/${item.id}`, {
                status: 'Rejected',
                rejection_reason: 'Rejected by user'
            });
            
            // Update the local state
            updateRfqRequestStatus(item.id, 'Rejected');
        } catch (error) {
            console.error('Error rejecting RFQ request:', error);
            alert('Failed to reject RFQ request. Please try again.');
        } finally {
            setRejectingId(null);
        }
    };

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
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">Item Name</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Quantity</th>
                                <th className="py-3 px-4">Requested Date</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D7D8D9] text-base font-medium text-center text-[#2C323C]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-3 px-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : pendingRequests.length > 0 ? (
                                pendingRequests.map((item) => (
                                    <tr key={item.id}>
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
                                            <button
                                                onClick={() => handleReject(item)}
                                                disabled={rejectingId === item.id}
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {rejectingId === item.id ? 'Rejecting...' : 'Reject'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-3 px-4 text-sm text-gray-500 text-center">
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