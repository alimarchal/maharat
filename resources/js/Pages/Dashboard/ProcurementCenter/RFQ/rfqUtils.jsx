import axios from "axios";

/**
 * Safely retrieves a value from an object, returning a default value if not found
 */
export const getSafeValue = (obj, key, defaultValue = '') => {
    if (!obj || obj[key] === undefined || obj[key] === null) {
        return defaultValue;
    }
    return obj[key];
};

/**
 * Fetches RFQ data for editing mode
 * @param {string|number} rfqId - The ID of the RFQ to fetch
 * @param {Function} setFormData - State setter for form data
 * @param {Function} setIsEditing - State setter for editing mode
 * @param {Function} setLoading - State setter for loading state
 * @param {Function} setError - State setter for error state
 */
export const fetchRFQData = async (rfqId, setFormData, setIsEditing, setLoading, setError) => {
    try {
        setLoading(true);
        console.log("Fetching RFQ data for ID:", rfqId);
        
        // Fetch RFQ main data
        const rfqResponse = await axios.get(`/api/v1/rfqs/${rfqId}`);
        let rfqData = rfqResponse.data?.data;
        
        if (!rfqData) {
            setError("RFQ not found or has invalid data format");
            setLoading(false);
            return;
        }
        
        // Log the raw data to check the actual values
        console.log("Raw RFQ data from API:", rfqData);
        
        setIsEditing(true);
        
        // Fetch RFQ items
        let rfqItemsData = [];
        try {
            const rfqItemsResponse = await axios.get(`/api/v1/rfq-items?rfq_id=${rfqId}`);
            rfqItemsData = rfqResponse.data?.data?.items || rfqItemsResponse.data?.data || [];
            console.log("RFQ items data:", rfqItemsData);
        } catch (itemsError) {
            console.error("Error fetching RFQ items:", itemsError);
        }
        
        // Get category ID from the response data - Convert to string to ensure proper comparison in dropdowns
        let categoryId = null;
        
        // Check if category_id is directly available
        if (rfqData.category_id) {
            categoryId = String(rfqData.category_id);
        } 
        // Check if categories is available as a relationship
        else if (rfqData.categories && rfqData.categories.length > 0) {
            categoryId = String(rfqData.categories[0].id);
        }
        // If still not found, check for categories via a separate API call
        else {
            try {
                const categoryResponse = await axios.get(`/api/v1/rfq-categories/${rfqId}`);
                if (categoryResponse.data && categoryResponse.data.data && categoryResponse.data.data.length > 0) {
                    categoryId = String(categoryResponse.data.data[0].category_id);
                }
            } catch (categoryError) {
                console.warn("Could not fetch category info:", categoryError);
            }
        }
        
        // Format the data for the form, with explicit type conversion
        const formattedData = {
            organization_email: getSafeValue(rfqData, 'organization_email'),
            city: getSafeValue(rfqData, 'city'),
            category_id: categoryId,
            warehouse_id: String(getSafeValue(rfqData, 'warehouse_id')),
            issue_date: getSafeValue(rfqData, 'request_date')?.split('T')[0] || new Date().toISOString().split('T')[0],
            closing_date: getSafeValue(rfqData, 'closing_date')?.split('T')[0] || '',
            rfq_id: getSafeValue(rfqData, 'rfq_number', `RFQ-${new Date().getFullYear()}-`),
            payment_type: String(getSafeValue(rfqData, 'payment_type')),
            contact_no: getSafeValue(rfqData, 'contact_number'),
            status_id: String(getSafeValue(rfqData, 'status_id', 47))
        };
        
        console.log("Formatted form data with converted IDs:", formattedData);
        
        // Format items or provide a default empty item
        formattedData.items = rfqItemsData.length > 0 
            ? rfqItemsData.map(item => {
                // Create enhanced file object if attachment exists
                let attachmentObj = null;
                if (item.attachment) {
                    attachmentObj = {
                        attachment: item.attachment,
                        specifications: item.specifications || basename(item.attachment) // Original filename or extract from path
                    };
                }
                
                return {
                    id: getSafeValue(item, 'id'),
                    item_name: getSafeValue(item, 'item_name'),
                    description: getSafeValue(item, 'description'),
                    unit_id: String(getSafeValue(item, 'unit_id')), // Convert to string
                    quantity: getSafeValue(item, 'quantity'),
                    brand_id: String(getSafeValue(item, 'brand_id')), // Convert to string
                    attachment: attachmentObj || getSafeValue(item, 'attachment'),
                    specifications: getSafeValue(item, 'specifications'),
                    expected_delivery_date: getSafeValue(item, 'expected_delivery_date')?.split('T')[0] || '',
                    rfq_id: rfqId,
                    status_id: String(getSafeValue(item, 'status_id', 47)) // Convert to string
                };
            }) 
            : [{
                item_name: "",
                description: "",
                unit_id: "",
                quantity: "",
                brand_id: "",
                attachment: null,
                specifications: "",
                expected_delivery_date: "",
                rfq_id: rfqId,
                status_id: "47"
            }];
            
        console.log("Final form data to be set:", formattedData);
        setFormData(formattedData);
        setLoading(false);
    } catch (error) {
        console.error("Error fetching RFQ data:", error);
        setError("Failed to load RFQ data: " + (error.response?.data?.message || error.message || "Unknown error"));
        setLoading(false);
        
        // Initialize with default values if we can't get the existing RFQ
        setFormData({
            organization_email: "",
            city: "",
            category_id: "",
            warehouse_id: "",
            issue_date: new Date().toISOString().split('T')[0],
            closing_date: "",
            rfq_id: `RFQ-${new Date().getFullYear()}-`,
            payment_type: "",
            contact_no: "",
            items: [{
                item_name: "",
                description: "",
                unit_id: "",
                quantity: "",
                brand_id: "",
                attachment: null,
                specifications: "",
                expected_delivery_date: "",
                status_id: "47"
            }],
            status_id: "47",
        });
    }
};

// Helper to extract filename from path
function basename(path) {
    return path.split('/').pop();
}

/**
 * Fetches all lookup data needed for the form (units, brands, categories, etc.)
 */
export const fetchLookupData = async (
    setLoading, 
    setError, 
    setUnits, 
    setBrands, 
    setCategories, 
    setWarehouses, 
    setPaymentTypes, 
    setUnitNames, 
    setBrandNames
) => {
    try {
        setLoading(true);
        
        // Define the API endpoints to fetch
        const endpoints = [
            { name: 'units', url: '/api/v1/units' },
            { name: 'brands', url: '/api/v1/brands' },
            { name: 'categories', url: '/api/v1/product-categories' },
            { name: 'warehouses', url: '/api/v1/warehouses' },
            { name: 'statuses', url: '/api/v1/statuses' },
        ];

        // Fetch each endpoint and handle potential errors individually
        const results = await Promise.all(
            endpoints.map(async (endpoint) => {
                try {
                    const response = await axios.get(endpoint.url);
                    return { 
                        name: endpoint.name,
                        data: response.data?.data || [] 
                    };
                } catch (error) {
                    console.warn(`Failed to fetch ${endpoint.name}:`, error);
                    return { name: endpoint.name, data: [] };
                }
            })
        );

        // Apply results to state
        results.forEach(result => {
            switch(result.name) {
                case 'units':
                    setUnits(result.data);
                    
                    // Create lookup map for units
                    const unitLookup = {};
                    result.data.forEach(unit => {
                        if (unit && unit.id) {
                            unitLookup[unit.id] = unit.name;
                        }
                    });
                    setUnitNames(unitLookup);
                    break;
                    
                case 'brands':
                    setBrands(result.data);
                    
                    // Create lookup map for brands
                    const brandLookup = {};
                    result.data.forEach(brand => {
                        if (brand && brand.id) {
                            brandLookup[brand.id] = brand.name;
                        }
                    });
                    setBrandNames(brandLookup);
                    break;
                    
                case 'categories':
                    setCategories(result.data);
                    break;
                    
                case 'warehouses':
                    setWarehouses(result.data);
                    break;
                
                case 'statuses':
                    // Filter payment types from statuses
                    const paymentTypes = result.data.filter(
                        status => status.type === 'payment_type' || status.type?.includes('payment')
                    );
                    setPaymentTypes(paymentTypes.length > 0 ? paymentTypes : result.data.slice(0, 3));
                    break;
                    
                default:
                    break;
            }
        });

        setLoading(false);
    } catch (error) {
        console.error('Error fetching lookup data:', error);
        setError('Failed to load reference data. Some options may be unavailable.');
        
        // Set empty arrays for all data to prevent further errors
        setUnits([]);
        setBrands([]);
        setCategories([]);
        setWarehouses([]);
        setPaymentTypes([]);
        setUnitNames({});
        setBrandNames({});
        
        setLoading(false);
    }
};

/**
 * Formats a file for display
 * @param {Object|string} file - File object or file path
 * @returns {Object} - Formatted file information
 */
export const formatFileForDisplay = (file) => {
    if (!file) return null;
    
    let fileName, fileUrl;
    
    if (typeof file === 'object') {
        fileName = file.name;
        fileUrl = file.tempUrl || null;
    } else if (typeof file === 'string') {
        fileName = file.split('/').pop();
        fileUrl = `/download/${encodeURIComponent(fileName)}`;
    }
    
    return { fileName, fileUrl };
};

/**
 * Gets a new unique RFQ number
 * @returns {Promise<string>} - A unique RFQ number
 */
export const getNewRfqNumber = async () => {
    try {
        const response = await axios.get('/api/v1/rfqs/form-data');
        return response.data?.rfq_number || `RFQ-${new Date().getFullYear()}-0001`;
    } catch (error) {
        console.error('Error fetching new RFQ number:', error);
        return `RFQ-${new Date().getFullYear()}-0001`;
    }
};