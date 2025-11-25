import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../../Components/SelectFloating";
import InputFloating from "../../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";

const ReallocateBudgetForm = () => {
    const { budgetRequestId, auth } = usePage().props;
    const user_id = auth.user.id;
    const isEditMode = !!budgetRequestId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [formData, setFormData] = useState({
        fiscal_period_id: "",
        department_id: "",
        cost_center_id: "",
        sub_cost_center: "",
        reallocate_sub_cost_center: "",
        reallocate_amount: "",
        attachment: null,
        reason_for_increase: "",
    });
    const [errors, setErrors] = useState({});
    const [fiscalYears, setFiscalYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [subCostCenters, setSubCostCenters] = useState([]);
    const [reallocateSubCostCenters, setReallocateSubCostCenters] = useState([]);
    const [currentAvailableBudget, setCurrentAvailableBudget] = useState(null);
    const [destinationAvailableBudget, setDestinationAvailableBudget] = useState(null);
    const [tempAttachment, setTempAttachment] = useState(null);
    const [existingAttachment, setExistingAttachment] = useState(null);
    const [uploadError, setUploadError] = useState("");
    const [originalReallocationData, setOriginalReallocationData] = useState(null);
    const [originalReallocateAmount, setOriginalReallocateAmount] = useState(null);
    const fileInputRef = React.useRef();

    useEffect(() => {
        const initializeData = async () => {
            await fetchInitialData();
            if (isEditMode) {
                await fetchReallocationRequest();
            }
        };
        
        initializeData();
    }, [budgetRequestId]);


    // Track if we're initializing edit mode to prevent useEffect hooks from running
    const [isInitializingEdit, setIsInitializingEdit] = useState(false);

    // Fetch departments when budget is selected (only in create mode)
    useEffect(() => {
        if (!isEditMode && !isInitializingEdit && formData.fiscal_period_id) {
            fetchDepartments();
            // Reset dependent fields
            setFormData(prev => ({
                ...prev,
                department_id: "",
                cost_center_id: "",
                sub_cost_center: "",
                reallocate_sub_cost_center: "",
            }));
            setCostCenters([]);
            setSubCostCenters([]);
            setReallocateSubCostCenters([]);
            setCurrentAvailableBudget(null);
        }
    }, [formData.fiscal_period_id, isEditMode, isInitializingEdit]);

    // Fetch cost centers when department is selected (only in create mode)
    useEffect(() => {
        if (!isEditMode && !isInitializingEdit && formData.fiscal_period_id && formData.department_id) {
            fetchCostCenters();
            // Reset dependent fields
            setFormData(prev => ({
                ...prev,
                cost_center_id: "",
                sub_cost_center: "",
                reallocate_sub_cost_center: "",
            }));
            setSubCostCenters([]);
            setReallocateSubCostCenters([]);
            setCurrentAvailableBudget(null);
        }
    }, [formData.fiscal_period_id, formData.department_id, isEditMode, isInitializingEdit]);

    // Fetch sub cost centers when cost center is selected (only in create mode)
    useEffect(() => {
        if (!isEditMode && !isInitializingEdit && formData.fiscal_period_id && formData.department_id && formData.cost_center_id) {
            fetchSubCostCenters();
            // Reset dependent fields
            setFormData(prev => ({
                ...prev,
                sub_cost_center: "",
                reallocate_sub_cost_center: "",
            }));
            setReallocateSubCostCenters([]);
            setCurrentAvailableBudget(null);
        }
    }, [formData.fiscal_period_id, formData.department_id, formData.cost_center_id, isEditMode, isInitializingEdit]);

    // Fetch current available budget and reallocate sub cost centers when sub cost center is selected (only in create mode)
    useEffect(() => {
        if (!isEditMode && !isInitializingEdit && formData.fiscal_period_id && formData.department_id && formData.cost_center_id && formData.sub_cost_center) {
            fetchCurrentAvailableBudget();
            fetchReallocateSubCostCenters();
            setFormData(prev => ({
                ...prev,
                reallocate_sub_cost_center: "",
            }));
            setDestinationAvailableBudget(null);
        }
    }, [formData.fiscal_period_id, formData.department_id, formData.cost_center_id, formData.sub_cost_center, isEditMode, isInitializingEdit]);

    // Fetch destination available budget when reallocate sub cost center is selected (only in create mode)
    useEffect(() => {
        if (!isEditMode && !isInitializingEdit && formData.fiscal_period_id && formData.department_id && formData.cost_center_id && formData.reallocate_sub_cost_center) {
            fetchDestinationAvailableBudget();
        }
    }, [formData.fiscal_period_id, formData.department_id, formData.cost_center_id, formData.reallocate_sub_cost_center, isEditMode, isInitializingEdit]);

    // Note: Removed real-time budget recalculation in edit mode
    // Budgets are calculated once when the form loads and don't update until saved

    // Function to fetch all pages of data
    const fetchAllPages = async (endpoint, params = {}) => {
        let allData = [];
        let currentPage = 1;
        let hasMorePages = true;

        while (hasMorePages) {
            try {
                const response = await axios.get(endpoint, {
                    params: {
                        ...params,
                        page: currentPage,
                        per_page: 100
                    }
                });

                if (response.data.data && response.data.data.length > 0) {
                    allData = [...allData, ...response.data.data];
                    currentPage++;
                    
                    // Check if there are more pages
                    if (response.data.meta && response.data.meta.current_page >= response.data.meta.last_page) {
                        hasMorePages = false;
                    }
                } else {
                    hasMorePages = false;
                }
            } catch (error) {
                console.error(`Error fetching page ${currentPage} from ${endpoint}:`, error);
                hasMorePages = false;
            }
        }

        return allData;
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/v1/fiscal-periods?filter[status]=open");
            setFiscalYears(response.data.data);
            setDataLoaded(true);
        } catch (error) {
            console.error("Error fetching initial data", error);
            setErrors((prev) => ({
                ...prev,
                fetchError: "Failed to load necessary data. Please refresh and try again.",
            }));
        } finally {
            setLoading(false);
        }
    };

    const fetchReallocationRequest = async () => {
        setIsInitializingEdit(true);
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/request-budgets/${budgetRequestId}?include=fiscalPeriod,department,costCenter,subCostCenter,reallocateToSubCostCenter,reallocationHistory`
            );
            const reallocationRequest = response.data.data;

            // Store original data for use in submit
            setOriginalReallocationData(reallocationRequest);

            // Store values for use in fetch functions (before state update)
            // Convert to strings to match SelectFloating component expectations
            const fiscalPeriodId = reallocationRequest.fiscal_period_id ? String(reallocationRequest.fiscal_period_id) : "";
            const departmentId = reallocationRequest.department_id ? String(reallocationRequest.department_id) : "";
            const costCenterId = reallocationRequest.cost_center_id ? String(reallocationRequest.cost_center_id) : "";
            const subCostCenter = reallocationRequest.sub_cost_center ? String(reallocationRequest.sub_cost_center) : "";
            const reallocateSubCostCenter = reallocationRequest.reallocate_to_sub_cost_center ? String(reallocationRequest.reallocate_to_sub_cost_center) : "";
            
            // Get reallocate_amount from history if available (preserves original value even after approval)
            const reallocateAmount = reallocationRequest.reallocation_history?.reallocate_amount 
                || reallocationRequest.reallocate_amount 
                || "";
            
            // Store original reallocate amount for comparison
            setOriginalReallocateAmount(parseFloat(reallocateAmount) || 0);

            // Populate form data
            setFormData({
                fiscal_period_id: fiscalPeriodId,
                department_id: departmentId,
                cost_center_id: costCenterId,
                sub_cost_center: subCostCenter,
                reallocate_sub_cost_center: reallocateSubCostCenter,
                reallocate_amount: reallocateAmount,
                reason_for_increase: reallocationRequest.reason_for_increase || "",
                attachment: null,
            });

            // Handle existing attachment
            if (reallocationRequest.attachment_path) {
                const attachmentData = {
                    file_path: reallocationRequest.attachment_path,
                    original_name: reallocationRequest.original_name || reallocationRequest.attachment_path.split('/').pop() || 'Document'
                };
                setExistingAttachment(attachmentData);
            } else {
                setExistingAttachment(null);
            }

            // Use the department from the API response (only need the selected one for edit mode)
            if (reallocationRequest.department) {
                setDepartments([reallocationRequest.department]);
            }

            // Use the cost center from the API response (only need the selected one for edit mode)
            if (reallocationRequest.cost_center) {
                setCostCenters([reallocationRequest.cost_center]);
            }

            // Use the sub cost center from the API response (only need the selected one for edit mode)
            if (reallocationRequest.sub_cost_center_details) {
                setSubCostCenters([reallocationRequest.sub_cost_center_details]);
            }

            if (costCenterId) {
                // For "Move To" dropdown, we need all sub cost centers in the same cost center (excluding the source)
                // This is the only list we need to fetch for edit mode
                if (subCostCenter) {
                    // Fetch sub cost centers - only fetch what we need for the "Move To" dropdown
                    const subCostCenterBudgets = await fetchAllPages("/api/v1/request-budgets", {
                        "filter[fiscal_period_id]": fiscalPeriodId,
                        "filter[department_id]": departmentId,
                        "filter[cost_center_id]": costCenterId,
                        "filter[status]": "Approved",
                        include: "subCostCenter",
                    });
                    
                    // Process for "Move To" sub cost centers (exclude the selected "Move From" sub cost center)
                    const uniqueReallocateSubCostCenters = [];
                    const reallocateSubCostCenterMap = new Map();
                    subCostCenterBudgets.forEach((budget) => {
                        if (budget.sub_cost_center_details && budget.sub_cost_center_details.id && 
                            String(budget.sub_cost_center_details.id) !== subCostCenter && 
                            !reallocateSubCostCenterMap.has(budget.sub_cost_center_details.id)) {
                            reallocateSubCostCenterMap.set(budget.sub_cost_center_details.id, budget.sub_cost_center_details);
                            uniqueReallocateSubCostCenters.push(budget.sub_cost_center_details);
                        }
                    });
                    setReallocateSubCostCenters(uniqueReallocateSubCostCenters);

                    // Use source_new_balance and destination_new_balance from history record
                    if (reallocationRequest.reallocation_history) {
                        const history = reallocationRequest.reallocation_history;
                        
                        // Set source available budget from source_new_balance
                        if (history.source_new_balance !== null && history.source_new_balance !== undefined) {
                            setCurrentAvailableBudget(parseFloat(history.source_new_balance) || 0);
                        } else {
                            setCurrentAvailableBudget(0);
                        }
                        
                        // Set destination available budget from destination_new_balance
                        if (reallocateSubCostCenter) {
                            if (history.destination_new_balance !== null && history.destination_new_balance !== undefined) {
                                setDestinationAvailableBudget(parseFloat(history.destination_new_balance) || 0);
                            } else {
                                setDestinationAvailableBudget(0);
                            }
                        }
                    } else {
                        // Fallback: if no history record, fetch current budgets
                        if (subCostCenter) {
                            const [sourceBudgetResponse, destBudgetResponse] = await Promise.all([
                                axios.get("/api/v1/request-budgets", {
                                    params: {
                                        "filter[fiscal_period_id]": fiscalPeriodId,
                                        "filter[department_id]": departmentId,
                                        "filter[cost_center_id]": costCenterId,
                                        "filter[sub_cost_center]": subCostCenter,
                                        "filter[status]": "Approved",
                                        per_page: 1,
                                    },
                                }),
                                reallocateSubCostCenter ? axios.get("/api/v1/request-budgets", {
                                    params: {
                                        "filter[fiscal_period_id]": fiscalPeriodId,
                                        "filter[department_id]": departmentId,
                                        "filter[cost_center_id]": costCenterId,
                                        "filter[sub_cost_center]": reallocateSubCostCenter,
                                        "filter[status]": "Approved",
                                        per_page: 1,
                                    },
                                }) : Promise.resolve({ data: { data: [] } })
                            ]);
                            
                            // Fallback calculation
                            if (sourceBudgetResponse.data.data && sourceBudgetResponse.data.data.length > 0) {
                                const budget = sourceBudgetResponse.data.data[0];
                                setCurrentAvailableBudget(parseFloat(budget.balance_amount) || 0);
                            } else {
                                setCurrentAvailableBudget(0);
                            }

                            if (reallocateSubCostCenter && destBudgetResponse.data.data && destBudgetResponse.data.data.length > 0) {
                                const destBudget = destBudgetResponse.data.data[0];
                                setDestinationAvailableBudget(parseFloat(destBudget.balance_amount) || 0);
                            } else if (reallocateSubCostCenter) {
                                setDestinationAvailableBudget(0);
                            }
                        }
                    }
                }
            }

            setIsInitializingEdit(false); // Allow useEffect hooks to run again after initialization
            setDataLoaded(true);
        } catch (error) {
            console.error("=== ERROR FETCHING REALLOCATION REQUEST ===", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response?.data,
                stack: error.stack,
            });
            setErrors((prev) => ({
                ...prev,
                fetchError: "Failed to load reallocation request data.",
            }));
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const allBudgets = await fetchAllPages("/api/v1/request-budgets", {
                "filter[fiscal_period_id]": formData.fiscal_period_id,
                "filter[status]": "Approved",
                include: "department",
            });

            // Extract unique departments from the response
            const uniqueDepartments = [];
            const departmentMap = new Map();

            allBudgets.forEach((budget) => {
                if (budget.department && !departmentMap.has(budget.department.id)) {
                    departmentMap.set(budget.department.id, budget.department);
                    uniqueDepartments.push(budget.department);
                }
            });

            setDepartments(uniqueDepartments);
        } catch (error) {
            console.error("Error fetching departments", error);
            setDepartments([]);
        }
    };

    const fetchCostCenters = async () => {
        try {
            const allBudgets = await fetchAllPages("/api/v1/request-budgets", {
                "filter[fiscal_period_id]": formData.fiscal_period_id,
                "filter[department_id]": formData.department_id,
                "filter[status]": "Approved",
                include: "costCenter",
            });

            // Extract unique cost centers from the response
            const uniqueCostCenters = [];
            const costCenterMap = new Map();

            allBudgets.forEach((budget) => {
                if (budget.cost_center && !costCenterMap.has(budget.cost_center.id)) {
                    costCenterMap.set(budget.cost_center.id, budget.cost_center);
                    uniqueCostCenters.push(budget.cost_center);
                }
            });

            setCostCenters(uniqueCostCenters);
        } catch (error) {
            console.error("Error fetching cost centers", error);
            setCostCenters([]);
        }
    };

    const fetchSubCostCenters = async () => {
        try {
            const allBudgets = await fetchAllPages("/api/v1/request-budgets", {
                "filter[fiscal_period_id]": formData.fiscal_period_id,
                "filter[department_id]": formData.department_id,
                "filter[cost_center_id]": formData.cost_center_id,
                "filter[status]": "Approved",
                include: "subCostCenter",
            });

            // Extract unique sub cost centers from the response
            const uniqueSubCostCenters = [];
            const subCostCenterMap = new Map();

            allBudgets.forEach((budget) => {
                if (budget.sub_cost_center_details && budget.sub_cost_center_details.id && !subCostCenterMap.has(budget.sub_cost_center_details.id)) {
                    subCostCenterMap.set(budget.sub_cost_center_details.id, budget.sub_cost_center_details);
                    uniqueSubCostCenters.push(budget.sub_cost_center_details);
                }
            });

            setSubCostCenters(uniqueSubCostCenters);
        } catch (error) {
            console.error("Error fetching sub cost centers", error);
            setSubCostCenters([]);
        }
    };

    const fetchCurrentAvailableBudget = async () => {
        try {
            const response = await axios.get("/api/v1/request-budgets", {
                params: {
                    "filter[fiscal_period_id]": formData.fiscal_period_id,
                    "filter[department_id]": formData.department_id,
                    "filter[cost_center_id]": formData.cost_center_id,
                    "filter[sub_cost_center]": formData.sub_cost_center,
                    "filter[status]": "Approved",
                    per_page: 1,
                },
            });

            if (response.data.data && response.data.data.length > 0) {
                const budget = response.data.data[0];
                setCurrentAvailableBudget(budget.balance_amount || 0);
            } else {
                setCurrentAvailableBudget(0);
            }
        } catch (error) {
            console.error("Error fetching current available budget", error);
            setCurrentAvailableBudget(null);
        }
    };

    const fetchReallocateSubCostCenters = async () => {
        try {
            const allBudgets = await fetchAllPages("/api/v1/request-budgets", {
                "filter[fiscal_period_id]": formData.fiscal_period_id,
                "filter[department_id]": formData.department_id,
                "filter[cost_center_id]": formData.cost_center_id,
                "filter[status]": "Approved",
                include: "subCostCenter",
            });

            // Extract unique sub cost centers, excluding the selected one
            const uniqueSubCostCenters = [];
            const subCostCenterMap = new Map();

            allBudgets.forEach((budget) => {
                if (
                    budget.sub_cost_center_details &&
                    budget.sub_cost_center_details.id &&
                    budget.sub_cost_center_details.id.toString() !== formData.sub_cost_center.toString() &&
                    !subCostCenterMap.has(budget.sub_cost_center_details.id)
                ) {
                    subCostCenterMap.set(budget.sub_cost_center_details.id, budget.sub_cost_center_details);
                    uniqueSubCostCenters.push(budget.sub_cost_center_details);
                }
            });

            setReallocateSubCostCenters(uniqueSubCostCenters);
        } catch (error) {
            console.error("Error fetching reallocate sub cost centers", error);
            setReallocateSubCostCenters([]);
        }
    };

    const fetchDestinationAvailableBudget = async () => {
        try {
            const response = await axios.get("/api/v1/request-budgets", {
                params: {
                    "filter[fiscal_period_id]": formData.fiscal_period_id,
                    "filter[department_id]": formData.department_id,
                    "filter[cost_center_id]": formData.cost_center_id,
                    "filter[sub_cost_center]": formData.reallocate_sub_cost_center,
                    "filter[status]": "Approved",
                    per_page: 1,
                },
            });

            if (response.data.data && response.data.data.length > 0) {
                const budget = response.data.data[0];
                setDestinationAvailableBudget(budget.balance_amount || 0);
            } else {
                setDestinationAvailableBudget(0);
            }
        } catch (error) {
            console.error("Error fetching destination available budget", error);
            setDestinationAvailableBudget(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Prevent editing restricted fields in edit mode
        if (isEditMode && [
            'fiscal_period_id',
            'department_id',
            'cost_center_id',
            'sub_cost_center',
            'reallocate_sub_cost_center'
        ].includes(name)) {
            return;
        }
        
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({ ...prev, [name]: undefined }));

        // Real-time validation for reallocate amount
        if (name === "reallocate_amount" && value) {
            const amount = parseFloat(value);
            if (isNaN(amount) || amount < 1) {
                setErrors((prev) => ({
                    ...prev,
                    reallocate_amount: "Reallocate amount must be greater than or equal to 1",
                }));
            } else if (currentAvailableBudget !== null && amount > currentAvailableBudget) {
                setErrors((prev) => ({
                    ...prev,
                    reallocate_amount: `Reallocate amount cannot exceed available budget (${currentAvailableBudget})`,
                }));
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempAttachment(file);
            setUploadError("");
            setErrors((prev) => ({ ...prev, attachment: undefined }));
        }
    };

    const validateForm = () => {
        const requiredFields = {
            fiscal_period_id: "Budget is required",
            department_id: "Department is required",
            cost_center_id: "Cost Center is required",
            sub_cost_center: "Sub Cost Center is required",
            reallocate_sub_cost_center: "Reallocate Sub Cost Center is required",
            reallocate_amount: "Reallocate Amount is required",
            reason_for_increase: "Reason is required",
        };

        const newErrors = {};
        Object.entries(requiredFields).forEach(([field, message]) => {
            if (!formData[field]) {
                newErrors[field] = message;
            }
        });

        // Validate reallocate amount is positive and not greater than available budget
        if (formData.reallocate_amount) {
            const amount = parseFloat(formData.reallocate_amount);
            if (isNaN(amount) || amount < 1) {
                newErrors.reallocate_amount = "Reallocate amount must be greater than or equal to 1";
            } else if (currentAvailableBudget !== null && amount > currentAvailableBudget) {
                newErrors.reallocate_amount = `Reallocate amount cannot exceed available budget (${currentAvailableBudget})`;
            }
        }

        // Check for attachment (only required in create mode, or if no existing attachment in edit mode)
        if (!isEditMode && !tempAttachment) {
            newErrors.attachment = "Attachment is required";
        } else if (isEditMode && !tempAttachment && !existingAttachment) {
            newErrors.attachment = "Attachment is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadAttachmentToServer = async (reallocationId, file) => {
        if (!file) return true;
        const formData = new FormData();
        formData.append("attachment", file);
        formData.append("request_budget_id", reallocationId);
        formData.append("type", "budget_reallocation");
        try {
            await axios.post("/api/v1/budget-request-attachments", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return true;
        } catch (error) {
            setUploadError(
                error.response?.data?.message || "Failed to upload attachment."
            );
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const submitData = {
                fiscal_period_id: formData.fiscal_period_id,
                department_id: formData.department_id,
                cost_center_id: formData.cost_center_id,
                sub_cost_center: formData.sub_cost_center,
                reallocate_to_sub_cost_center: formData.reallocate_sub_cost_center,
                reallocate_amount: parseFloat(formData.reallocate_amount),
                reason_for_increase: formData.reason_for_increase,
                type: "reallocation",
            };

            let reallocationId;

            if (isEditMode) {
                // Update existing reallocation request
                // Include all required fields from the original data
                submitData.status = originalReallocationData?.status || "Draft";
                submitData.previous_year_budget_amount = parseFloat(originalReallocationData?.previous_year_budget_amount) || 0;
                submitData.requested_amount = parseFloat(originalReallocationData?.requested_amount) || 0;
                submitData.revenue_planned = parseFloat(originalReallocationData?.revenue_planned) || 0;
                submitData.urgency = originalReallocationData?.urgency || "Low";
                submitData.previous_year_revenue = originalReallocationData?.previous_year_revenue ? parseFloat(originalReallocationData.previous_year_revenue) : null;
                submitData.current_year_revenue = originalReallocationData?.current_year_revenue ? parseFloat(originalReallocationData.current_year_revenue) : null;
                submitData.approved_amount = originalReallocationData?.approved_amount ? parseFloat(originalReallocationData.approved_amount) : null;
                submitData.reserved_amount = originalReallocationData?.reserved_amount ? parseFloat(originalReallocationData.reserved_amount) : null;
                submitData.consumed_amount = originalReallocationData?.consumed_amount ? parseFloat(originalReallocationData.consumed_amount) : null;
                submitData.balance_amount = originalReallocationData?.balance_amount ? parseFloat(originalReallocationData.balance_amount) : null;
                
                // Log what fields are being updated
                console.log('=== BUDGET REALLOCATE UPDATE ===', {
                    request_id: budgetRequestId,
                    fields_updated: {
                        reallocate_amount: {
                            old: originalReallocateAmount,
                            new: submitData.reallocate_amount,
                            changed: originalReallocateAmount !== submitData.reallocate_amount
                        },
                        reason_for_increase: {
                            old: originalReallocationData?.reason_for_increase || '',
                            new: submitData.reason_for_increase,
                            changed: (originalReallocationData?.reason_for_increase || '') !== submitData.reason_for_increase
                        }
                    },
                    fields_not_updated: {
                        fiscal_period_id: submitData.fiscal_period_id,
                        department_id: submitData.department_id,
                        cost_center_id: submitData.cost_center_id,
                        sub_cost_center: submitData.sub_cost_center,
                        reallocate_to_sub_cost_center: submitData.reallocate_to_sub_cost_center,
                        previous_year_budget_amount: submitData.previous_year_budget_amount,
                        requested_amount: submitData.requested_amount,
                        revenue_planned: submitData.revenue_planned,
                        urgency: submitData.urgency,
                        status: submitData.status
                    },
                    full_payload: submitData
                });
                
                const response = await axios.put(`/api/v1/request-budgets/${budgetRequestId}`, submitData);
                reallocationId = response.data.data?.id || budgetRequestId;

                if (!reallocationId) {
                    setErrors({
                        submit: "Failed to update reallocation request.",
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Upload new attachment if provided
                if (tempAttachment) {
                    const uploadSuccess = await uploadAttachmentToServer(reallocationId, tempAttachment);
                    if (!uploadSuccess) {
                        setErrors({
                            submit: "Failed to upload attachment. Please try again.",
                        });
                        setIsSubmitting(false);
                        return;
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }

                // Success - redirect back to list
                router.visit('/request-budgets');
                return;
            } else {
                // Create new reallocation request
                submitData.status = "Draft";
                const response = await axios.post("/api/v1/request-budgets", submitData);
                reallocationId = response.data.data?.id;

                if (!reallocationId) {
                    setErrors({
                        submit: "Failed to create reallocation request. No ID was returned.",
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Upload attachment if provided
                if (tempAttachment) {
                    const uploadSuccess = await uploadAttachmentToServer(reallocationId, tempAttachment);
                    if (!uploadSuccess) {
                        setErrors({
                            submit: "Failed to upload attachment. Please try again.",
                        });
                        setIsSubmitting(false);
                        return;
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }

                // Get the approval process and create approval transaction and task
                const processResponse = await axios.get(
                    "/api/v1/processes?include=steps,creator,updater&filter[title]=Budget Reallocate Approval"
                );
                
                const process = processResponse.data?.data?.[0];
                let processSteps = process?.steps || [];

                // Check if process and steps exist
                if (!process || processSteps.length === 0) {
                    setErrors({
                        submit: "No Process or steps found for Budget Reallocate Approval",
                    });
                    setIsSubmitting(false);
                    return;
                }
                
                // Sort process steps by order to get the first step
                processSteps = processSteps.sort((a, b) => a.order - b.order);
                const processStep = processSteps[0];

                const processResponseViaUser = await axios.get(
                    `/api/v1/process-steps/${processStep.id}/user/${user_id}`
                );
                
                const assignUser = processResponseViaUser?.data?.data;
                if (!assignUser) {
                    setErrors({
                        submit: "No assignee found for this process step and user",
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Create budget request transaction
                const transactionPayload = {
                    request_budgets_id: reallocationId,
                    requester_id: user_id,
                    assigned_to: assignUser.approver_id,
                    order: processStep.order,
                    description: processStep.description,
                    status: "Pending",
                };

                await axios.post(
                    "/api/v1/budget-request-approval-trans",
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
                    request_budgets_id: reallocationId,
                    status: "Pending",
                };

                await axios.post("/api/v1/tasks", taskPayload);

                router.visit("/request-budgets");
            }
        } catch (error) {
            console.error("Error saving reallocation request:", error);

            if (error.response?.data?.errors) {
                const backendErrors = {};
                Object.keys(error.response.data.errors).forEach((key) => {
                    backendErrors[key] = error.response.data.errors[key][0];
                });
                setErrors((prev) => ({ ...prev, ...backendErrors }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        error.message ||
                        "An error occurred while saving the reallocation request.",
                }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const ErrorMessage = ({ error }) => {
        if (!error) return null;
        return <p className="text-red-500 text-sm mt-1">{error}</p>;
    };

    if (loading || !dataLoaded) {
        return (
            <div className="w-full flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEditMode ? "Edit Reallocate Sub Cost Center Budget" : "Reallocate Sub Cost Center Budget"}
                    </h2>
                    <p className="text-[#7D8086] text-lg">
                        Reallocate budget from one sub cost center to another
                    </p>
                </div>
                <div className="w-full lg:w-1/3">
                    <SelectFloating
                        label="Budget"
                        name="fiscal_period_id"
                        value={formData.fiscal_period_id}
                        onChange={handleChange}
                        options={fiscalYears.map((year) => ({
                            id: year.id,
                            label: `${year.budget_name} (${year.period_name})`,
                        }))}
                        disabled={isEditMode}
                    />
                    <ErrorMessage error={errors.fiscal_period_id} />
                </div>
            </div>

            {(errors.fetchError || errors.submit) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-2">
                    <p>{errors.fetchError || errors.submit}</p>
                </div>
            )}

            <div className="flex items-center gap-4 w-full my-6">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    Request Details
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Department Name"
                            name="department_id"
                            value={formData.department_id ? String(formData.department_id) : ""}
                            onChange={handleChange}
                            options={departments.map((dept) => ({
                                id: String(dept.id),
                                label: dept.name,
                            }))}
                            disabled={isEditMode || !formData.fiscal_period_id}
                        />
                        <ErrorMessage error={errors.department_id} />
                    </div>
                    <div>
                        <SelectFloating
                            label="Cost Center"
                            name="cost_center_id"
                            value={formData.cost_center_id ? String(formData.cost_center_id) : ""}
                            onChange={handleChange}
                            options={costCenters.map((cost) => ({
                                id: String(cost.id),
                                label: cost.name,
                            }))}
                            disabled={isEditMode || !formData.department_id}
                        />
                        <ErrorMessage error={errors.cost_center_id} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Move From Sub Cost Center"
                            name="sub_cost_center"
                            value={formData.sub_cost_center ? String(formData.sub_cost_center) : ""}
                            onChange={handleChange}
                            options={subCostCenters.map((sub) => ({
                                id: String(sub.id),
                                label: sub.name,
                            }))}
                            disabled={isEditMode || !formData.cost_center_id}
                        />
                        <ErrorMessage error={errors.sub_cost_center} />
                    </div>
                    <div>
                        <InputFloating
                            label="Current Available Budget"
                            name="current_available_budget"
                            value={currentAvailableBudget !== null ? currentAvailableBudget : ""}
                            onChange={() => {}}
                            disabled
                            readOnly
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Move To Sub Cost Center"
                            name="reallocate_sub_cost_center"
                            value={formData.reallocate_sub_cost_center ? String(formData.reallocate_sub_cost_center) : ""}
                            onChange={handleChange}
                            options={reallocateSubCostCenters.map((sub) => ({
                                id: String(sub.id),
                                label: sub.name,
                            }))}
                            disabled={isEditMode || !formData.sub_cost_center}
                        />
                        <ErrorMessage error={errors.reallocate_sub_cost_center} />
                    </div>
                    <div>
                        <InputFloating
                            label="Current Available Budget"
                            name="current_available_budget_dest"
                            value={destinationAvailableBudget !== null ? destinationAvailableBudget : ""}
                            onChange={() => {}}
                            disabled
                            readOnly
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Enter Reallocate Amount"
                            name="reallocate_amount"
                            value={formData.reallocate_amount}
                            onChange={handleChange}
                            type="number"
                            min="1"
                            max={currentAvailableBudget !== null ? currentAvailableBudget : undefined}
                            step="0.01"
                        />
                        <ErrorMessage error={errors.reallocate_amount} />
                    </div>
                    <div>
                        <div>
                            <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                                <FontAwesomeIcon
                                    icon={faLink}
                                    className="text-[#009FDC] mr-2"
                                />
                                {tempAttachment ? (
                                    <span className="text-gray-700 text-sm overflow-hidden text-ellipsis max-w-[80%]">
                                        {tempAttachment.name}
                                    </span>
                                ) : existingAttachment ? (
                                    <span 
                                        className="text-blue-600 text-sm overflow-hidden text-ellipsis max-w-[80%] hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const filePath = existingAttachment.file_path;
                                            if (filePath) {
                                                const fixedPath = filePath.startsWith("http") 
                                                    ? filePath 
                                                    : filePath.startsWith("/storage/") 
                                                        ? filePath 
                                                        : `/storage/${filePath}`;
                                                window.open(fixedPath, "_blank");
                                            }
                                        }}
                                    >
                                        {existingAttachment.original_name}
                                    </span>
                                ) : (
                                    <span className="text-sm">
                                        {isEditMode
                                            ? "Update Attachment"
                                            : "Attachment"}
                                    </span>
                                )}
                                <input
                                    type="file"
                                    name="attachment"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    ref={fileInputRef}
                                />
                            </label>
                            {uploadError && (
                                <div className="text-red-500 text-xs mt-1 text-center">{uploadError}</div>
                            )}
                            {errors.attachment && (
                                <div className="text-red-500 text-xs mt-1 text-center">{errors.attachment}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <div className="relative w-full">
                        <textarea
                            name="reason_for_increase"
                            value={formData.reason_for_increase}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-5 rounded-2xl w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        ></textarea>
                        <label
                            className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                    ${
                                        formData.reason_for_increase
                                            ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                                            : "top-4 text-base text-gray-400"
                                    }
                                    peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1`}
                        >
                            Reasons for increase
                        </label>
                    </div>
                    <ErrorMessage error={errors.reason_for_increase} />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className={`text-white text-lg font-medium px-6 py-3 rounded-full ${
                            isSubmitting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[#009FDC] hover:bg-[#007CB8]"
                        }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update" : "Save")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReallocateBudgetForm;

