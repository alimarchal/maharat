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

export const RequestItemsProvider = ({ children }) => {
    const [requestItems, setRequestItems] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const updateRequestItemStatus = async (itemId) => {
        try {
            await axios.put(`/api/v1/request-item/${itemId}`, {
                is_added: true,
            });
            await fetchRequestItems();
        } catch (err) {
            console.error("Error updating request item:", err);
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
        ? requestItems.data.filter((item) => item.is_added === false).length
        : 0;

    useEffect(() => {
        fetchRequestItems();
    }, []);

    const value = {
        requestItems,
        pendingCount,
        loading,
        fetchRequestItems,
        updateRequestItemStatus,
        addNewRequestItem,
    };

    return (
        <RequestItemsContext.Provider value={value}>
            {children}
        </RequestItemsContext.Provider>
    );
};
