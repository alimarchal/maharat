import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faPlus, faTrash, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../Components/SelectFloating";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRequestItems } from "@/Components/RequestItemsContext";

const MakeRequest = () => {
    const { requestId } = usePage().props;
    const user_id = usePage().props.auth.user.id;
    const { approvedItems, approvedCount, fetchApprovedItems } = useRequestItems();

    const [formData, setFormData] = useState({
        requester_id: user_id || "",
        warehouse_id: "",
        expected_delivery_date: "",
        status_id: "1",
        cost_center_id: "",
        sub_cost_center_id: "",
        department_id: "",
        items: [
            {
                product_id: "",
                unit_id: "",
                category_id: "",
                quantity: "",
                urgency: "",
                photo: null,
                description: "",
            },
        ],
    });

    const [errors, setErrors] = useState({});
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [subCostCenters, setSubCostCenters] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState({});
    const [filteredSubCostCenters, setFilteredSubCostCenters] = useState({});
    const [loading, setLoading] = useState(false);
    const [processError, setProcessError] = useState("");
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isAdded, setIsAdded] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showApprovedItems, setShowApprovedItems] = useState(false);
    const [selectedApprovedItem, setSelectedApprovedItem] = useState(null);

    // Pagination states for categories and products
    const [categoriesPage, setCategoriesPage] = useState(1);
    const [categoriesHasMore, setCategoriesHasMore] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [productsPages, setProductsPages] = useState({});
    const [productsHasMore, setProductsHasMore] = useState({});
    const [loadingMoreProducts, setLoadingMoreProducts] = useState({});
    
    // Request flags to prevent multiple simultaneous calls
    const [categoriesRequestInProgress, setCategoriesRequestInProgress] = useState(false);
    const [productsRequestInProgress, setProductsRequestInProgress] = useState({});

    const resetForm = () => {
        setName('');
        setQuantity('');
        setDescription('');
        setPhoto(null);
        setPhotoPreview(null);
        setIsAdded(false);
        setSelectedApprovedItem(null);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchCategories = async (page = 1, append = false) => {
        if (loadingCategories || categoriesRequestInProgress) return;
        
        setLoadingCategories(true);
        setCategoriesRequestInProgress(true);
        try {
            const response = await axios.get(`/api/v1/product-categories?page=${page}&per_page=10`);
            const { data, meta } = response.data;
            
            if (append) {
                setCategories(prev => [...prev, ...data]);
            } else {
                setCategories(data);
            }
            
            // Check if meta exists and has pagination info
            if (meta && meta.current_page && meta.last_page) {
                setCategoriesHasMore(meta.current_page < meta.last_page);
                setCategoriesPage(meta.current_page);
            } else {
                // If no pagination meta, assume we have all data
                setCategoriesHasMore(false);
                setCategoriesPage(1);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategoriesHasMore(false);
        } finally {
            setLoadingCategories(false);
            setCategoriesRequestInProgress(false);
        }
    };

    const fetchProductsForCategory = async (categoryId, page = 1, append = false) => {
        if (!categoryId) return;
        
        if (loadingMoreProducts[categoryId] || productsRequestInProgress[categoryId]) return;
        
        setLoadingMoreProducts(prev => ({ ...prev, [categoryId]: true }));
        setProductsRequestInProgress(prev => ({ ...prev, [categoryId]: true }));
        try {
            const response = await axios.get(`/api/v1/products?filter[category_id]=${categoryId}&page=${page}&per_page=10`);
            
            const { data, meta } = response.data;
            
            if (response.data && response.data.data) {
                setFilteredProducts(prev => ({
                    ...prev,
                    [categoryId]: append ? [...(prev[categoryId] || []), ...data] : data
                }));
                
                // Check if meta exists and has pagination info
                if (meta && meta.current_page && meta.last_page) {
                    setProductsHasMore(prev => ({
                        ...prev,
                        [categoryId]: meta.current_page < meta.last_page
                    }));
                    
                    setProductsPages(prev => ({
                        ...prev,
                        [categoryId]: meta.current_page
                    }));
                } else {
                    // If no pagination meta, assume we have all data
                    setProductsHasMore(prev => ({
                        ...prev,
                        [categoryId]: false
                    }));
                    
                    setProductsPages(prev => ({
                        ...prev,
                        [categoryId]: 1
                    }));
                }
            }
        } catch (error) {
            console.error(`Error fetching products for category ${categoryId}:`, error);
            setProductsHasMore(prev => ({
                ...prev,
                [categoryId]: false
            }));
        } finally {
            setLoadingMoreProducts(prev => ({ ...prev, [categoryId]: false }));
            setProductsRequestInProgress(prev => ({ ...prev, [categoryId]: false }));
        }
    };

    const handleCategoryScroll = (e) => {
        if (loadingCategories || !categoriesHasMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 10;
        
        if (isNearBottom) {
            fetchCategories(categoriesPage + 1, true);
        }
    };

    const handleProductScroll = (categoryId, e) => {
        if (!categoryId || loadingMoreProducts[categoryId] || !productsHasMore[categoryId]) return;
        
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 10;
        
        if (isNearBottom) {
            const nextPage = (productsPages[categoryId] || 1) + 1;
            fetchProductsForCategory(categoryId, nextPage, true);
        }
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...formData.items];
        const oldCategoryId = newItems[index].category_id;
        
        newItems[index] = { ...newItems[index], [name]: value };
        
        // If category is changed, fetch products for that category and reset product selection
        if (name === 'category_id') {
            newItems[index].product_id = ""; // Reset product selection
            
            // Check if we already have products for this category
            if (!filteredProducts[value] || filteredProducts[value].length === 0) {
            fetchProductsForCategory(value);
            }
        }
        
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setProcessError(""); // Clear any previous process errors

        try {
            const url = requestId
                ? `/api/v1/material-requests/${requestId}`
                : "/api/v1/material-requests";
            const method = requestId ? "put" : "post";

            // Add user_id and is_added to each item
            const formDataWithUser = {
                ...formData,
                items: formData.items.map(item => ({
                    ...item,
                    user_id: user_id,
                    is_added: false
                }))
            };

            const materialRequest = await axios[method](url, formDataWithUser);
            const materialRequestId = materialRequest.data.data.id;

            // Fetch the Material Request process
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Material Request"
            );
            const processList = processResponse.data.data;

            // Check if process exists
            if (!processList?.length) {
                setProcessError(
                    "No Material Request process found. Please create a process first."
                );
                setLoading(false);
                return;
            }

            const process = processList[0];

            // Check if process has steps
            if (!process?.steps?.length) {
                setProcessError(
                    "No process steps found for Material Request. Please create process steps first."
                );
                setLoading(false);
                return;
            }

            const processStep = process.steps[0];

            // Get approver for the user
            const processResponseViaUser = await axios.get(
                `/api/v1/process-steps/${processStep?.id}/user/${user_id}`
            );
            const assignUser = processResponseViaUser?.data?.data;

            // Check if approver exists
            if (!assignUser?.approver_id) {
                setProcessError(
                    "No approver found for your user. Please set up approver relationships first."
                );
                setLoading(false);
                return;
            }

            // Create transaction
            const transactionPayload = {
                material_request_id: materialRequestId,
                requester_id: user_id,
                assigned_to: assignUser.approver_id,
                order: String(processStep.order),
                description: processStep.description,
                status: "Pending",
            };
            await axios.post(
                "/api/v1/material-request-transactions",
                transactionPayload
            );

            // Create task
            const taskPayload = {
                process_step_id: processStep.id,
                process_id: processStep.process_id,
                assigned_at: new Date().toISOString(),
                urgency: "Normal",
                assigned_to_user_id: assignUser.approver_id,
                assigned_from_user_id: user_id,
                read_status: null,
                material_request_id: materialRequestId,
            };
            await axios.post("/api/v1/tasks", taskPayload);

            // Navigate to my-requests page
            router.visit("/my-requests");

            if (process.should_reload) {
                window.location.reload();
            }

            // Mark the approved item as requested if one was selected
            if (selectedApprovedItem) {
                try {
                    await axios.put(`/api/v1/request-item/${selectedApprovedItem.id}/mark-requested`);
                    // Refresh the approved items list to remove the requested item
                    await fetchApprovedItems(user_id);
                    setSelectedApprovedItem(null); // Clear the selected item
                } catch (error) {
                    console.error('Error marking approved item as requested:', error);
                }
            }

            toast.success('Request created successfully');
        } catch (error) {
            console.error("Error submitting request:", error);
            setProcessError(
                "An error occurred while processing your request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const getAvailableProducts = (index, categoryId) => {
        if (!categoryId) {
            return [];
        }
        const products = filteredProducts[categoryId] || [];
        return products;
    };

    const getAvailableSubCostCenters = (costCenterId) => {
        if (!costCenterId) return [];
        return filteredSubCostCenters[costCenterId] || [];
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [unitsRes, warehousesRes, costCentersRes, departmentsRes] = await Promise.all([
                    axios.get("/api/v1/units"),
                    axios.get("/api/v1/warehouses"),
                    axios.get("/api/v1/cost-centers"),
                    axios.get("/api/v1/departments"),
                ]);

                setUnits(unitsRes.data.data);
                setWarehouses(warehousesRes.data.data);
                setCostCenters(costCentersRes.data.data);
                setSubCostCenters(costCentersRes.data.data);
                setDepartments(departmentsRes.data.data);
                fetchAllStatuses();

                // Fetch categories with pagination
                fetchCategories();

                // Process cost centers
                const costCenterData = costCentersRes.data.data;
                processSubCostCenters(costCenterData);

            } catch (error) {
                console.error("Error in fetchData:", error);
                console.error("Error details:", {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
            }
        };
        fetchData();
    }, []);

    // Process sub cost centers based on parent_id
    const processSubCostCenters = (costCenterData) => {
        const subCostCenterMap = {};

        costCenterData.forEach((costCenter) => {
            if (costCenter.parent_id) {
                if (!subCostCenterMap[costCenter.parent_id]) {
                    subCostCenterMap[costCenter.parent_id] = [];
                }
                subCostCenterMap[costCenter.parent_id].push(costCenter);
            }
        });

        setFilteredSubCostCenters(subCostCenterMap);
    };

    const fetchAllStatuses = async () => {
        let allStatuses = [];
        let page = 1;
        let lastPage = false;

        try {
            while (!lastPage) {
                const response = await axios.get(
                    `/api/v1/statuses?page=${page}`
                );
                const { data, meta } = response.data;
                allStatuses = [...allStatuses, ...data];
                if (meta?.last_page && page >= meta.last_page) {
                    lastPage = true;
                } else {
                    page++;
                }
            }
            const urgencyStatuses = allStatuses.filter(
                (status) => status.type === "Urgency"
            );
            setStatuses(urgencyStatuses);
        } catch (error) {
            console.error("Error fetching all statuses:", error);
        }
    };

    useEffect(() => {
        if (requestId) {
            axios
                .get(
                    `/api/v1/material-requests/${requestId}?include=requester,warehouse,department,costCenter,subCostCenter,status,items.product,items.unit,items.category,items.urgencyStatus`
                )
                .then((response) => {
                    const requestData = response.data.data;
                    const items = requestData.items || [];
                    if (items.length === 0) {
                        console.warn("No items found in the request.");
                        return;
                    }
                    
                    const newFormData = {
                        ...formData,
                        warehouse_id: requestData.warehouse?.id || "",
                        expected_delivery_date:
                            requestData.expected_delivery_date || "",
                        status_id: "1",
                        cost_center_id: requestData.costCenter?.id || "",
                        sub_cost_center_id: requestData.subCostCenter?.id || "",
                        department_id: requestData.department?.id || "",
                        items: items.map((item) => ({
                            product_id: item.product?.id || "",
                            unit_id: item.unit?.id || "",
                            category_id: item.category?.id || "",
                            quantity: item.quantity || "",
                            urgency: item.urgency_status?.id || "",
                            photo: item.photo || null,
                            description: item.description || "",
                            user_id: item.user_id || null,
                            is_added: item.is_added || false
                        })),
                    };
                    
                    setFormData(newFormData);
                    
                    // Fetch products for each category in the items
                    const uniqueCategories = [...new Set(items.map(item => item.category?.id).filter(Boolean))];
                    uniqueCategories.forEach(categoryId => {
                        if (categoryId && !filteredProducts[categoryId]) {
                            fetchProductsForCategory(categoryId);
                        }
                    });
                })
                .catch((error) => {
                    console.error("Error fetching request data:", error);
                });
        }
    }, [requestId]);

    const validateForm = () => {
        let newErrors = {};
        if (!formData.cost_center_id)
            newErrors.cost_center_id = "Cost Center is required";
        if (!formData.sub_cost_center_id)
            newErrors.sub_cost_center_id = "Sub Cost Center is required";
        if (!formData.department_id)
            newErrors.department_id = "Department is required";
        if (!formData.warehouse_id)
            newErrors.warehouse_id = "Warehouse is required";
        if (!formData.expected_delivery_date)
            newErrors.expected_delivery_date = "Delivery Date is required";

        formData.items.forEach((item, index) => {
            if (!item.product_id)
                newErrors[`items.${index}.product_id`] = "Item is required";
            if (!item.unit_id)
                newErrors[`items.${index}.unit_id`] = "Unit is required";
            if (!item.category_id)
                newErrors[`items.${index}.category_id`] =
                    "Category is required";
            if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0)
                newErrors[`items.${index}.quantity`] =
                    "Valid quantity is required";
            if (!item.urgency)
                newErrors[`items.${index}.urgency`] = "Urgency is required";
            if (!item.description.trim())
                newErrors[`items.${index}.description`] =
                    "Description is required";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newItems = [...formData.items];
            newItems[index].photo = file.name;
            setFormData({ ...formData, items: newItems });
        }
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    product_id: "",
                    unit_id: "",
                    category_id: "",
                    quantity: "",
                    urgency: "",
                    photo: null,
                    description: "",
                },
            ],
        }));
    };

    const handleDeleteItem = (index) => {
        setFormData((prev) => {
            const newItems = prev.items.filter((_, i) => i !== index);
            return { ...prev, items: newItems };
        });
    };

    const handleSelectApprovedItem = async (approvedItem) => {
        try {
            // Check if the approved item has a linked product
            if (!approvedItem.product_id) {
                toast.error('No product linked to this approved item');
                return;
            }

            // Get the linked product details
            const productResponse = await axios.get(`/api/v1/products/${approvedItem.product_id}`);
            const product = productResponse.data.data;
            
            // Get the category and unit details
            const [categoryResponse, unitResponse] = await Promise.all([
                axios.get(`/api/v1/product-categories/${product.category_id}`),
                axios.get(`/api/v1/units/${product.unit_id}`)
            ]);
            
            const category = categoryResponse.data.data;
            const unit = unitResponse.data.data;
            
            // Auto-fill the form with the approved item details
            setFormData(prev => ({
                ...prev,
                items: [{
                    product_id: product.id,
                    unit_id: unit.id,
                    category_id: category.id,
                    quantity: approvedItem.quantity,
                    urgency: "1", // Default urgency
                    photo: null,
                    description: approvedItem.description || "",
                }]
            }));
            
            // Store the selected approved item for later use
            setSelectedApprovedItem(approvedItem);
            
            // Fetch products for the category to ensure dropdown works
            await fetchProductsForCategory(category.id);
            
            toast.success(`Form filled with approved item: ${approvedItem.name}`);
            setShowApprovedItems(false);
        } catch (error) {
            console.error('Error selecting approved item:', error);
            toast.error('Error loading approved item details');
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {requestId
                    ? "Update Request for Material"
                    : "Make a New Request for Material"}
            </h2>
            <p className="text-[#7D8086] text-xl mb-6">
                Employee requests for materials from the Maharat warehouse.
            </p>

            {/* Approved Items Section */}
            {!requestId && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-medium text-[#6E66AC] flex items-center">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" />
                            Your Approved Items ({approvedCount})
                        </h3>
                        <button
                            onClick={() => setShowApprovedItems(!showApprovedItems)}
                            className="text-[#009FDC] hover:text-[#007CB8] font-medium"
                        >
                            {showApprovedItems ? 'Hide' : 'Show'} Approved Items
                        </button>
                    </div>
                    
                    {showApprovedItems && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
                                    <tr>
                                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                            ID
                                        </th>
                                        <th className="py-3 px-4">Item Name</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4">Quantity</th>
                                        <th className="py-3 px-4">Requested Date</th>
                                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D7D8D9] text-base font-medium text-center text-[#2C323C]">
                                    {approvedItems.length > 0 ? (
                                        approvedItems.map((item) => (
                                            <tr key={item.id} className={`hover:bg-gray-50 ${selectedApprovedItem?.id === item.id ? 'bg-blue-50' : ''}`}>
                                                <td className="py-3 px-4">
                                                    {item.id}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.description || 'No description'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                                    <button
                                                        onClick={() => handleSelectApprovedItem(item)}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            selectedApprovedItem?.id === item.id 
                                                                ? 'bg-green-500 text-white cursor-default' 
                                                                : 'bg-[#009FDC] text-white hover:bg-[#007CB8]'
                                                        }`}
                                                        disabled={selectedApprovedItem?.id === item.id}
                                                    >
                                                        {selectedApprovedItem?.id === item.id ? 'Selected' : 'Make Request'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-3 px-4 text-sm text-gray-500 text-center">
                                                No approved items found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {processError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <p className="font-bold">Error</p>
                    <p>{processError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center w-full gap-4">
                    <h3 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                        Requested Item Detail
                    </h3>
                    <div
                        className="h-[3px] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                        }}
                    ></div>
                </div>

                {formData.items.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div>
                            <SelectFloating
                                label="Category"
                                name="category_id"
                                value={item.category_id}
                                onChange={(e) => handleItemChange(index, e)}
                                onScroll={handleCategoryScroll}
                                options={categories.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                                loading={loadingCategories}
                                hasMore={categoriesHasMore}
                            />
                            {errors[`items.${index}.category_id`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.category_id`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Item"
                                name="product_id"
                                value={item.product_id}
                                onChange={(e) => handleItemChange(index, e)}
                                onScroll={(e) => handleProductScroll(item.category_id, e)}
                                options={(() => {
                                    const products = getAvailableProducts(index, item.category_id);
                                    return products.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                    }));
                                })()}
                                loading={loadingMoreProducts[item.category_id] || loadingProducts}
                                hasMore={productsHasMore[item.category_id] || false}
                            />
                            {errors[`items.${index}.product_id`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.product_id`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Unit"
                                name="unit_id"
                                value={item.unit_id}
                                onChange={(e) => handleItemChange(index, e)}
                                options={units.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                            />
                            {errors[`items.${index}.unit_id`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.unit_id`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <div>
                                <InputFloating
                                    label="Quantity"
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, e)}
                                />
                                {errors[`items.${index}.quantity`] && (
                                    <p className="text-red-500 text-sm">
                                        {errors[`items.${index}.quantity`]}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <SelectFloating
                                label="Urgency"
                                name="urgency"
                                value={item.urgency}
                                onChange={(e) => handleItemChange(index, e)}
                                options={statuses.map((s) => ({
                                    id: s.id,
                                    label: s.name,
                                }))}
                            />
                            {errors[`items.${index}.urgency`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.urgency`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                                <FontAwesomeIcon
                                    icon={faCamera}
                                    className="text-gray-500 mr-2"
                                />
                                {item.photo ? (
                                    <span className="text-gray-700 text-sm sm:text-base overflow-hidden text-ellipsis max-w-[80%]">
                                        {item.photo}
                                    </span>
                                ) : (
                                    <span className="text-sm sm:text-base">
                                        Add a Photo
                                    </span>
                                )}
                                <input
                                    type="file"
                                    name="photo"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(index, e)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div className="md:col-span-3">
                            <div className="flex justify-start items-center gap-2">
                                <div className="w-full">
                                    <div className="relative w-full">
                                        <textarea
                                            name="description"
                                            value={item.description}
                                            onChange={(e) =>
                                                handleItemChange(index, e)
                                            }
                                            className="peer border border-gray-300 p-5 rounded-2xl w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                        ></textarea>
                                        <label
                                            className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                    ${
                                        item.description
                                            ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                            : "top-4 text-base text-gray-400"
                                    }
                                    peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1`}
                                        >
                                            Description
                                        </label>
                                    </div>
                                    {errors[`items.${index}.description`] && (
                                        <p className="text-red-500 text-sm">
                                            {
                                                errors[
                                                    `items.${index}.description`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteItem(index)}
                                        className="text-red-500 text-xl hover:text-red-700 p-2"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center items-center relative w-full my-8">
                    <div
                        className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                        }}
                    ></div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] z-10 transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add
                        Item
                    </button>
                    <div
                        className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                        }}
                    ></div>
                </div>

                <div className="flex items-center w-full gap-4">
                    <h3 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                        Other Info
                    </h3>
                    <div
                        className="h-[3px] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                        }}
                    ></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <SelectFloating
                            label="Cost Center"
                            name="cost_center_id"
                            value={formData.cost_center_id}
                            onChange={handleChange}
                            options={costCenters.map((cc) => ({
                                id: cc.id,
                                label: cc.name,
                            }))}
                        />
                        {errors.cost_center_id && (
                            <p className="text-red-500 text-sm">
                                {errors.cost_center_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Sub Cost Center"
                            name="sub_cost_center_id"
                            value={formData.sub_cost_center_id}
                            onChange={handleChange}
                            options={getAvailableSubCostCenters(
                                formData.cost_center_id
                            ).map((scc) => ({
                                id: scc.id,
                                label: scc.name,
                            }))}
                        />
                        {errors.sub_cost_center_id && (
                            <p className="text-red-500 text-sm">
                                {errors.sub_cost_center_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Department"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            options={departments.map((dept) => ({
                                id: dept.id,
                                label: dept.name,
                            }))}
                        />
                        {errors.department_id && (
                            <p className="text-red-500 text-sm">
                                {errors.department_id}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Warehouse"
                            name="warehouse_id"
                            value={formData.warehouse_id}
                            onChange={handleChange}
                            options={warehouses.map((p) => ({
                                id: p.id,
                                label: p.name,
                            }))}
                        />
                        {errors.warehouse_id && (
                            <p className="text-red-500 text-sm">
                                {errors.warehouse_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <div className="relative w-full">
                            <input
                                type="date"
                                name="expected_delivery_date"
                                value={formData.expected_delivery_date}
                                onChange={handleChange}
                                min={new Date().toISOString().split("T")[0]}
                                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                            />
                            <label
                                className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all 
                                ${
                                    formData.expected_delivery_date
                                        ? "-top-2 text-[#009FDC] text-sm px-2"
                                        : "top-1/2 text-gray-400 -translate-y-1/2"
                                }
                                peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2`}
                            >
                                Select Delivery Date
                            </label>
                        </div>
                        {errors.expected_delivery_date && (
                            <p className="text-red-500 text-sm">
                                {errors.expected_delivery_date}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50 w-full sm:w-auto"
                        disabled={loading}
                    >
                        {loading
                            ? requestId
                                ? "Updating..."
                                : "Creating..."
                            : requestId
                            ? "Update Request"
                            : "Create Request"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default MakeRequest;
