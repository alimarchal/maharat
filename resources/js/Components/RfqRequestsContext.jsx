import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

const RfqRequestsContext = createContext();

export const useRfqRequests = () => {
    const context = useContext(RfqRequestsContext);
    if (!context) {
        throw new Error('useRfqRequests must be used within an RfqRequestsProvider');
    }
    return context;
};

export const RfqRequestsProvider = ({ children }) => {
    const { auth } = usePage().props;
    const user_id = auth?.user?.id;
    
    const [rfqRequests, setRfqRequests] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchRfqRequests = async (user_id) => {
        setLoading(true);
        try {
            // Remove user_id filter to show all RFQ requests for all users
            const response = await axios.get(`/api/v1/rfq-requests`);
            console.log('RFQ Requests API Response:', response.data);
            const requests = response.data.data || [];
            
            setRfqRequests(requests);
            setPendingCount(requests.filter(req => req.status === 'Pending' && !req.is_requested).length);
            setApprovedCount(requests.filter(req => req.status === 'Approved' && !req.is_requested).length);
            console.log('Filtered pending requests:', requests.filter(req => req.status === 'Pending' && !req.is_requested));
        } catch (error) {
            console.error('Error fetching RFQ requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch RFQ requests when component mounts
    useEffect(() => {
        if (user_id) {
            fetchRfqRequests(user_id);
        }
    }, [user_id]);

    const updateRfqRequestStatus = (requestId, status, rfqId = null) => {
        setRfqRequests(prev => 
            prev.map(req => 
                req.id === requestId 
                    ? { 
                        ...req, 
                        status, 
                        rfq_id: status === 'Approved' ? rfqId : req.rfq_id,
                        approved_at: status === 'Approved' ? new Date().toISOString() : req.approved_at
                    }
                    : req
            )
        );
        
        // Update counts
        if (status === 'Approved') {
            setApprovedCount(prev => prev + 1);
            setPendingCount(prev => Math.max(0, prev - 1));
        } else if (status === 'Rejected') {
            setPendingCount(prev => Math.max(0, prev - 1));
        }
    };

    const markRfqRequestAsRequested = (requestId) => {
        setRfqRequests(prev => 
            prev.map(req => 
                req.id === requestId 
                    ? { ...req, is_requested: true }
                    : req
            )
        );
        
        // Decrease approved count since it's now requested
        setApprovedCount(prev => Math.max(0, prev - 1));
    };

    const getPendingRfqRequests = () => {
        return rfqRequests.filter(req => req.status === 'Pending' && !req.is_requested);
    };

    const value = {
        rfqRequests,
        pendingCount,
        approvedCount,
        loading,
        fetchRfqRequests,
        updateRfqRequestStatus,
        markRfqRequestAsRequested,
        getPendingRfqRequests,
    };

    return (
        <RfqRequestsContext.Provider value={value}>
            {children}
        </RfqRequestsContext.Provider>
    );
}; 