import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { router, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import {
    DocumentTextIcon,
    DocumentArrowDownIcon,
    EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faChevronRight,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { fetchRFQData, fetchLookupData, getSafeValue } from "./rfqUtils";
import { FaTrash } from "react-icons/fa";

export default function AddQuotationForm({ auth }) {
    const { rfqId } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        organization_name: "",
        organization_email: "",
        city: "",
        category_id: "",
        warehouse_id: "",
        issue_date: new Date().toISOString().split("T")[0],
        closing_date: "",
        rfq_id: "",
        payment_type: "",
        contact_no: "",
        items: [
            {
                item_name: "",
                description: "",
                unit_id: "",
                quantity: "",
                brand_id: "",
                attachment: null,
                expected_delivery_date: "",
                rfq_id: null,
                status_id: 48,
            },
        ],
        status_id: 48,
    });

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [brands, setBrands] = useState([]);
    const [attachments, setAttachments] = useState({});
    const [unitNames, setUnitNames] = useState({});
    const [brandNames, setBrandNames] = useState({});
    const [warehouseNames, setWarehouseNames] = useState({});
    const [categoryNames, setCategoryNames] = useState({});
    const [paymentTypeNames, setPaymentTypeNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // First fetch products
                const productsResponse = await axios.get("/api/v1/products");
                const productsData = productsResponse.data?.data || [];
                setProducts(productsData);

        if (rfqId) {
            setLoading(true);
            setIsEditing(true);

                    const response = await axios.get(`/api/v1/rfqs/${rfqId}`);
                    const rfqData = response.data?.data;

                    if (!rfqData) {
                        setError("RFQ not found or has invalid data format");
                        setLoading(false);
                        return;
                    }

                    // For category, we need to fetch from rfq_categories
                    let categoryId = rfqData.category_id
                        ? String(rfqData.category_id)
                        : "";

                    // If category_id is empty, try to fetch from rfq_categories relationship
                    if (!categoryId && rfqId) {
                        try {
                            const categoryResponse = await axios.get(
                                `/api/v1/rfq-categories/${rfqId}`
                            );
                            if (
                                categoryResponse.data &&
                                categoryResponse.data.data &&
                                categoryResponse.data.data.length > 0
                            ) {
                                categoryId = String(
                                    categoryResponse.data.data[0].category_id
                                );
                            }
                        } catch (err) {
                            console.error("Error fetching category:", err);
                        }
                    }

                    const rfqItems = rfqData.items || [];

                    const formattedItems = rfqItems.map((item) => {
                        let attachmentObj = null;
                        if (item.attachment) {
                            if (typeof item.attachment === "string") {
                                const fileName = item.attachment
                                    .split("/")
                                    .pop();
                                attachmentObj = {
                                    url: item.attachment,
                                    name: fileName,
                                    file_name: fileName,
                                };
                            } else if (typeof item.attachment === "object") {
                                attachmentObj = {
                                    url:
                                        item.attachment.url ||
                                        item.attachment.path ||
                                        "",
                                    name:
                                        item.attachment.name ||
                                        item.attachment.file_name ||
                                        "Attachment",
                                    file_name:
                                        item.attachment.file_name ||
                                        item.attachment.name ||
                                        "Attachment",
                                };
                            }
                        }

                        // Find the corresponding product from the already loaded products
                        const product = productsData.find(
                            (p) => p.id === item.product_id
                        );

                        return {
                            id: item.id,
                            product_id: item.product_id || "",
                            item_name:
                                item.item_name || (product ? product.name : ""),
                            description:
                                item.description ||
                                (product ? product.description : ""),
                            unit_id: item.unit_id ? String(item.unit_id) : "",
                            quantity: item.quantity || "",
                            brand_id: item.brand_id
                                ? String(item.brand_id)
                                : "",
                            attachment: attachmentObj,
                            specifications: item.specifications || "",
                            expected_delivery_date:
                                item.expected_delivery_date?.split("T")[0] ||
                                "",
                            rfq_id: rfqId,
                            status_id: item.status_id
                                ? String(item.status_id)
                                : "48",
                        };
                    });

                    // If no items, add a default empty one
                    if (formattedItems.length === 0) {
                        formattedItems.push({
                            item_name: "",
                            description: "",
                            unit_id: "",
                            quantity: "",
                            brand_id: "",
                            attachment: null,
                            expected_delivery_date: "",
                            rfq_id: rfqId,
                            status_id: "48",
                        });
                    }

                    // Format the main form data
                    const formattedData = {
                        organization_name: rfqData.organization_name || "",
                        organization_email: rfqData.organization_email || "",
                        city: rfqData.city || "",

                        category_id:
                            rfqData.categories && rfqData.categories.length > 0
                                ? String(rfqData.categories[0].id)
                                : "",

                        warehouse_id: rfqData.warehouse
                            ? String(rfqData.warehouse.id)
                            : "",
                        issue_date:
                            rfqData.request_date?.split("T")[0] ||
                            new Date().toISOString().split("T")[0],
                        closing_date: rfqData.closing_date?.split("T")[0] || "",
                        rfq_id: rfqData.rfq_number || "",

                        payment_type: rfqData.payment_type
                            ? String(rfqData.payment_type.id)
                            : "",
                        contact_no: rfqData.contact_number || "",
                        status_id: rfqData.status?.id
                            ? String(rfqData.status.id)
                            : "48",
                        items: formattedItems,
                    };
                    setFormData(formattedData);
                    setLoading(false);
        } else {
            // In create mode, get new RFQ number
            axios
                .get("/api/v1/rfqs/form-data")
                .then((response) => {
                    if (response.data && response.data.rfq_number) {
                        setFormData((prev) => ({
                            ...prev,
                            rfq_id: response.data.rfq_number,
                            issue_date:
                                response.data.request_date ||
                                new Date().toISOString().split("T")[0],
                        }));
                    }
                })
                .catch((error) => {
                            console.error(
                                "Error fetching new RFQ number:",
                                error
                            );
                })
                .finally(() => {
                    setLoading(false);
                });
        }
            } catch (error) {
                console.error("Error fetching initial data:", error);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [rfqId]);

    // Fetch lookup data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const endpoints = [
                    { name: "units", url: "/api/v1/units" },
                    { name: "brands", url: "/api/v1/brands" },
                    { name: "categories", url: "/api/v1/product-categories" },
                    { name: "warehouses", url: "/api/v1/warehouses" },
                    { name: "products", url: "/api/v1/products" },
                ];

                // Fetch each endpoint and handle potential errors individually
                const results = await Promise.all(
                    endpoints.map(async (endpoint) => {
                        try {
                            const response = await axios.get(endpoint.url);
                            return {
                                name: endpoint.name,
                                data: response.data?.data || [],
                            };
                        } catch (error) {
                            console.warn(
                                `Failed to fetch ${endpoint.name}:`,
                                error
                            );
                            return { name: endpoint.name, data: [] };
                        }
                    })
                );

                // Apply results to state
                results.forEach((result) => {
                    switch (result.name) {
                        case "units":
                            setUnits(result.data);

                            // Create lookup map for units
                            const unitLookup = {};
                            result.data.forEach((unit) => {
                                if (unit && unit.id) {
                                    unitLookup[String(unit.id)] = unit.name;
                                }
                            });
                            setUnitNames(unitLookup);
                            break;

                        case "brands":
                            setBrands(result.data);

                            // Create lookup map for brands
                            const brandLookup = {};
                            result.data.forEach((brand) => {
                                if (brand && brand.id) {
                                    brandLookup[String(brand.id)] = brand.name;
                                }
                            });
                            setBrandNames(brandLookup);
                            break;

                        case "categories":
                            setCategories(result.data);

                            // Create lookup map for categories
                            const categoryLookup = {};
                            result.data.forEach((category) => {
                                if (category && category.id) {
                                    categoryLookup[String(category.id)] =
                                        category.name;
                                }
                            });
                            setCategoryNames(categoryLookup);
                            break;

                        case "warehouses":
                            setWarehouses(result.data);

                            // Create lookup map for warehouses
                            const warehouseLookup = {};
                            result.data.forEach((warehouse) => {
                                if (warehouse && warehouse.id) {
                                    warehouseLookup[String(warehouse.id)] =
                                        warehouse.name;
                                }
                            });
                            setWarehouseNames(warehouseLookup);
                            break;

                        case "products":
                            setProducts(result.data);
                            break;

                        default:
                            break;
                    }
                });

                try {
                    const statusesResponse = await axios.get(
                        "/api/v1/statuses",
                        {
                            params: {
                                per_page: 100,
                            },
                        }
                    );
                    let allStatuses = [];

                    if (statusesResponse.data && statusesResponse.data.data) {
                        allStatuses = statusesResponse.data.data;

                        const meta = statusesResponse.data.meta;
                        if (meta) {
                            console.log("Pagination metadata:", meta);

                            if (
                                meta.last_page &&
                                meta.last_page > 1 &&
                                meta.current_page === 1
                            ) {
                                const remainingRequests = [];

                                for (
                                    let page = 2;
                                    page <= meta.last_page;
                                    page++
                                ) {
                                    remainingRequests.push(
                                        axios.get("/api/v1/statuses", {
                                            params: {
                                                per_page: 100,
                                                page: page,
                                            },
                                        })
                                    );
                                }
                                const remainingResponses = await Promise.all(
                                    remainingRequests
                                );

                                remainingResponses.forEach((response) => {
                                    if (response.data && response.data.data) {
                                        allStatuses = [
                                            ...allStatuses,
                                            ...response.data.data,
                                        ];
                                    }
                                });
                            }
                        }
                        // Filter for payment types
                        const paymentTypes = allStatuses.filter(
                            (status) =>
                                status.type &&
                                status.type.toLowerCase() === "payment"
                        );

                        if (paymentTypes.length > 0) {
                            setPaymentTypes(paymentTypes);

                            // lookup map for payment types
                            const paymentTypeLookup = {};
                            paymentTypes.forEach((type) => {
                                if (type && type.id) {
                                    paymentTypeLookup[String(type.id)] =
                                        type.name;
                                }
                            });
                            setPaymentTypeNames(paymentTypeLookup);
                        } else {
                            setPaymentTypes(allStatuses);

                            // Create lookup map for all statuses
                            const statusesLookup = {};
                            allStatuses.forEach((status) => {
                                if (status && status.id) {
                                    statusesLookup[
                                        String(status.id)
                                    ] = `${status.name} (${status.type})`;
                                }
                            });
                            setPaymentTypeNames(statusesLookup);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching all statuses:", error);

                    try {
                        const fallbackResponse = await axios.get(
                            "/api/v1/statuses"
                        );
                        if (
                            fallbackResponse.data &&
                            fallbackResponse.data.data
                        ) {
                            const fallbackStatuses = fallbackResponse.data.data;
                            console.log(
                                "Fallback: using initial statuses:",
                                fallbackStatuses
                            );

                            setPaymentTypes(fallbackStatuses);

                            const fallbackLookup = {};
                            fallbackStatuses.forEach((status) => {
                                if (status && status.id) {
                                    fallbackLookup[
                                        String(status.id)
                                    ] = `${status.name} (${status.type})`;
                                }
                            });
                            setPaymentTypeNames(fallbackLookup);
                        }
                    } catch (fallbackError) {
                        console.error(
                            "Fallback fetch also failed:",
                            fallbackError
                        );
                        setPaymentTypes([]);
                        setPaymentTypeNames({});
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching lookup data:", error);
                setError(
                    "Failed to load reference data. Some options may be unavailable."
                );

                setUnits([]);
                setBrands([]);
                setCategories([]);
                setWarehouses([]);
                setPaymentTypes([]);
                setUnitNames({});
                setBrandNames({});
                setWarehouseNames({});
                setCategoryNames({});
                setPaymentTypeNames({});
                setProducts([]);

                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    product_id: "",
                    item_name: "",
                    description: "",
                    unit_id: "",
                    quantity: "",
                    brand_id: "",
                    attachment: null,
                    expected_delivery_date: "",
                    rfq_id: rfqId || null,
                    status_id: 48,
                },
            ],
        }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];

        if (field === "product_id") {
            const selectedProduct = products.find(
                (p) => p.id === Number(value)
            );
            if (selectedProduct) {
                updatedItems[index] = {
                    ...updatedItems[index],
                    product_id: selectedProduct.id,
                    item_name: selectedProduct.name,
                    description: selectedProduct.description || "",
                };
            } else {
                // If no product is selected (empty selection)
                updatedItems[index] = {
                    ...updatedItems[index],
                    product_id: "",
                    item_name: "",
                    description: "",
                };
            }
        } else if (field === "quantity") {
            if (value === "") {
                updatedItems[index][field] = "";
            } else {
                const numValue = parseFloat(value);
                if (numValue < 0) return;
                updatedItems[index][field] = numValue.toFixed(1);
            }
        } else {
            updatedItems[index][field] = value;
        }

        setFormData({ ...formData, items: updatedItems });
    };

    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            // Store the actual file object
            setAttachments((prev) => ({
                ...prev,
                [index]: file,
            }));

            // Update the form data with the file info
            const updatedItems = [...formData.items];
            updatedItems[index].attachment = {
                name: file.name,
                original_filename: file.name,
                file: file,
            };
            setFormData({ ...formData, items: updatedItems });
        }
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length <= 1) {
            alert("You must have at least one item.");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));

        setAttachments((prev) => {
            const newAttachments = { ...prev };
            delete newAttachments[index];
            return newAttachments;
        });
    };

    const handleFormInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveAndSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log('Initial formData:', formData); // Debug initial state

            // Create a plain object with all required data
            const rfqData = {
                organization_name: formData.organization_name || "",
                organization_email: formData.organization_email || "",
                city: formData.city || "",
                category_id: formData.category_id || "",
                warehouse_id: formData.warehouse_id || "",
                request_date: formData.issue_date || "",
                closing_date: formData.closing_date || "",
                rfq_number: formData.rfq_id || "",
                payment_type: formData.payment_type || "",
                contact_number: formData.contact_no || "",
                status_id: formData.status_id || "48",
                updated_at: new Date().toISOString()
            };

            console.log('Prepared RFQ data for API:', rfqData); // Debug prepared data

            let response;
            if (rfqId) {
                console.log('Updating existing RFQ:', rfqId); // Debug update operation
                
                // For updates, use direct JSON data instead of FormData to avoid issues
                response = await axios.put(`/api/v1/rfqs/${rfqId}`, rfqData, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });
            } else {
                console.log('Creating new RFQ'); // Debug create operation
                
                // Convert to FormData for new records
                const formDataObj = new FormData();
                Object.entries(rfqData).forEach(([key, value]) => {
                    formDataObj.append(key, value);
                    console.log(`Appending to FormData: ${key}=${value}`); // Debug FormData construction
                });
                
                response = await axios.post("/api/v1/rfqs", formDataObj, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Accept: "application/json",
                    },
                });
            }

            console.log('API Response:', response.data); // Debug API response

            if (!response.data?.data?.id) {
                console.error('No RFQ ID in response:', response.data); // Debug missing ID
                throw new Error("Failed to get RFQ ID");
            }
            const newRfqId = response.data.data?.id;
            console.log("RFQ ID:", newRfqId);

            // Now save the items with the new RFQ ID
            const itemsFormData = new FormData();
            const itemsToSend = formData.items.map((item) => ({
                id: item.id,
                product_id: item.product_id,
                unit_id: item.unit_id,
                quantity: item.quantity,
                brand_id: item.brand_id,
                expected_delivery_date: item.expected_delivery_date,
                rfq_id: newRfqId,
                status_id: item.status_id || "48",
            }));

            console.log('Items to be saved:', itemsToSend); // Debug items data

            itemsFormData.append("items", JSON.stringify(itemsToSend));

            // Add attachments
            if (attachments) {
                Object.keys(attachments).forEach((index) => {
                    if (attachments[index]) {
                        itemsFormData.append(
                        `attachments[${index}]`,
                        attachments[index]
                    );
                    }
                });
            }

            const itemsResponse = await axios.post(
                "/api/v1/rfq-items",
                itemsFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Accept: "application/json",
                    },
                }
            );

            console.log('Items save response:', itemsResponse.data); // Debug items response

            // Only proceed with process steps if we have a successful RFQ response
            if (newRfqId) {
                const loggedUser = auth.user?.id;
                const processResponse = await axios.get(
                    "/api/v1/processes?include=steps,creator,updater&filter[title]=RFQ Approval"
                );

                if (processResponse.data?.data?.[0]?.steps?.[0]) {
                    const process = processResponse.data.data[0];
                    const processStep = process.steps[0];

                    // Only proceed if we have valid process step data
                    if (processStep?.id && processStep?.order) {
                        const processResponseViaUser = await axios.get(
                            `/api/v1/process-steps/${processStep.order}/user/${loggedUser}`
                        );
                        const assignUser = processResponseViaUser?.data;

                        if (assignUser?.user?.user?.id) {
                            const RFQApprovalTransactionPayload = {
                                rfq_id: newRfqId,
                                requester_id: loggedUser,
                                assigned_to: assignUser.user.user.id,
                                order: processStep.order,
                                description: processStep.description,
                                status: "Pending",
                            };
                            await axios.post(
                                "/api/v1/rfq-approval-transactions",
                                RFQApprovalTransactionPayload
                            );

                            const taskPayload = {
                                process_step_id: processStep.id,
                                process_id: processStep.process_id,
                                assigned_at: new Date().toISOString(),
                                urgency: "Normal",
                                assigned_to_user_id: assignUser.user.user.id,
                                assigned_from_user_id: loggedUser,
                                rfq_id: newRfqId,
                            };
                            await axios.post("/api/v1/tasks", taskPayload);
                        }
                    }
                }
            }

            if (itemsResponse.data.success) {
                console.log('All operations completed successfully'); // Debug success
                
                // Force a refresh to verify the update if in edit mode
                if (rfqId) {
                    await axios.get(`/api/v1/rfqs/${rfqId}?t=${new Date().getTime()}`);
                }
                
                alert("RFQ and items saved successfully!");
                router.visit(route("rfq.index"));
            }
        } catch (error) {
            console.error('Error in handleSaveAndSubmit:', error); // Debug error
            console.error('Error response:', error.response); // Debug error response
            alert(
                error.response?.data?.message ||
                    "Save failed. Please check your data and try again."
            );
        }
    };

    const FileDisplay = ({ file, onFileClick }) => {
        if (!file) {
            return (
                <div className="flex flex-col items-center justify-center space-y-2">
                    <DocumentArrowDownIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-500">
                        No file attached
                    </span>
                </div>
            );
        }

        let fileName = "";
        let fileUrl = null;

        if (file instanceof File) {
            // New file being uploaded
            fileName = file.name;
            fileUrl = URL.createObjectURL(file);
        } else if (typeof file === "object") {
            // File from database
            fileName = file.original_filename || file.name || file.file_name;
            // Fix the URL construction
            if (file.url && file.url.startsWith("http")) {
                    fileUrl = file.url;
                } else {
                fileUrl = `/storage/${file.url || file.path || file}`.replace(
                    "/storage/storage/",
                    "/storage/"
                );
            }
        } else if (typeof file === "string") {
            // Legacy format - just the path
            fileName = file.split("/").pop();
            fileUrl = `/storage/${file}`.replace(
                "/storage/storage/",
                "/storage/"
            );
        }

        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon
                    className="h-6 w-6 text-blue-500 cursor-pointer hover:text-blue-700"
                    onClick={() => {
                        if (fileUrl) onFileClick(fileUrl);
                    }}
                />
                {fileName && (
                    <span
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                        onClick={() => {
                            if (fileUrl) onFileClick(fileUrl);
                        }}
                    >
                        {fileName}
                    </span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title={isEditing ? "Edit RFQ" : "Create RFQ"} />
                <div className="min-h-screen p-6">
                    <div className="flex justify-center items-center h-screen">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-4">
                                Loading...
                            </h2>
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (error) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Error Loading RFQ" />
                <div className="min-h-screen p-6">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p>{error}</p>
                        <div className="mt-4">
                            <button
                                onClick={() => router.visit("/rfq")}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Return to RFQ List
                            </button>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isEditing ? "Edit RFQ" : "Create RFQ"} />
            <div className="min-h-screen p-6">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/rfq")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}
                            className="mr-2 text-2xl"
                        />
                        Back
                    </button>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center justify-between mb-6 space-x-4">
                    <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2">
                        <Link
                            href="/dashboard"
                            className="hover:text-[#009FDC] text-xl"
                        >
                            Home
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xl text-[#9B9DA2]"
                        />
                        {/* <Link
                            href="/purchase"
                            className="hover:text-[#009FDC] text-xl"
                        >
                            Procurement Center
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xl text-[#9B9DA2]"
                        /> */}
                        <Link
                            href="/rfq"
                            className="hover:text-[#009FDC] text-xl"
                        >
                            RFQs
                        </Link>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xl text-[#9B9DA2]"
                        />
                        <span className="text-[#009FDC] text-xl">
                            {isEditing ? "Edit RFQ" : "New RFQ Request"}
                        </span>
                    </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {isEditing
                                ? "Edit Request for Quotation"
                                : "Request for a Quotation"}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Share Requirements and Receive Tailored Estimates
                        </p>
                    </div>
                    <img
                        src="/images/MCTC Logo.png"
                        alt="Maharat Logo"
                        className="h-12"
                    />
                </div>

                {/* Form */}
                <form onSubmit={handleSaveAndSubmit}>
                    {/* Info Grid */}
                    <div className="bg-blue-50 rounded-lg p-6 grid grid-cols-2 gap-6 shadow-md text-lg">
                        {/* Left Column */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                            <span className="font-medium text-gray-600">
                                Organization Name:
                            </span>
                            <input
                                type="text"
                                value={formData.organization_name}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "organization_name",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 w-full outline-none border-none text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">
                                Organization Email:
                            </span>
                            <input
                                type="email"
                                value={formData.organization_email}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "organization_email",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 w-full outline-none border-none text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">
                                City:
                            </span>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "city",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 w-full outline-none border-none text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">
                                Category:
                            </span>
                            <div className="relative ml-3">
                                <select
                                    value={formData.category_id || ""}
                                    onChange={(e) =>
                                        handleFormInputChange(
                                            "category_id",
                                            e.target.value
                                        )
                                    }
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 focus:ring-0 w-64 appearance-none pl-0 pr-6 cursor-pointer outline-none border-none"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id.toString()}
                                            className="text-[#009FDC] bg-blue-50"
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <span className="font-medium text-gray-600">
                                Warehouse:
                            </span>
                            <div className="relative ml-3">
                                <select
                                    value={formData.warehouse_id || ""}
                                    onChange={(e) =>
                                        handleFormInputChange(
                                            "warehouse_id",
                                            e.target.value
                                        )
                                    }
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 focus:ring-0 w-72 appearance-none pl-0 pr-6 cursor-pointer outline-none border-none"
                                    required
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={warehouse.id.toString()}
                                            className="text-[#009FDC] bg-blue-50"
                                        >
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-center">
                            <span className="font-medium text-gray-600">
                                Issue Date:
                            </span>
                            <input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "issue_date",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-40 ml-2 text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">
                                Closing Date:
                            </span>
                            <input
                                type="date"
                                value={formData.closing_date}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "closing_date",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-40 ml-2 text-lg"
                                required
                            />

                            <span className="font-medium text-gray-600">
                                RFQ#:
                            </span>
                            <input
                                type="text"
                                value={formData.rfq_id}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "rfq_id",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-full ml-2 text-lg"
                                readOnly={!isEditing}
                                placeholder={
                                    isEditing ? "" : "Auto-generated by system"
                                }
                                required={isEditing}
                            />

                            <span className="font-medium text-gray-600">
                                Payment Type:
                            </span>
                            <div className="relative ml-5">
                                <select
                                    value={formData.payment_type || ""}
                                    onChange={(e) =>
                                        handleFormInputChange(
                                            "payment_type",
                                            e.target.value
                                        )
                                    }
                                    className="text-lg text-[#009FDC] font-medium bg-blue-50 focus:ring-0 w-64 appearance-none pl-0 pr-6 cursor-pointer outline-none border-none"
                                    required
                                >
                                    <option value="">
                                        Select Payment Type
                                    </option>
                                    {paymentTypes.map((type) => (
                                        <option
                                            key={type.id}
                                            value={type.id.toString()}
                                            className="text-[#009FDC] bg-blue-50"
                                        >
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <span className="font-medium text-gray-600">
                                Contact No#:
                            </span>
                            <input
                                type="text"
                                value={formData.contact_no}
                                onChange={(e) =>
                                    handleFormInputChange(
                                        "contact_no",
                                        e.target.value
                                    )
                                }
                                className="text-black bg-blue-50 focus:ring-0 outline-none border-none w-full ml-2 text-lg"
                                required
                            />
                        </div>
                    </div>

                    {/* Item Table */}
                    <table className="w-full mt-4 table-fixed border-collapse">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 rounded-tl-2xl rounded-bl-2xl text-center w-[13%] bg-[#C7E7DE]">
                                    Item Name
                                </th>
                                <th className="px-2 py-2 text-center w-[12%] bg-[#C7E7DE]">
                                    Description
                                </th>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">
                                    Unit
                                </th>
                                <th className="px-2 py-2 text-center w-[8%] bg-[#C7E7DE]">
                                    Quantity
                                </th>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">
                                    Brand
                                </th>
                                <th className="px-2 py-2 text-center w-[10%] bg-[#C7E7DE]">
                                    Attachment
                                </th>
                                <th className="px-2 py-2 text-center w-[14%] bg-[#C7E7DE]">
                                    Expected Delivery Date
                                </th>
                                <th className="px-2 py-2 rounded-tr-2xl rounded-br-2xl text-center w-[6%] bg-[#C7E7DE]">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <select
                                            value={item.product_id || ""}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "product_id",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent cursor-pointer"
                                            required
                                        >
                                            <option value="">
                                                Select Product
                                            </option>
                                            {products.map((product) => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <textarea
                                            value={item.description || ""}
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm break-words whitespace-normal text-center min-h-[3rem] resize-none overflow-hidden bg-gray-100"
                                            style={{
                                                background: "none",
                                                outline: "none",
                                                textAlign: "center",
                                                wordWrap: "break-word",
                                                whiteSpace: "normal",
                                            }}
                                            rows="1"
                                            readOnly
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <select
                                            value={item.unit_id || ""}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "unit_id",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent cursor-pointer"
                                            style={{
                                                background: "none",
                                                outline: "none",
                                                textAlign: "center",
                                                paddingRight: "1rem",
                                                appearance:
                                                    "none" /* Removes default dropdown arrow in most browsers */,
                                            }}
                                            required
                                        >
                                            <option value="">
                                                Select Unit
                                            </option>
                                            {units.map((unit) => (
                                                <option
                                                    key={unit.id}
                                                    value={unit.id}
                                                >
                                                    {unit.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="px-6 py-6 text-center align-middle">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none"
                                            style={{
                                                background: "none",
                                                outline: "none",
                                                textAlign: "center",
                                            }}
                                            required
                                            onWheel={(e) => e.target.blur()} // Prevents changing value with mouse scroll
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <select
                                            value={item.brand_id || ""}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "brand_id",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full border-none shadow-none focus:ring-0 sm:text-sm text-center appearance-none bg-transparent"
                                            style={{
                                                background: "none",
                                                outline: "none",
                                                textAlign: "center",
                                                paddingRight: "1rem",
                                            }}
                                            required
                                        >
                                            <option value="">
                                                Select Brand
                                            </option>
                                            {brands.map((brand) => (
                                                <option
                                                    key={brand.id}
                                                    value={brand.id}
                                                >
                                                    {brand.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center justify-center w-full">
                                            <FileDisplay
                                                file={item.attachment}
                                                onFileClick={(url) =>
                                                    window.open(url, "_blank")
                                                }
                                            />
                                            <input
                                                type="file"
                                                onChange={(e) =>
                                                    handleFileChange(index, e)
                                                }
                                                className="hidden"
                                                id={`file-input-${index}`}
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <label
                                                htmlFor={`file-input-${index}`}
                                                className="mt-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer break-words whitespace-normal text-center"
                                            >
                                                {item.attachment
                                                    ? "Replace file"
                                                    : "Attach file"}
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <input
                                            type="date"
                                            value={
                                                item.expected_delivery_date ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "expected_delivery_date",
                                                    e.target.value
                                                )
                                            }
                                            className="text-sm text-gray-900 bg-transparent border-none focus:ring-0 w-full"
                                            required
                                        />
                                    </td>
                                    <td className="px-8 py-3 whitespace-nowrap text-right pl-2">
                                        {" "}
                                        {/* Adjusted alignment */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveItem(index)
                                            }
                                            className="text-red-600 hover:text-red-900 ml-2" // Added margin to move it right
                                            disabled={
                                                formData.items.length <= 1
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="h-5 w-5"
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Add Item Button */}
                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-blue-600 flex items-center"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-green-600 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50"
                        >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            {isEditing ? "Update RFQ" : "Save RFQ"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
