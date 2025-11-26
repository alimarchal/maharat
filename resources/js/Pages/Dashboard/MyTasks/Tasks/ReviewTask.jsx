import React, { useState, useEffect } from "react";
import SelectFloating from "../../../../Components/SelectFloating";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import { toast } from "react-hot-toast";

const ReviewTask = () => {
    const { id } = usePage().props;
    const logged_user = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        task_id: "",
        description: "",
        action: "",
        user_id: "",
        new_destination_sub_cost_center_id: "",
    });

    const [taskData, setTaskData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableAlternatives, setAvailableAlternatives] = useState([]);

    useEffect(() => {
        if (id) {
            setFormData((prevData) => ({ ...prevData, task_id: id }));
            fetchTaskDetails(id);
        }
    }, [id]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users?per_page=1000000");
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
                `/api/v1/tasks/${taskId}?include=processStep,process,assignedFromUser,assignedToUser,descriptions,request_budget,request_budget.department,request_budget.costCenter,request_budget.fiscalPeriod,request_budget.subCostCenter,request_budget.reallocateToSubCostCenter,request_budget.originalDestinationSubCostCenter,request_budget.updatedDestinationSubCostCenter,request_budget.updatedByUser,request_budget.purchaseOrder`
            );
            setTaskData(response.data.data);
            
            // If this is a reallocation request, load available alternatives
            if (response.data.data.process?.title === "Budget Reallocate Approval" && 
                response.data.data.request_budget?.type === 'reallocation') {
                if (response.data.data.request_budget?.available_alternatives_json) {
                    try {
                        const alternatives = JSON.parse(response.data.data.request_budget.available_alternatives_json);
                        setAvailableAlternatives(Array.isArray(alternatives) ? alternatives : []);
                    } catch (e) {
                        console.error("Error parsing alternatives:", e);
                        setAvailableAlternatives([]);
                    }
                } else {
                    // If available_alternatives_json doesn't exist, set empty array
                    setAvailableAlternatives([]);
                }
            } else {
                setAvailableAlternatives([]);
            }
            
            console.log("=== FRONTEND: TASK LOADED ===", {
                taskId: response.data.data.id,
                status: response.data.data.status,
                assignedFromUserId: response.data.data.assigned_from_user_id,
                assignedToUserId: response.data.data.assigned_to_user_id,
                continueApprovalFlow: response.data.data.continue_approval_flow,
                materialRequestId: response.data.data.material_request_id,
                rfqId: response.data.data.rfq_id,
                purchaseOrderId: response.data.data.purchase_order_id
            });
        } catch (error) {
            console.error("Error fetching task details:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        let newErrors = {};
        if (!formData.description) newErrors.description = "Description is required";
        if (!formData.action) newErrors.action = "Action is required";
        if (formData.action === "Refer" && !formData.user_id)
            newErrors.user_id = "User is required";
        if (formData.action === "Update Sub Cost Center" && !formData.new_destination_sub_cost_center_id)
            newErrors.new_destination_sub_cost_center_id = "New destination sub cost center is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            console.log("=== FRONTEND: APPROVAL PROCESS STARTED ===", {
                taskId: taskData.id,
                formData: formData,
                taskData: taskData,
                continueApprovalFlow: taskData.continue_approval_flow
            });

            // Handle "Update Sub Cost Center" action separately
            // This action updates the destination AND approves the current task
            if (formData.action === "Update Sub Cost Center") {
                if (!taskData.request_budget?.id) {
                    toast.error("Request budget not found");
                    setIsSubmitting(false);
                    return;
                }

                try {
                    // Step 1: Update the destination sub cost center
                    const updateResponse = await axios.put(
                        `/api/v1/request-budgets/${taskData.request_budget.id}/update-destination`,
                        {
                            new_destination_sub_cost_center_id: formData.new_destination_sub_cost_center_id
                        }
                    );

                    if (!updateResponse.data.success) {
                        toast.error(updateResponse.data.message || "Failed to update destination");
                        setIsSubmitting(false);
                        return;
                    }

                    toast.success("Destination sub cost center updated successfully");
                    
                    // Step 2: Refresh task data to get updated information
                    await fetchTaskDetails(taskData.id);
                    const refreshedTaskData = await axios.get(
                        `/api/v1/tasks/${taskData.id}?include=processStep,process,assignedFromUser,assignedToUser,descriptions,request_budget,request_budget.department,request_budget.costCenter,request_budget.fiscalPeriod,request_budget.subCostCenter,request_budget.reallocateToSubCostCenter,request_budget.originalDestinationSubCostCenter,request_budget.updatedDestinationSubCostCenter,request_budget.updatedByUser,request_budget.purchaseOrder`
                    );
                    const updatedTaskData = refreshedTaskData.data.data;
                    
                    // Step 3: Create task description with "Approve" action
                    const taskDescriptionData = {
                        task_id: taskData.id,
                        description: formData.description || "Updated destination sub cost center and approved",
                        action: "Approve", // Treat update as approval
                        user_id: "",
                    };
                    const descriptionResponse = await axios.post("/api/v1/task-descriptions", taskDescriptionData);
                    const taskDescription = descriptionResponse.data.data;

                    // Step 4: Update task status to "Approved"
                    const taskPayload = { status: "Approved" };
                    await axios.put(`/api/v1/tasks/${taskData.id}`, taskPayload);

                    // Step 5: If continue_approval_flow is 1, create next approval transaction and task
                    if (taskDescription.action === "Approve" && updatedTaskData.continue_approval_flow == 1) {
                        // Skip frontend task creation for GRN tasks - backend handles it
                        if (updatedTaskData.grn_id) {
                            console.log("=== FRONTEND: SKIPPING NEXT APPROVAL CREATION - GRN TASK ===");
                        } else {
                            // Get the process and find the next step
                            const process = updatedTaskData.process;
                            if (!process) {
                                console.error("Process not found for task");
                                router.visit("/tasks");
                                return;
                            }

                            const currentStep = updatedTaskData.process_step;
                            if (!currentStep) {
                                console.error("Current process step not found");
                                router.visit("/tasks");
                                return;
                            }

                            // Find the next step
                            const processStepsResponse = await axios.get(
                                `/api/v1/process-steps?filter[process_id]=${process.id}&sort=order`
                            );
                            const allSteps = processStepsResponse.data.data;
                            const nextStep = allSteps.find(step => step.order > currentStep.order);

                            if (nextStep) {
                                // Get approver for next step
                                const approverResponse = await axios.get(
                                    `/api/v1/process-step-users?filter[process_step_id]=${nextStep.id}&filter[user_id]=${logged_user}`
                                );
                                const approvers = approverResponse.data.data;
                                const assignUser = approvers.length > 0 ? approvers[0] : null;

                                if (assignUser?.approver_id) {
                                    // Determine the process type and create appropriate approval transaction
                                    const processTitle = process.title;
                                    let url = "";
                                    let payload = {};
                                    let key = "";

                                    if (processTitle === "Material Request Approval") {
                                        url = "/api/v1/material-request-approval-transactions";
                                        key = "material_request_id";
                                        payload = {
                                            material_request_id: updatedTaskData.material_request_id,
                                            requester_id: logged_user,
                                            assigned_to: assignUser.approver_id,
                                            order: nextStep.order,
                                            description: nextStep.description,
                                            status: "Pending",
                                        };
                                    } else if (processTitle === "RFQ Approval") {
                                        url = "/api/v1/rfq-approval-transactions";
                                        key = "rfq_id";
                                        payload = {
                                            rfq_id: updatedTaskData.rfq_id,
                                            requester_id: logged_user,
                                            assigned_to: assignUser.approver_id,
                                            order: nextStep.order,
                                            description: nextStep.description,
                                            status: "Pending",
                                        };
                                    } else if (processTitle === "Purchase Order Approval") {
                                        url = "/api/v1/po-approval-transactions";
                                        key = "purchase_order_id";
                                        payload = {
                                            purchase_order_id: updatedTaskData.purchase_order_id,
                                            requester_id: logged_user,
                                            assigned_to: assignUser.approver_id,
                                            order: nextStep.order,
                                            description: nextStep.description,
                                            status: "Pending",
                                        };
                                    } else if (processTitle === "Budget Reallocate Approval") {
                                        url = "/api/v1/budget-request-approval-trans";
                                        key = "request_budgets_id";
                                        payload = {
                                            request_budgets_id: updatedTaskData.request_budget?.id,
                                            requester_id: logged_user,
                                            assigned_to: assignUser.approver_id,
                                            order: nextStep.order,
                                            description: nextStep.description,
                                            status: "Pending",
                                        };
                                    }

                                    if (url && Object.keys(payload).length > 0) {
                                        await axios.post(url, payload);

                                        const taskPayload = {
                                            process_step_id: nextStep.id,
                                            process_id: process.id,
                                            assigned_at: new Date().toISOString(),
                                            urgency: "Normal",
                                            assigned_to_user_id: assignUser.approver_id || null,
                                            assigned_from_user_id: logged_user,
                                            read_status: null,
                                            order_no: String(nextStep.order),
                                            [key]: updatedTaskData[key] || updatedTaskData.request_budget?.id,
                                        };

                                        await axios.post("/api/v1/tasks", taskPayload);
                                    }
                                }
                            }
                        }
                    }

                    router.visit("/tasks");
                } catch (error) {
                    console.error("Error updating destination and approving:", error);
                    toast.error(error.response?.data?.message || "Failed to update destination sub cost center and approve");
                } finally {
                    setIsSubmitting(false);
                }
                return;
            }

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

            console.log("=== FRONTEND: TASK DESCRIPTION CREATED ===", {
                taskId: taskData.id,
                taskDescription: taskDescription,
                action: taskDescription.action,
                continueApprovalFlow: taskData.continue_approval_flow
            });

            // Only proceed with next task assignment if action is "Approve"
            // AND the task should continue approval flow (not a referral response)
            console.log("=== FRONTEND: CHECKING TASK FOR NEXT APPROVAL CREATION ===", {
                taskId: taskData.id,
                action: taskDescription.action,
                assignedFromUserId: taskData.assigned_from_user_id,
                continueApprovalFlow: taskData.continue_approval_flow,
                status: taskData.status,
                assignedToUserId: taskData.assigned_to_user_id,
                materialRequestId: taskData.material_request_id,
                rfqId: taskData.rfq_id,
                purchaseOrderId: taskData.purchase_order_id,
                taskDataKeys: Object.keys(taskData)
            });

            if (taskDescription.action === "Approve" && taskData.continue_approval_flow == 1) {
                // Skip frontend task creation for GRN tasks - backend handles it
                if (taskData.grn_id) {
                    console.log("=== FRONTEND: SKIPPING NEXT APPROVAL CREATION - GRN TASK ===", {
                        taskId: taskData.id,
                        action: taskDescription.action,
                        grnId: taskData.grn_id,
                        reason: "GRN tasks are handled by backend"
                    });
                } else {
                    console.log("=== FRONTEND: PROCEEDING WITH NEXT APPROVAL CREATION ===", {
                        taskId: taskData.id,
                        action: taskDescription.action,
                        assignedFromUserId: taskData.assigned_from_user_id,
                        continueApprovalFlow: taskData.continue_approval_flow,
                        reason: "continue_approval_flow is 1"
                    });
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
                        processTitle: taskData.process?.title || "Budget Request Approval", // Use actual process from task
                    },
                    {
                        key: "budget_id",
                        url: "/api/v1/budget-approval-transactions",
                        processTitle: "Total Budget Approval",
                    },
                    {
                        key: "grn_id",
                        url: "/api/v1/grn-approval-transactions",
                        processTitle: "Short Delivery Adjustment Approval",
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
                    const completedOrders = existingTransactions.map((t) => String(t.order));

                    // Check if current step is the final approval step BEFORE finding next step
                    const currentStepOrder = taskData.order_no;
                    const totalSteps = process.steps.length;
                    
                    // For referral response tasks (assignedFromUserId exists), check if this is the original approver
                    // making the final decision. If so, treat it as final approval regardless of step order.
                    const isReferralResponseTask = taskData.assigned_from_user_id && taskData.continue_approval_flow === 0;
                    // Only treat as final decision after referral if it's actually a referral scenario
                    // AND the current step is the final step in the process
                    const isOriginalApproverFinalDecision = isReferralResponseTask && (currentStepOrder == totalSteps);
                    
                    // Final approval if: 1) Normal flow final step OR 2) Original approver making final decision after referral
                    const isFinalApproval = (currentStepOrder == totalSteps) || isOriginalApproverFinalDecision;
                    
                    console.log("=== FRONTEND: FINAL APPROVAL CHECK ===", {
                        taskId: taskData.id,
                        processTitle: processTitle,
                        currentStepOrder: currentStepOrder,
                        totalSteps: totalSteps,
                        assignedFromUserId: taskData.assigned_from_user_id,
                        continueApprovalFlow: taskData.continue_approval_flow,
                        isReferralResponseTask: isReferralResponseTask,
                        isOriginalApproverFinalDecision: isOriginalApproverFinalDecision,
                        isFinalApproval: isFinalApproval,
                        completedOrders: completedOrders
                    });

                    if (isFinalApproval) {
                        console.log("=== FRONTEND: SKIPPING NEXT APPROVAL CREATION - FINAL APPROVAL ===", {
                            taskId: taskData.id,
                            processTitle: processTitle,
                            currentStepOrder: currentStepOrder,
                            totalSteps: totalSteps,
                            assignedFromUserId: taskData.assigned_from_user_id,
                            continueApprovalFlow: taskData.continue_approval_flow,
                            isOriginalApproverFinalDecision: isOriginalApproverFinalDecision,
                            reason: isOriginalApproverFinalDecision ? "Original approver making final decision after referral" : "This is the final approval step"
                        });
                        continue; // Skip creating next approval - this is the final step
                    }

                    // Find next unprocessed step
                    const nextStep = process.steps.find(
                        (step) => !completedOrders.includes(String(step.order))
                    );
                    if (!nextStep || !nextStep.id) continue; // All steps done

                    // Check if a task already exists for this step to prevent duplicates
                    const existingTaskResponse = await axios.get(
                        `/api/v1/tasks?filter[${key}]=${id}&filter[process_step_id]=${nextStep.id}&filter[status]=Pending`
                    );
                    const existingTasks = existingTaskResponse?.data?.data || [];
                    
                    // If a task already exists for this step, skip creating a new one
                    if (existingTasks.length > 0) {
                        console.log(`Task already exists for ${processTitle} step ${nextStep.order}, skipping creation`);
                        continue;
                    }

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
                        status: "Pending",
                        referred_to: taskDescription?.user_id || null,
                    };
                    const payload = { ...commonPayload, [key]: id };
                    
                    console.log(`=== CREATING NEXT APPROVAL TRANSACTION ===`, {
                        processTitle,
                        [key]: id,
                        nextStepOrder: nextStep.order,
                        assignedTo: assignUser?.approver_id,
                        referredTo: taskDescription?.user_id,
                        payload
                    });
                    
                    await axios.post(url, payload);

                    // Show budget update notification for invoice approvals
                    if (processTitle === "Maharat Invoice Approval") {
                        toast.success("Invoice approved! Budget revenue will be updated automatically if main budget exists.");
                    }

                    const taskPayload = {
                        process_step_id: nextStep.id,
                        process_id: process.id, // Use process.id from the fetched process, not nextStep.process_id
                        assigned_at: new Date().toISOString(),
                        urgency: "Normal",
                        assigned_to_user_id: assignUser.approver_id || null,
                        assigned_from_user_id: logged_user,
                        read_status: null,
                        order_no: String(nextStep.order),
                        [key]: id,
                    };
                    
                    console.log(`=== CREATING NEXT TASK ===`, {
                        processTitle,
                        [key]: id,
                        nextStepOrder: nextStep.order,
                        assignedToUserId: assignUser.approver_id,
                        assignedFromUserId: logged_user,
                        taskPayload
                    });
                    
                    await axios.post("/api/v1/tasks", taskPayload);

                    // Note: The TaskController already handles updating the request_budgets table
                    // when the task is approved, so we don't need to make an additional PUT request here
                }
                }
            } else if (taskDescription.action === "Approve" && taskData.continue_approval_flow == 0) {
                console.log("=== FRONTEND: SKIPPING NEXT APPROVAL CREATION - REFERRAL RESPONSE ===", {
                    taskId: taskData.id,
                    action: taskDescription.action,
                    assignedFromUserId: taskData.assigned_from_user_id,
                    continueApprovalFlow: taskData.continue_approval_flow,
                    reason: "continue_approval_flow is 0 - this is a referral response"
                });
            } else {
                console.log("=== FRONTEND: SKIPPING NEXT APPROVAL CREATION - OTHER REASON ===", {
                    taskId: taskData.id,
                    action: taskDescription.action,
                    assignedFromUserId: taskData.assigned_from_user_id,
                    continueApprovalFlow: taskData.continue_approval_flow,
                    reason: "Action is not Approve or continue_approval_flow is not 1"
                });
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
                        
                        console.log("=== FRONTEND: TASK STATUS UPDATED ===", {
                            taskId: taskData.id,
                            action: taskDescription.action,
                            status: status,
                            response: taskUpdateResponse.data
                        });
                    } catch (taskUpdateError) {
                        console.error("=== FRONTEND: TASK UPDATE ERROR ===", {
                            taskId: taskData.id,
                            action: taskDescription.action,
                            error: taskUpdateError.response?.data || taskUpdateError.message
                        });
                        
                        // Check for specific budget error in task update
                        if (taskUpdateError.response?.data?.error === "NO_MAIN_BUDGET") {
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
            // Check for specific budget error
            if (error.response?.data?.error === "NO_MAIN_BUDGET") {
                const errorMessage = error.response.data.message || "Approval failed: No main budget found for this invoice's fiscal period.";
                toast.error(errorMessage, { id: "budget-error-toast" });
            } else {
                const errorMessage = "Failed to process task. Please try again.";
                toast.error(errorMessage, { id: "budget-error-toast" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Warning message when no alternatives are available for reallocation - shown above Task Review Details */}
            {(() => {
                const isReallocation = taskData?.process?.title === "Budget Reallocate Approval" && 
                                      taskData?.request_budget?.type === 'reallocation';
                // Check if this reallocation is from a purchase order (has purchase_order_id or purchase_order relationship)
                const hasPurchaseOrder = !!(taskData?.request_budget?.purchase_order_id || taskData?.request_budget?.purchase_order);
                const subCostCenterUpdated = taskData?.request_budget?.sub_cost_center_updated;
                const reallocateAmount = parseFloat(taskData?.request_budget?.reallocate_amount || 0);
                
                // DETAILED DEBUG LOGGING
                console.log("=== REALLOCATION WARNING CHECK - DETAILED ===", {
                    taskDataExists: !!taskData,
                    processTitle: taskData?.process?.title,
                    requestBudgetType: taskData?.request_budget?.type,
                    isReallocation,
                    purchase_order_id: taskData?.request_budget?.purchase_order_id,
                    purchaseOrder: taskData?.request_budget?.purchaseOrder,
                    hasPurchaseOrder,
                    subCostCenterUpdated,
                    reallocateAmount,
                    availableAlternativesCount: availableAlternatives.length,
                    availableAlternatives: availableAlternatives,
                    available_alternatives_json: taskData?.request_budget?.available_alternatives_json
                });
                
                // Only show warning for purchase order reallocations that don't have alternatives with sufficient budget
                if (!isReallocation) {
                    console.log("❌ NOT SHOWING: Not a reallocation request");
                    return null;
                }
                if (!hasPurchaseOrder) {
                    console.log("❌ NOT SHOWING: No purchase order linked");
                    return null;
                }
                if (subCostCenterUpdated) {
                    console.log("❌ NOT SHOWING: Sub cost center already updated");
                    return null;
                }
                if (reallocateAmount <= 0) {
                    console.log("❌ NOT SHOWING: Reallocation amount is 0 or invalid");
                    return null;
                }
                
                // Check if alternatives have sufficient budget for the reallocation amount
                // availableAlternatives comes from available_alternatives_json stored when PO was created
                // If empty array, it means no alternatives were found at PO creation time
                // If array has items but none have sufficient budget, warning should show
                const hasSufficientAlternatives = availableAlternatives.length > 0 && availableAlternatives.some(alt => {
                    const availableAmount = parseFloat(alt.available_amount || 0);
                    const isSufficient = availableAmount >= reallocateAmount && availableAmount > 0;
                    console.log("Checking alternative:", {
                        sub_cost_center_id: alt.sub_cost_center_id,
                        sub_cost_center_name: alt.sub_cost_center_name,
                        available_amount: availableAmount,
                        reallocate_amount: reallocateAmount,
                        isSufficient
                    });
                    return isSufficient;
                });
                
                // Show warning when there are NO alternatives OR no alternatives with sufficient budget
                const noAlternativesAvailable = availableAlternatives.length === 0 || !hasSufficientAlternatives;
                
                console.log("=== FINAL WARNING DECISION ===", {
                    hasSufficientAlternatives,
                    noAlternativesAvailable,
                    willShowWarning: noAlternativesAvailable,
                    reason: availableAlternatives.length === 0 ? "No alternatives found" : "No alternatives with sufficient budget"
                });
                
                if (noAlternativesAvailable) {
                    console.log("✅ SHOWING WARNING: No alternatives available or none have sufficient budget");
                    return (
                        <div className="w-full mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h4 className="text-sm font-medium text-yellow-800">
                                        No Alternative Sub Cost Center Available
                                    </h4>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            The purchase order cannot be approved through reallocation.
                                        </p>
                                        <p className="mt-2">
                                            You must request a new budget allocation for this sub cost center or use a different sub cost center that has budget available.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}
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
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full min-h-[60px] bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        />
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
                                options={
                                    (() => {
                                        const isReallocation = taskData?.process?.title === "Budget Reallocate Approval" && 
                                                              taskData?.request_budget?.type === 'reallocation';
                                        
                                        // For Budget Reallocate Approval process only
                                        if (isReallocation) {
                                            // Check if sub cost center has been updated (destination selected)
                                            const subCostCenterUpdated = taskData?.request_budget?.sub_cost_center_updated;
                                            const hasPurchaseOrder = !!taskData?.request_budget?.purchase_order_id;
                                            const reallocateAmount = parseFloat(taskData?.request_budget?.reallocate_amount || 0);
                                            
                                            // Check if alternatives have sufficient budget for the reallocation amount
                                            const hasSufficientAlternatives = availableAlternatives.some(alt => {
                                                const availableAmount = parseFloat(alt.available_amount || 0);
                                                return availableAmount >= reallocateAmount;
                                            });
                                            
                                            // Show "Update Sub Cost Center" only if not updated yet and alternatives with sufficient budget exist
                                            const canUpdateSubCostCenter = !subCostCenterUpdated && 
                                                                          hasSufficientAlternatives;
                                            
                                            // Check if there are no alternatives with sufficient budget for purchase order reallocation
                                            const noAlternativesAvailable = !subCostCenterUpdated && 
                                                                           hasPurchaseOrder &&
                                                                           (availableAlternatives.length === 0 || !hasSufficientAlternatives);
                                            
                                            const baseOptions = [];
                                            
                                            if (noAlternativesAvailable) {
                                                // If no alternatives with sufficient budget exist for purchase order reallocation, only allow Reject
                                                // This prevents the user from being stuck
                                                // Only show "Reject" - no other options available
                                                baseOptions.push({ id: "Reject", label: "Reject" });
                                                // Do NOT add "Refer" option when no alternatives exist
                                            } else {
                                                // Normal flow: Add "Update Sub Cost Center" if available (replaces Approve when not updated)
                                                if (canUpdateSubCostCenter) {
                                                    baseOptions.push({ id: "Update Sub Cost Center", label: "Update Sub Cost Center" });
                                                } else {
                                                    // Add "Approve" only if sub cost center has been updated
                                                    baseOptions.push({ id: "Approve", label: "Approve" });
                                                }
                                                
                                                // Always add "Reject"
                                                baseOptions.push({ id: "Reject", label: "Reject" });
                                                
                                                // Add "Refer" only if continue_approval_flow is not 0
                                                if (taskData?.continue_approval_flow != 0) {
                                                    baseOptions.push({ id: "Refer", label: "Refer" });
                                                }
                                            }
                                            
                                            return baseOptions;
                                        }
                                        
                                        // For all other processes (Purchase Order Approval, etc.) - normal flow
                                        if (taskData?.continue_approval_flow == 0) {
                                            return [
                                            { id: "Approve", label: "Approve" },
                                            { id: "Reject", label: "Reject" },
                                            ];
                                        } else {
                                            return [
                                            { id: "Approve", label: "Approve" },
                                            { id: "Reject", label: "Reject" },
                                            { id: "Refer", label: "Refer" },
                                            ];
                                        }
                                    })()
                                }
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
                                    options={employees
                                        .filter((emp) => ![2, 3, 4].includes(emp.id))
                                        .map((emp) => ({
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
                        {formData.action === "Update Sub Cost Center" && (
                            <div className="w-full">
                                <SelectFloating
                                    label="Take From Sub Cost Center"
                                    name="new_destination_sub_cost_center_id"
                                    value={formData.new_destination_sub_cost_center_id}
                                    onChange={handleChange}
                                    options={availableAlternatives
                                        .filter(alt => 
                                            alt.sub_cost_center_id != taskData?.request_budget?.reallocate_to_sub_cost_center &&
                                            alt.sub_cost_center_id != taskData?.request_budget?.updated_destination_sub_cost_center
                                        )
                                        .map((alt) => {
                                            const name = String(alt.sub_cost_center_name || '').trim();
                                            // Remove any trailing "0" that's not part of a number
                                            let cleanName = name;
                                            while (cleanName.endsWith('0') && cleanName.length > 1) {
                                                const secondLastChar = cleanName.charAt(cleanName.length - 2);
                                                if (!/\d/.test(secondLastChar)) {
                                                    cleanName = cleanName.slice(0, -1);
                                                } else {
                                                    break;
                                                }
                                            }
                                            const availableAmount = parseFloat(alt.available_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                            return {
                                                id: alt.sub_cost_center_id,
                                                label: cleanName, // Just the name for selected display
                                                displayLabel: `${cleanName}\nAvailable: ${availableAmount}`, // Name + Available on next line for dropdown
                                                availableAmount: availableAmount,
                                            };
                                        })}
                                />
                                {errors.new_destination_sub_cost_center_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.new_destination_sub_cost_center_id}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 mb-2 flex justify-center md:justify-end w-full">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-8 py-3 text-xl font-medium rounded-full transition duration-300 w-full md:w-auto ${
                            isSubmitting 
                                ? 'bg-gray-400 text-white cursor-not-allowed' 
                                : 'bg-[#009FDC] text-white hover:bg-[#007BB5]'
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            'Submit'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewTask;
