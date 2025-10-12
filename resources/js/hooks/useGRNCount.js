import { useState, useEffect } from 'react';

export const useGRNCount = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchGRNCount = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/v1/purchase-orders?has_good_receive_note=false&per_page=1&sort=-created_at`
            );
            const data = await response.json();
            
            if (response.ok) {
                // Get the total count from meta, fallback to data length if meta not available
                setCount(data.meta?.total || data.data?.length || 0);
            } else {
                setCount(0);
            }
        } catch (error) {
            console.error('Error fetching GRN count:', error);
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGRNCount();
        
        // Refresh count every 30 seconds
        const interval = setInterval(fetchGRNCount, 30000);
        
        return () => clearInterval(interval);
    }, []);

    return { count, loading, refreshCount: fetchGRNCount };
};