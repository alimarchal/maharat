import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";
import { usePage } from "@inertiajs/react";

const SubCostCenterModal = ({
    isOpen,
    onClose,
    subCostCenterData,
    fetchSubCostCenters,
}) => {
    const { props } = usePage();
    const userId = props.auth.user.id;

    const [formData, setFormData] = useState({
        code: "",
        parent_id: "",
        department_id: "",
        name: "",
        cost_center_type: "",
        manager_id: userId,
        status: "",
        description: "",
        effective_start_date: new Date().toISOString(),
    });

    const [errors, setErrors] = useState({});
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, departmentsRes, costCentersRes] =
                    await Promise.all([
                        axios.get("/api/v1/users"),
                        axios.get("/api/v1/departments"),
                        axios.get("/api/v1/cost-centers"),
                    ]);
                setUsers(usersRes.data.data);
                setDepartments(departmentsRes.data.data);
                setCostCenters(costCentersRes.data.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (subCostCenterData) {
            setFormData({
                code: subCostCenterData.code || "",
                parent_id: subCostCenterData.parent_id || "",
                department_id: subCostCenterData.department_id || "",
                name: subCostCenterData.name || "",
                cost_center_type: subCostCenterData.cost_center_type || "",
                manager_id: subCostCenterData.manager_id || userId,
                status: subCostCenterData.status || "",
                description: subCostCenterData.description || "",
                effective_start_date:
                    subCostCenterData.effective_start_date ||
                    new Date().toISOString(),
            });
        } else {
            // Reset form when creating a new sub cost center
            setFormData({
                code: "",
                parent_id: "",
                department_id: "",
                name: "",
                cost_center_type: "",
                manager_id: userId,
                status: "",
                description: "",
                effective_start_date: new Date().toISOString(),
            });
        }
    }, [subCostCenterData, userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.code) newErrors.code = "Code is required.";
        if (!formData.parent_id)
            newErrors.parent_id = "Parent cost center is required.";
        if (!formData.department_id)
            newErrors.department_id = "Department is required.";
        if (!formData.name) newErrors.name = "Name is required.";
        if (!formData.cost_center_type)
            newErrors.cost_center_type = "Type is required.";
        if (!formData.status) newErrors.status = "Status is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (subCostCenterData && subCostCenterData.id) {
                await axios.put(
                    `/api/v1/cost-centers/${subCostCenterData.id}`,
                    formData
                );
            } else {
                await axios.post("/api/v1/cost-centers", formData);
            }

            fetchSubCostCenters();
            onClose();
        } catch (error) {
            setErrors(error.response?.data.errors || {});
            console.error("Error saving sub-cost center:", error);
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
                        {subCostCenterData
                            ? "Edit Sub Cost Center"
                            : "Add Sub Cost Center"}
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
                            <SelectFloating
                                label="Parent Cost Center"
                                name="parent_id"
                                value={formData.parent_id}
                                onChange={handleChange}
                                options={costCenters.map((cc) => ({
                                    id: cc.id,
                                    label: cc.name,
                                }))}
                            />
                            {errors.parent_id && (
                                <p className="text-red-500 text-sm">
                                    {errors.parent_id}
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
                                label="Type"
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
                            <InputFloating
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
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

export default SubCostCenterModal;
