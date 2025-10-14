import React, { useState, useMemo } from 'react';
import { useRfqRequests } from '@/Components/RfqRequestsContext';
import axios from 'axios';

const RfqRequestsTable = ({ onSelectRfqRequest }) => {
    const { pendingCount, getPendingRfqRequests, loading, updateRfqRequestStatus } = useRfqRequests();
    const [showTable, setShowTable] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const pendingRequests = getPendingRfqRequests();

    // Group RFQ requests by group_id
    const groupedRequests = useMemo(() => {
        const groups = {};
        
        pendingRequests.forEach(request => {
            const groupKey = request.group_id || `single-${request.id}`;
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    group_id: request.group_id,
                    group_description: request.group_description,
                    requests: [],
                    firstRequest: request
                };
            }
            
            groups[groupKey].requests.push(request);
        });
        
        return Object.values(groups);
    }, [pendingRequests]);

    const handleReject = async (group) => {
        if (!confirm(`Are you sure you want to reject this RFQ request group (${group.requests.length} items)?`)) {
            return;
        }

        setRejectingId(group.firstRequest.id);
        try {
            // Reject all requests in the group
            for (const request of group.requests) {
                await axios.put(`/api/v1/rfq-requests/${request.id}`, {
                    status: 'Rejected',
                    rejection_reason: 'Rejected by user'
                });
                
                // Update the local state
                updateRfqRequestStatus(request.id, 'Rejected');
            }

            // Update related material requests to "Rejected" status
            try {
                // Find material requests that are in "Referred" status and match this RFQ request group
                const materialRequestsResponse = await axios.get('/api/v1/material-requests', {
                    params: {
                        'filter[status_id]': '2', // Referred status
                        'filter[department_id]': group.firstRequest.department_id,
                        'filter[cost_center_id]': group.firstRequest.cost_center_id,
                        'filter[warehouse_id]': group.firstRequest.warehouse_id
                    }
                });

                const materialRequests = materialRequestsResponse.data?.data || [];
                
                // Update each matching material request to "Rejected"
                for (const materialRequest of materialRequests) {
                    await axios.put(`/api/v1/material-requests/${materialRequest.id}`, {
                        status_id: 52, // Rejected status
                        description: 'Material request rejected due to RFQ request rejection'
                    });
                }
            } catch (materialRequestError) {
                console.error('Error updating material request status:', materialRequestError);
                // Don't show error to user as the main RFQ rejection was successful
            }
        } catch (error) {
            console.error('Error rejecting RFQ request group:', error);
            alert('Failed to reject RFQ request group. Please try again.');
        } finally {
            setRejectingId(null);
        }
    };

    const handleMakeRfq = (group) => {
        // Pass the entire group to the onSelectRfqRequest function
        onSelectRfqRequest(group);
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-medium text-[#6E66AC] flex items-center">
                    RFQ Requests ({groupedRequests.length})
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
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">Item Names</th>
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
                            ) : groupedRequests.length > 0 ? (
                                groupedRequests.map((group) => (
                                    <tr key={group.group_id || group.firstRequest.id}>
                                        <td className="py-3 px-4 text-center">
                                            <div className="text-sm">
                                                {group.requests.map((req, index) => (
                                                    <div key={req.id} className="mb-1">
                                                        {req.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="text-sm">
                                                {group.requests.map((req, index) => (
                                                    <div key={req.id} className="mb-1">
                                                        {req.description || 'No description'}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="text-sm">
                                                {group.requests.map((req, index) => (
                                                    <div key={req.id} className="mb-1">
                                                        {req.quantity}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">{new Date(group.firstRequest.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex justify-center items-center space-x-3">
                                                <button
                                                    onClick={() => handleMakeRfq(group)}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#009FDC] text-white hover:bg-[#007CB8] transition-colors"
                                                >
                                                    Make RFQ
                                                </button>
                                                <button
                                                    onClick={() => handleReject(group)}
                                                    disabled={rejectingId === group.firstRequest.id}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {rejectingId === group.firstRequest.id ? 'Rejecting...' : 'Reject'}
                                                </button>
                                            </div>
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