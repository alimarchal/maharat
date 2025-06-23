import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const RequestItemsContext = createContext();

export const useRequestItems = () => {
    const context = useContext(RequestItemsContext);
    if (!context) {
        throw new Error(
            "useRequestItems must be used within a RequestItemsProvider"
        );
    }
    return context;
};

export const RequestItemsProvider = ({ children, userId = null }) => {
    const [requestItems, setRequestItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [approvedItems, setApprovedItems] = useState([]);
    const [loadingApproved, setLoadingApproved] = useState(false);

    const fetchRequestItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/v1/request-item");
            setRequestItems(response.data.data || {});
        } catch (err) {
            console.error("Error fetching items:", err);
            setRequestItems({});
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedItems = async (userIdParam = null) => {
        setLoadingApproved(true);
        try {
            const params = { 
                filter: { 
                    status: "Approved",
                    is_requested: false // Only show items that haven't been requested yet
                } 
            };
            const targetUserId = userIdParam || userId;
            if (targetUserId) {
                params.filter.user_id = targetUserId;
            }
            const response = await axios.get("/api/v1/request-item", { params });
            // Extract the data array from the paginated response
            const items = response.data.data?.data || response.data.data || [];
            setApprovedItems(items);
        } catch (err) {
            console.error("Error fetching approved items:", err);
            setApprovedItems([]);
        } finally {
            setLoadingApproved(false);
        }
    };

    const updateRequestItemStatus = async (itemId, status, productId = null) => {
        try {
            const payload = {
                status: status,
                approved_by: 1, // Assuming admin user ID is 1
            };

            if (productId) {
                payload.product_id = productId;
            }

            if (status === "Approved") {
                payload.is_added = true;
            }

            await axios.put(`/api/v1/request-item/${itemId}/status`, payload);
            
            // Update local state immediately
            setRequestItems(prev => {
                if (Array.isArray(prev?.data)) {
                    return {
                        ...prev,
                        data: prev.data.map(item => 
                            item.id === itemId 
                                ? { ...item, status: status, product_id: productId, is_added: status === "Approved" }
                                : item
                        )
                    };
                }
                return prev;
            });

            // Refresh data from server
            await fetchRequestItems();
            await fetchApprovedItems(userId);
        } catch (err) {
            console.error("Error updating request item status:", err);
            throw err;
        }
    };

    const addNewRequestItem = async (itemData) => {
        try {
            const response = await axios.post(
                "/api/v1/request-item",
                itemData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            await fetchRequestItems();
            return response;
        } catch (err) {
            console.error("Error adding new request item:", err);
            throw err;
        }
    };

    const pendingCount = Array.isArray(requestItems?.data)
        ? requestItems.data.filter((item) => item.status === "Pending").length
        : 0;

    const approvedCount = Array.isArray(approvedItems) ? approvedItems.length : 0;

    useEffect(() => {
        fetchRequestItems();
        if (userId) {
            fetchApprovedItems(userId);
        }
    }, []);

    const value = {
        requestItems,
        pendingCount,
        approvedItems,
        approvedCount,
        loading,
        loadingApproved,
        fetchRequestItems,
        fetchApprovedItems,
        updateRequestItemStatus,
        addNewRequestItem,
    };

    return (
        <RequestItemsContext.Provider value={value}>
            {children}
        </RequestItemsContext.Provider>
    );
};
