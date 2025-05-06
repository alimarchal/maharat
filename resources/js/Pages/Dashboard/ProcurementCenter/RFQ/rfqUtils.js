import axios from 'axios';

// Format a date string to DD/MM/YYYY
export function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original string if invalid date
    
    // Format as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Get safe value from potentially undefined object
export function getSafeValue(obj, path, defaultValue = "") {
    try {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === undefined || result === null) return defaultValue;
            result = result[key];
        }
        return result === undefined || result === null ? defaultValue : result;
    } catch (error) {
        return defaultValue;
    }
}

// Fetch RFQ data by ID
export async function fetchRFQData(id) {
    try {
        const response = await axios.get(`/api/v1/rfqs/${id}`);
        return response.data?.data;
    } catch (error) {
        console.error("Error fetching RFQ data:", error);
        throw error;
    }
}

// Fetch common lookup data
export async function fetchLookupData() {
    try {
        const [
            categoriesResponse,
            warehousesResponse,
            unitsResponse,
            brandsResponse,
            statusesResponse
        ] = await Promise.all([
            axios.get("/api/v1/product-categories"),
            axios.get("/api/v1/warehouses"),
            axios.get("/api/v1/units"),
            axios.get("/api/v1/brands"),
            axios.get("/api/v1/statuses"),
        ]);
        
        return {
            categories: categoriesResponse.data?.data || [],
            warehouses: warehousesResponse.data?.data || [],
            units: unitsResponse.data?.data || [],
            brands: brandsResponse.data?.data || [],
            statuses: statusesResponse.data?.data || []
        };
    } catch (error) {
        console.error("Error fetching lookup data:", error);
        throw error;
    }
} 