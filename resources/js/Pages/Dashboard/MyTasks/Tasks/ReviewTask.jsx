import React, { useState, useEffect } from "react";
import SelectFloating from "../../../../Components/SelectFloating";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { FiClock, FiCheck, FiX, FiRefreshCw, FiFileText, FiSettings, FiUser, FiSend } from "react-icons/fi";
import { FaTasks } from "react-icons/fa";

const ReviewTask = () => {
    const { id } = usePage().props;
    const logged_user = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        task_id: "",
        description: "",
        action: "",
        user_id: "",
    });

    const [taskData, setTaskData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (id) {
            setFormData((prevData) => ({ ...prevData, task_id: id }));
            fetchTaskDetails(id);
        }
    }, [id]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users");
                setEmployees(response.data.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    const fetchTaskDetails = async (taskId) => {
        try {
            const response = await axios.get(
                `/api/v1/tasks/${taskId}?include=processStep,process,assignedFromUser,assignedToUser,descriptions`
            );
            setTaskData(response.data.data);
        } catch (error) {
            console.error("Error fetching task details:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        let newErrors = {};
        if (!formData.description) newErrors.description = "Description is required";
        if (!formData.action) newErrors.action = "Action is required";
        if (formData.action === "Refer" && !formData.user_id)
            newErrors.user_id = "User is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            // Ensure task_id is set to the current task's ID
            const taskDescriptionData = {
                ...formData,
                task_id: taskData.id, // Set the task_id to the current task's ID
            };

            const response = await axios.post(
                "/api/v1/task-descriptions",
                taskDescriptionData
            );
            const taskDescription = response.data.data;

            const transactions = [
                {
                    key: "material_request_id",
                    url: "/api/v1/material-request-transactions",
                    processTitle: "Material Request",
                },
                {
                    key: "rfq_id",
                    url: "/api/v1/rfq-approval-transactions",
                    processTitle: "RFQ Approval",
                },
                {
                    key: "purchase_order_id",
                    url: "/api/v1/po-approval-transactions",
                    processTitle: "Purchase Order Approval",
                },
                {
                    key: "payment_order_id",
                    url: "/api/v1/payment-order-approval-trans",
                    processTitle: "Payment Order Approval",
                },
                {
                    key: "invoice_id",
                    url: "/api/v1/mahrat-invoice-approval-trans",
                    processTitle: "Maharat Invoice Approval",
                },
                {
                    key: "request_budgets_id",
                    url: "/api/v1/budget-request-approval-trans",
                    processTitle: "Budget Request Approval",
                },
                {
                    key: "budget_id",
                    url: "/api/v1/budget-approval-transactions",
                    processTitle: "Total Budget Approval",
                },
            ];

            for (const transaction of transactions) {
                const { key, url, processTitle } = transaction;
                const id = taskData[key];

                // Proceed only if ID is valid
                if (!id) continue;

                const processResponse = await axios.get(
                    `/api/v1/processes?include=steps,creator,updater&filter[title]=${encodeURIComponent(
                        processTitle
                    )}`
                );
                const process = processResponse?.data?.data?.[0];
                if (!process || !process.steps?.length) continue;

                // Get existing transactions for this item
                const transactionResponse = await axios.get(
                    `${url}?filter[${key}]=${id}`
                );
                const existingTransactions =
                    transactionResponse?.data?.data || [];
                const completedOrders = existingTransactions.map((t) =>
                    Number(t.order)
                );

                // Find next unprocessed step
                const nextStep = process.steps.find(
                    (step) => !completedOrders.includes(step.order)
                );
                if (!nextStep || !nextStep.id) continue; // All steps done

                // Get approver for the next step
                const stepUserResponse = await axios.get(
                    `/api/v1/process-steps/${nextStep.id}/user/${logged_user}`
                );
                const assignUser = stepUserResponse?.data?.data;

                const commonPayload = {
                    requester_id: logged_user,
                    assigned_to: assignUser?.approver_id,
                    order: String(nextStep.order),
                    description: nextStep.description,
                    status: taskDescription.action,
                    referred_to: taskDescription?.user_id || null,
                };
                const payload = { ...commonPayload, [key]: id };
                await axios.post(url, payload);

                // Show budget update notification for invoice approvals
                if (processTitle === "Maharat Invoice Approval" && taskDescription.action === "Approve") {
                    toast.success("Invoice approved! Budget revenue will be updated automatically if main budget exists.");
                }

                const taskPayload = {
                    process_step_id: nextStep.id,
                    process_id: nextStep.process_id,
                    assigned_at: new Date().toISOString(),
                    urgency: "Normal",
                    assigned_to_user_id: assignUser.approver_id || null,
                    assigned_from_user_id: logged_user,
                    read_status: null,
                    order_no: String(nextStep.order),
                    [key]: id,
                };
                await axios.post("/api/v1/tasks", taskPayload);

                // Note: The TaskController already handles updating the request_budgets table
                // when the task is approved, so we don't need to make an additional PUT request here
            }

            // Update task status if applicable
            if (taskDescription?.action && taskData?.id) {
                const statusMap = {
                    Approve: "Approved",
                    Refer: "Referred",
                    Reject: "Rejected",
                };

                const status = statusMap[taskDescription.action];

                if (status) {
                    const taskPayload = { status };
                    try {
                        const taskUpdateResponse = await axios.put(
                            `/api/v1/tasks/${taskData.id}`,
                            taskPayload
                        );
                    } catch (taskUpdateError) {
                        console.error("Task status update failed:", taskUpdateError);
                        console.error("Task update error response:", taskUpdateError.response?.data);

                        // Check for specific budget error in task update
                        if (taskUpdateError.response?.data?.error ==="NO_MAIN_BUDGET") {
                            const errorMessage = taskUpdateError.response.data.message || "Approval failed: No main budget found for this invoice's fiscal period.";
                            toast.error(errorMessage, { id: "budget-error-toast" });
                            return; // Don't navigate, stay on the page
                        } else {
                            const errorMessage = "Failed to update task status. Please try again.";
                            toast.error(errorMessage, { id: "budget-error-toast" });
                            return; // Don't navigate, stay on the page
                        }
                    }
                }
            }

            router.visit("/tasks");
        } catch (error) {
            console.error("Error submitting task:", error);
            console.error("Error response:", error.response);
            console.error("Error response data:", error.response?.data);

            // Check for specific budget error
            if (error.response?.data?.error === "NO_MAIN_BUDGET") {
                console.log("NO_MAIN_BUDGET error detected, showing toast");
                const errorMessage = error.response.data.message || "Approval failed: No main budget found for this invoice's fiscal period.";
                toast.error(errorMessage, { id: "budget-error-toast" });
            } else {
                console.log("Generic error, showing default message");
                const errorMessage = "Failed to process task. Please try again.";
                toast.error(errorMessage, { id: "budget-error-toast" });
            }
        }
    };

    // Helper function to get status color and icon
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return {
                    bgColor: "bg-yellow-100",
                    textColor: "text-yellow-800",
                    icon: <FiClock className="text-lg" />,
                };
            case "approved":
                return {
                    bgColor: "bg-green-100",
                    textColor: "text-green-800",
                    icon: <FiCheck className="text-lg" />,
                };
            case "rejected":
                return {
                    bgColor: "bg-red-100",
                    textColor: "text-red-800",
                    icon: <FiX className="text-lg" />,
                };
            case "in progress":
                return {
                    bgColor: "bg-blue-100",
                    textColor: "text-blue-800",
                    icon: <FiRefreshCw className="text-lg" />,
                };
            default:
                return {
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-800",
                    icon: <FiFileText className="text-lg" />,
                };
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#2C323C] mb-2">
                        Task Review
                    </h1>
                    <p className="text-gray-600">
                        Review and take action on your assigned task
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
                    {taskData ? (
                        <div className="space-y-8">
                            {/* Enhanced Task Overview */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-[#009FDC] via-[#0088C7] to-[#0071B2] rounded-3xl p-8 text-white">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24"></div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Header with task ID */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <FaTasks className="text-2xl text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold">
                                                    Task Overview
                                                </h2>
                                                <p className="text-white/80 text-sm">
                                                    ID: #{taskData.id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/80 text-sm">
                                                Assigned Date
                                            </p>
                                            <p className="font-semibold">
                                                {taskData.assigned_at
                                                    ? new Date(
                                                          taskData.assigned_at
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Main Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Process Card */}
                                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                                            <div className="flex items-center mb-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                    <FiSettings className="text-lg text-white" />
                                                </div>
                                                <h3 className="font-bold text-lg">
                                                    Process
                                                </h3>
                                            </div>
                                            <p className="text-white/90 text-base leading-relaxed">
                                                {taskData.process?.title ||
                                                    "No process assigned"}
                                            </p>
                                        </div>

                                        {/* Status Card */}
                                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                                            <div className="flex items-center mb-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                    {getStatusStyle(taskData.status).icon}
                                                </div>
                                                <h3 className="font-bold text-lg">
                                                    Status
                                                </h3>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        getStatusStyle(
                                                            taskData.status
                                                        ).bgColor
                                                    } ${
                                                        getStatusStyle(
                                                            taskData.status
                                                        ).textColor
                                                    }`}
                                                >
                                                    {taskData.status ||
                                                        "Pending"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description Card */}
                                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                                            <div className="flex items-center mb-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                    <FiFileText className="text-lg text-white" />
                                                </div>
                                                <h3 className="font-bold text-lg">
                                                    Description
                                                </h3>
                                            </div>
                                            <p className="text-white/90 text-base leading-relaxed">
                                                {taskData.process_step
                                                    ?.description ||
                                                    "No description available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Assigned From */}
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 bg-[#009FDC] rounded-full flex items-center justify-center">
                                            <FiUser className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#2C323C] ml-3">
                                            Assigned From
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Name:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_from_user
                                                        ?.name
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Role:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_from_user
                                                        ?.designation
                                                        ?.designation
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Email:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_from_user
                                                        ?.email
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Mobile:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_from_user
                                                        ?.mobile
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Assigned To */}
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 bg-[#009FDC] rounded-full flex items-center justify-center">
                                            <FiUser className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#2C323C] ml-3">
                                            Assigned To
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Name:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_to_user
                                                        ?.name
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Role:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_to_user
                                                        ?.designation
                                                        ?.designation
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Email:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_to_user
                                                        ?.email
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-[#2C323C] w-24">
                                                Mobile:
                                            </span>
                                            <span className="text-gray-700">
                                                {
                                                    taskData.assigned_to_user
                                                        ?.mobile
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Action Form */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-[#2C323C] mb-6">
                        Take Action
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Description */}
                        <div className="relative w-full">
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="peer border border-gray-300 p-5 rounded-2xl w-full h-36 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                            ></textarea>
                            <label
                                className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                            peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                            peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1
                            ${
                                formData.description
                                    ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                    : "top-4 text-base text-gray-400"
                            }`}
                            >
                                Description
                            </label>
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Action */}
                        <div className="w-full">
                            <SelectFloating
                                label="Action"
                                name="action"
                                value={formData.action}
                                onChange={handleChange}
                                options={[
                                    { id: "Approve", label: "Approve" },
                                    { id: "Reject", label: "Reject" },
                                    // { id: "Refer", label: "Refer" },
                                ]}
                            />
                            {errors.action && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.action}
                                </p>
                            )}
                        </div>

                        {/* User Selection (if referring) */}
                        {formData.action === "Refer" && (
                            <div className="w-full">
                                <SelectFloating
                                    label="User"
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleChange}
                                    options={employees.map((emp) => ({
                                        id: emp.id,
                                        label: emp.name,
                                    }))}
                                />
                                {errors.user_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.user_id}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto flex items-center justify-center"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewTask;
