import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faEye } from "@fortawesome/free-solid-svg-icons";
import ReceivedMRsModal from "./ReceivedMRsModal";
import ViewRequestModal from "./ViewRequestModal";
import axios from "axios";
import { toast } from "react-hot-toast";

const ReceivedMRsTable = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState("All");

    const filters = ["All", "Issued", "Pending", "Rejected"];

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/material-requests', {
                params: {
                    include: 'requester,warehouse,department,costCenter,subCostCenter,status,items.product,items.unit,items.category,items.urgencyStatus',
                    page: currentPage,
                    per_page: 10
                }
            });
            
            if (response.data) {
                setRequests(response.data.data || []);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Error loading received material requests.");
            toast.error("Failed to load material requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentPage]);

    const statusColors = {
        "Pending": "text-yellow-500",
        "Issued": "text-green-500",
        "Rejected": "text-red-500"
    };

    const priorityColors = {
        High: "text-red-500",
        Medium: "text-orange-500",
        Low: "text-green-500",
        Normal: "text-green-500",
    };

    const getStatusCell = (status) => {
        const statusColors = {
            "Pending": "bg-yellow-100 text-yellow-800",
            "Issue Material": "bg-green-100 text-green-800",
            "Rejected": "bg-red-100 text-red-800"
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
                {status}
            </span>
        );
    };

    const handleViewRequest = async (request) => {
        try {
            const response = await axios.get(`/api/v1/issue-materials?filter[material_request_id]=${request.id}`);
            const issueMaterialData = response.data.data[0];
            
            console.log("ReceivedMRsTable - Issue Material API Response:", response.data);
            console.log("ReceivedMRsTable - Issue Material Data:", issueMaterialData);
            
            if (issueMaterialData) {
                const updatedRequest = {
                    ...request,
                    transaction: issueMaterialData,
                    description: issueMaterialData.description
                };
                console.log("ReceivedMRsTable - Updated Request:", updatedRequest);
                setSelectedRequest(updatedRequest);
            } else {
                console.log("ReceivedMRsTable - No issue material data found for request:", request.id);
                setSelectedRequest(request);
            }
            setIsViewModalOpen(true);
        } catch (error) {
            console.error('Error fetching issue material:', error);
            setSelectedRequest(request);
            setIsViewModalOpen(true);
        }
    };

    const handleEdit = (request) => {
        // Only allow editing if status is Pending
        if (request.status?.name !== "Pending") {
            toast.error("Only Pending requests can be modified");
            return;
        }
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleSave = async (formData) => {
        try {
            console.log('Starting handleSave with formData:', formData);
            console.log('Description from formData:', formData.description);
            console.log('Rejection reason from formData:', formData.rejection_reason);

            // If status is "Issue Material", check stock availability first
            if (formData.status === "Issue Material") {
                const currentRequest = requests.find(r => r.id === formData.material_request_id);
                console.log('Checking stock for request:', currentRequest);

                // Check stock for each item
                for (const item of currentRequest.items) {
                    const requestedQty = parseFloat(item.quantity);
                    const productId = item.product_id;
                    const warehouseId = currentRequest.warehouse_id;
                    const productName = item.product?.name || 'Unknown Product';

                    console.log('Stock check details:', {
                        requestedQuantity: requestedQty,
                        productId,
                        warehouseId
                    });

                    // Check current inventory quantity
                    const inventoryResponse = await axios.get(`/api/v1/inventories`, {
                        params: {
                            'filter[warehouse_id]': warehouseId,
                            'filter[product_id]': productId
                        }
                    });

                    if (inventoryResponse.data?.data?.length > 0) {
                        const currentInventory = inventoryResponse.data.data[0];
                        const currentQuantity = parseFloat(currentInventory.quantity) || 0;

                        console.log("Quantity calculation:", {
                            currentQuantity,
                            requestedQuantity: requestedQty
                        });

                        // Check if we have enough stock
                        if (currentQuantity < requestedQty) {
                            const errorMessage = `Cannot issue material! Insufficient stock for ${productName}.\n\nAvailable: ${currentQuantity} pieces\nRequested: ${requestedQty} pieces`;
                            alert(errorMessage);
                            return;
                        }
                    } else {
                        const errorMessage = `Cannot issue material! No inventory found for ${productName} in the selected warehouse.`;
                        // alert(errorMessage); // Removed duplicate popup
                        return;
                    }
                }
            }

            // Update material request status
            let statusId;
            if (formData.status === "Pending") {
                statusId = 1;
            } else if (formData.status === "Rejected") {
                statusId = 52;
            } else if (formData.status === "Issue Material") {
                statusId = 51;
            }

            const statusResponse = await axios.put(`/api/v1/material-requests/${formData.material_request_id}`, {
                status_id: statusId,
                rejection_reason: formData.status === "Rejected" ? formData.rejection_reason : null
            });
            console.log('Status update response:', statusResponse.data);

            // Only proceed with issue material creation if status is "Issue Material"
            if (formData.status === "Issue Material") {
                // Create issue material record
                const issueMaterialPayload = {
                    material_request_id: formData.material_request_id,
                    items: Array.isArray(formData.items) ? formData.items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.requestedQty,
                        unit_id: item.unit_id,
                        description: item.description || null
                    })) : [],
                    cost_center_id: formData.cost_center_id,
                    sub_cost_center_id: formData.sub_cost_center_id,
                    department_id: formData.department_id,
                    priority: formData.priority,
                    status: formData.status,
                    description: formData.description || null
                };
                
                console.log('Issue Material Payload:', issueMaterialPayload);
                
                const issueMaterialResponse = await axios.post('/api/v1/issue-materials', issueMaterialPayload);
                console.log('Issue materials response:', issueMaterialResponse.data);

                // Process stock operations
                await processStockOperations(formData);
            }

            toast.success('Request processed successfully');
            setIsModalOpen(false);
            
            // Force a complete refresh of the data
            setLoading(true);
            await fetchRequests();
            setLoading(false);
            
            // Update local state to reflect the new status
            const updatedRequests = requests.map(req => 
                req.id === formData.material_request_id 
                    ? { 
                        ...req, 
                        status: {
                            id: statusId,
                            name: formData.status === "Issue Material" ? "Issued" : 
                                  formData.status === "Rejected" ? "Rejected" : 
                                  formData.status === "Pending" ? "Pending" : "N/A"
                        }
                    }
                    : req
            );
            setRequests(updatedRequests);
        } catch (error) {
            console.error('Error processing request:', error);
            toast.error(error.response?.data?.message || 'Failed to process request');
        }
    };

    const filteredRequests = requests.filter((req) => {
        if (selectedFilter === "All") return true;
        return req.status?.name === selectedFilter;
    });

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    User Material Requests
                </h2>
                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-6 py-2 rounded-full text-xl transition ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Request #
                        </th>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Cost Centers</th>
                        <th className="py-3 px-4">Sub Cost Centers</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : filteredRequests.length > 0 ? (
                        filteredRequests.map((req) => (
                                <tr key={req.id}>
                                    <td className="py-3 px-4">MR-{req.id}</td>
                                    <td className="py-3 px-4">
                                        {req.requester?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            {req.items?.map((item, index) => (
                                                <span
                                                    key={index}
                                                    className="block"
                                                >
                                                    {item.product?.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.costCenter?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.subCostCenter?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {req.department?.name || "N/A"}
                                    </td>
                                    <td
                                        className={`py-3 px-4 ${
                                            priorityColors[
                                                req.items?.[0]?.urgency_status
                                                    ?.name
                                            ] || "text-gray-500"
                                        }`}
                                    >
                                        {req.items?.[0]?.urgency_status?.name ||
                                            "N/A"}
                                    </td>
                                    <td
                                        className={`py-3 px-4 font-semibold ${
                                            statusColors[req.status?.name] ||
                                            "text-gray-500"
                                        }`}
                                    >
                                        {req.status?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            {req.created_at
                                                ? new Date(
                                                      req.created_at
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            <span className="text-gray-400">
                                                {req.created_at
                                                    ? new Date(
                                                          req.created_at
                                                      ).toLocaleTimeString()
                                                    : ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                        <button
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            title="View Request"
                                            onClick={() => handleViewRequest(req)}
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        {req.status?.name === "Pending" && (
                                            <button
                                                onClick={() => {
                                                    handleEdit(req);
                                                }}
                                                className="text-[#9B9DA2] hover:text-gray-500"
                                                title="Issue Material Request"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faChevronRight}
                                                />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No User Material Requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && requests.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    {Array.from(
                        { length: lastPage },
                        (_, index) => index + 1
                    ).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 ${
                                currentPage === page
                                    ? "bg-[#009FDC] text-white"
                                    : "border border-[#B9BBBD] bg-white"
                            } rounded-full hover:bg-[#0077B6] transition`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                            currentPage >= lastPage
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        disabled={currentPage >= lastPage}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Render the modal */}
            {isModalOpen && (
                <ReceivedMRsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    requestData={selectedRequest}
                />
            )}

            {isViewModalOpen && (
                <ViewRequestModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    request={selectedRequest}
                />
            )}
        </div>
    );
};

export default ReceivedMRsTable;
