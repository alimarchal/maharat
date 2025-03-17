import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { usePage } from "@inertiajs/react";

const CostCenterModal = ({
    isOpen,
    onClose,
    costCenterData,
    fetchCostCenters,
}) => {
    const { props } = usePage();
    const userId = props.auth.user.id;

    const [formData, setFormData] = useState({
        department_id: "",
        code: "",
        name: "",
        cost_center_type: "",
        description: "",
        status: "",
        manager_id: userId,
        effective_start_date: new Date().toISOString(),
    });

    const [errors, setErrors] = useState({});
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users");
                setUsers(response.data.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        const fetchDepartments = async () => {
            try {
                const response = await axios.get("/api/v1/departments");
                setDepartments(response.data.data);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchUsers();
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (costCenterData) {
            setFormData({
                department_id: costCenterData.department_id || "",
                code: costCenterData.code || "",
                name: costCenterData.name || "",
                cost_center_type: costCenterData.cost_center_type || "",
                description: costCenterData.description || "",
                status: costCenterData.status || "",
                manager_id: costCenterData.manager_id || userId,
                effective_start_date:
                    costCenterData.effective_start_date ||
                    new Date().toISOString(),
            });
        }
    }, [costCenterData, userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.department_id)
            newErrors.department_id = "Department is required.";
        if (!formData.code) newErrors.code = "Code is required.";
        if (!formData.name) newErrors.name = "Name is required.";
        if (!formData.cost_center_type)
            newErrors.cost_center_type = "Cost Center Type is required.";
        if (!formData.status) newErrors.status = "Status is required.";
        if (!formData.manager_id) newErrors.manager_id = "Manager is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (costCenterData && costCenterData.id) {
                await axios.put(
                    `/api/v1/cost-centers/${costCenterData.id}`,
                    formData
                );
            } else {
                await axios.post("/api/v1/cost-centers", formData);
            }

            fetchCostCenters();
            onClose();
        } catch (error) {
            setErrors(error.response?.data.errors || {});
            console.error("Error saving cost center:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {costCenterData
                            ? "Edit Cost Center"
                            : "Add Cost Center"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <InputFloating
                                label="Code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                            />
                            {errors.code && (
                                <p className="text-red-500 text-sm">
                                    {errors.code}
                                </p>
                            )}
                        </div>
                        <div>
                            <InputFloating
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">
                                    {errors.name}
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
                        <div>
                            <SelectFloating
                                label="Cost Center Type"
                                name="cost_center_type"
                                value={formData.cost_center_type}
                                onChange={handleChange}
                                options={[
                                    { id: "Fixed", label: "Fixed" },
                                    { id: "Variable", label: "Variable" },
                                    { id: "Support", label: "Support" },
                                    { id: "Direct", label: "Direct" },
                                ]}
                            />
                            {errors.cost_center_type && (
                                <p className="text-red-500 text-sm">
                                    {errors.cost_center_type}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={[
                                    { id: "Approved", label: "Approved" },
                                    { id: "Pending", label: "Pending" },
                                ]}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-sm">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Manager"
                                name="manager_id"
                                value={formData.manager_id}
                                onChange={handleChange}
                                options={users.map((user) => ({
                                    id: user.id,
                                    label: user.name,
                                }))}
                                disabled
                            />
                            {errors.manager_id && (
                                <p className="text-red-500 text-sm">
                                    {errors.manager_id}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <InputFloating
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm">
                                {errors.description}
                            </p>
                        )}
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CostCenterModal;
