import React, { useState, useEffect } from "react";
import SelectFloating from "../../../../Components/SelectFloating";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";

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
        if (!formData.description)
            newErrors.description = "Description is required";
        if (!formData.action) newErrors.action = "Action is required";
        if (formData.action === "Refer" && !formData.user_id)
            newErrors.user_id = "User is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            const response = await axios.post(
                "/api/v1/task-descriptions",
                formData
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

                // Special logic: if it's a Budget Request and action is Approve
                if (
                    key === "request_budgets_id" &&
                    formData.action === "Approve"
                ) {
                    const budgetRes = await axios.get(
                        `/api/v1/request-budgets/${id}`
                    );
                    const budgetData = budgetRes?.data?.data;
                    if (budgetData) {
                        const updatedPayload = {
                            approved_amount: budgetData.requested_amount,
                            balance_amount: budgetData.requested_amount,
                        };
                        await axios.put(
                            `/api/v1/request-budgets/${id}`,
                            updatedPayload
                        );
                    }
                }
            }

            // Update task status if applicable
            if (taskDescription?.action && taskDescription?.task_id) {
                const statusMap = {
                    Approve: "Approved",
                    Refer: "Referred",
                    Reject: "Rejected",
                };

                const status = statusMap[taskDescription.action];

                if (status) {
                    const taskPayload = { status };
                    await axios.put(
                        `/api/v1/tasks/${taskDescription.task?.id}`,
                        taskPayload
                    );
                }
            }

            router.visit("/tasks");
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full bg-white shadow-lg rounded-2xl p-6">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-6">
                    Task Review Details
                </h2>
                {taskData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-6 rounded-2xl shadow">
                            <h3 className="text-lg font-semibold mb-4">
                                Process Details
                            </h3>
                            <div className="text-[#2C323C] text-base font-medium">
                                <p>
                                    Title:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.process?.title}
                                    </span>
                                </p>
                                <p>
                                    Status:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.process?.status}
                                    </span>
                                </p>
                                <p>
                                    Description:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.process_step?.description}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl shadow">
                            <h3 className="text-lg font-semibold mb-4">
                                Status
                            </h3>
                            <div className="text-[#2C323C] text-base font-medium">
                                <p>
                                    Status:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl shadow">
                            <h3 className="text-lg font-semibold mb-4">
                                Assigned From
                            </h3>
                            <div className="text-[#2C323C] text-base font-medium">
                                <p>
                                    Name:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.assigned_from_user?.name}
                                    </span>
                                </p>
                                <p>
                                    Designation:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {
                                            taskData.assigned_from_user
                                                ?.designation?.designation
                                        }
                                    </span>
                                </p>
                                <p>
                                    Email:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.assigned_from_user?.email}
                                    </span>
                                </p>
                                <p>
                                    Mobile:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.assigned_from_user?.mobile}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl shadow">
                            <h3 className="text-lg font-semibold mb-4">
                                Assigned To
                            </h3>
                            <div className="text-[#2C323C] text-base font-medium">
                                <p>
                                    Name:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.assigned_to_user?.name}
                                    </span>
                                </p>
                                <p>
                                    Designation:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {
                                            taskData.assigned_to_user
                                                ?.designation?.designation
                                        }
                                    </span>
                                </p>
                                <p>
                                    Email:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.assigned_to_user?.email}
                                    </span>
                                </p>
                                <p>
                                    Mobile:
                                    <span className="ms-4 text-gray-600 font-normal">
                                        {taskData.assigned_to_user?.mobile}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                )}
            </div>
            <div className="w-full my-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 w-full">
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

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 w-full">
                        <div className="w-full">
                            <SelectFloating
                                label="Action"
                                name="action"
                                value={formData.action}
                                onChange={handleChange}
                                options={[
                                    { id: "Approve", label: "Approve" },
                                    { id: "Reject", label: "Reject" },
                                    { id: "Refer", label: "Refer" },
                                ]}
                            />
                            {errors.action && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.action}
                                </p>
                            )}
                        </div>
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
                </div>

                <div className="my-6 flex justify-center md:justify-end w-full">
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full md:w-auto"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewTask;
