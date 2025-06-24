import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

function ReceivedMRsModal({ isOpen, onClose, onSave, requestData }) {
    const [formData, setFormData] = useState({
        material_request_id: "",
        items: "",
        cost_center_id: "",
        sub_cost_center_id: "",
        department_id: "",
        priority: "",
        status: "",
        description: "",
        rejection_reason: "",
    });

    const [costCenters, setCostCenters] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [errors, setErrors] = useState({});
    const [showRfqOption, setShowRfqOption] = useState(false);
    const [rfqError, setRfqError] = useState("");
    const [rfqAlreadyRequested, setRfqAlreadyRequested] = useState(false);

    useEffect(() => {
        axios
            .get("/api/v1/cost-centers")
            .then((res) => setCostCenters(res.data.data))
            .catch((err) => console.error("Error fetching cost centers:", err));

        axios
            .get("/api/v1/departments")
            .then((res) => setDepartments(res.data.data))
            .catch((err) => console.error("Error fetching departments:", err));
    }, []);

    useEffect(() => {
        if (isOpen && requestData) {
            setFormData({
                material_request_id: requestData.id || "",
                items:
                    requestData.items
                        ?.map((item) => item.product?.name)
                        .join(", ") || "",
                cost_center_id: requestData.cost_center_id || "",
                sub_cost_center_id: requestData.sub_cost_center_id || "",
                department_id: requestData.department_id || "",
                priority: "",
                status: "",
                description: "",
                rejection_reason: "",
            });
            setErrors({});
            setShowRfqOption(false);
            setRfqError("");
        }
    }, [isOpen, requestData]);

    useEffect(() => {
        // Check if RFQ request already exists for this material request
        const checkRfqRequest = async () => {
            if (isOpen && requestData && requestData.items && requestData.items.length > 0) {
                try {
                    // Check for any RFQ request for any of the items in this material request
                    const rfqRes = await axios.get('/api/v1/rfq-requests', {
                        params: {
                            user_id: requestData.requester_id,
                            warehouse_id: requestData.warehouse_id,
                            // Optionally filter by item name or product id if needed
                        }
                    });
                    const rfqRequests = rfqRes.data?.data || [];
                    // If any RFQ request exists for any item in this MR, consider it already requested
                    const alreadyRequested = requestData.items.some(item =>
                        rfqRequests.some(r =>
                            (r.name === item.product?.name || r.product_id === item.product?.id)
                        )
                    );
                    setRfqAlreadyRequested(alreadyRequested);
                } catch (err) {
                    setRfqAlreadyRequested(false);
                }
            } else {
                setRfqAlreadyRequested(false);
            }
        };
        checkRfqRequest();
    }, [isOpen, requestData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.material_request_id)
            newErrors.material_request_id = "Request Number is required";
        if (!formData.items) newErrors.items = "Items field is required";
        if (!formData.cost_center_id)
            newErrors.cost_center_id = "Cost Center is required";
        if (!formData.priority) newErrors.priority = "Priority is required";
        if (!formData.status) newErrors.status = "Status is required";
        if ((formData.status === "Pending" || formData.status === "Rejected") && !formData.description)
            newErrors.description = "Description is required when status is Pending or Rejected";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (formData.status === "Rejected") {
                await axios.put(`/api/v1/material-requests/${formData.material_request_id}`, {
                    status: "Rejected",
                    rejection_reason: formData.description
                });
            } else if (formData.status === "Issue Material") {
                // Check if there's inventory for the items
                try {
                    // Check inventory for each item in the request
                    const items = requestData.items || [];
                    let missingItems = [];
                    
                    for (const item of items) {
                        const productId = item.product_id;
                        const warehouseId = requestData.warehouse_id;
                        const productName = item.product?.name || 'Unknown Product';
                        const requestedQty = parseFloat(item.quantity);
                        
                        // Check current inventory quantity
                        const inventoryResponse = await axios.get(`/api/v1/inventories`, {
                            params: {
                                'filter[warehouse_id]': warehouseId,
                                'filter[product_id]': productId
                            }
                        });
                        
                        if (inventoryResponse.data?.data?.length === 0) {
                            missingItems.push(productName);
                        } else {
                            const currentInventory = inventoryResponse.data.data[0];
                            const currentQuantity = parseFloat(currentInventory.quantity) || 0;
                            
                            if (currentQuantity < requestedQty) {
                                missingItems.push(`${productName} (Available: ${currentQuantity}, Requested: ${requestedQty})`);
                            }
                        }
                    }
                    
                    if (missingItems.length > 0) {
                        const errorMessage = `Cannot issue material! No inventory found for ${missingItems.join(', ')} in the selected warehouse.`;
                        throw new Error(errorMessage);
                    }
                } catch (error) {
                    if (error.message.includes("No inventory found")) {
                        setShowRfqOption(true);
                        setRfqError(error.message);
                        return;
                    }
                    throw error;
                }
            }

            onSave(formData);
            onClose();
        } catch (error) {
            setErrors(error.response?.data?.errors || {});
        }
    };

    const handleCreateRfqRequest = async () => {
        try {
            // Create RFQ request for each item in the material request
            const items = requestData.items || [];
            
            for (const item of items) {
                const rfqRequestData = {
                    user_id: requestData.requester_id,
                    name: item.product?.name || "Unknown Item",
                    description: item.description || "",
                    quantity: parseInt(item.quantity) || 1,
                    category_id: item.product?.category_id,
                    unit_id: item.unit_id,
                    warehouse_id: requestData.warehouse_id,
                    department_id: requestData.department_id,
                    cost_center_id: requestData.cost_center_id,
                    sub_cost_center_id: requestData.sub_cost_center_id,
                    photo: item.photo,
                };

                await axios.post("/api/v1/rfq-requests", rfqRequestData);
            }

            // Update material request status to indicate RFQ was created
            await axios.put(`/api/v1/material-requests/${formData.material_request_id}`, {
                status: "Pending",
                description: "RFQ request created for items with no inventory"
            });

            onSave(formData);
            onClose();
        } catch (error) {
            setRfqError("Failed to create RFQ request. Please try again.");
        }
    };

    const handleDeclineRfq = () => {
        setShowRfqOption(false);
        setRfqError("");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] lg:w-1/2">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Issue Material to {requestData?.requester?.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {showRfqOption && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-red-600 mb-2">
                            No Inventory Available
                        </h3>
                        <p className="text-red-600 mb-4">
                            {rfqError}
                        </p>
                        <p className="text-black mb-4">
                            Would you like to send an RFQ request to procure these items?
                        </p>
                        <div className="flex space-x-4">
                            {rfqAlreadyRequested ? (
                                <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">RFQ already requested</span>
                            ) : (
                                <button
                                    onClick={handleCreateRfqRequest}
                                    className="px-4 py-2 bg-[#009FDC] text-white rounded-lg hover:bg-[#007CB8] transition-colors"
                                >
                                    Send RFQ Request
                                </button>
                            )}
                            <button
                                onClick={handleDeclineRfq}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <InputFloating
                                label="Request Number"
                                name="material_request_id"
                                value={formData.material_request_id}
                                onChange={handleChange}
                                disabled
                            />
                            {errors.material_request_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.material_request_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Items"
                                name="items"
                                value={formData.items}
                                onChange={handleChange}
                                disabled
                            />
                            {errors.items && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.items}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Cost Center"
                                name="cost_center_id"
                                value={formData.cost_center_id}
                                onChange={handleChange}
                                options={costCenters.map((c) => ({
                                    id: c.id,
                                    label: c.name,
                                }))}
                            />
                            {errors.cost_center_id && (
                                <p className="text-red-500 text-sm mt-1">
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
                                options={costCenters.map((c) => ({
                                    id: c.id,
                                    label: c.name,
                                }))}
                            />
                        </div>
                        <div>
                            <SelectFloating
                                label="Department"
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                options={departments.map((dep) => ({
                                    id: dep.id,
                                    label: dep.name,
                                }))}
                            />
                        </div>
                        <div>
                            <SelectFloating
                                label="Priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                options={[
                                    { id: "High", label: "High" },
                                    { id: "Medium", label: "Medium" },
                                    { id: "Low", label: "Low" },
                                ]}
                            />
                            {errors.priority && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.priority}
                                </p>
                            )}
                        </div>
                    </div>
                    <div
                        className={`grid ${
                            formData.status === "Pending" || formData.status === "Rejected"
                                ? "grid-cols-1 md:grid-cols-2"
                                : "grid-cols-1"
                        } gap-6`}
                    >
                        <div>
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { id: "Pending", label: "Pending" },
                                    { id: "Rejected", label: "Rejected" },
                                    { id: "Issue Material", label: "Issue Material" },
                                ]}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                        {(formData.status === "Pending" || formData.status === "Rejected") && (
                            <div>
                                <InputFloating
                                    label={formData.status === "Rejected" ? "Rejection Reason" : "Description"}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReceivedMRsModal;
