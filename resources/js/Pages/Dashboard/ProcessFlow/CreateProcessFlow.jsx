import React, { useState, useEffect } from "react";
import axios from "axios";
import InputFloating from "../../../Components/InputFloating";
import SelectFloating from "../../../Components/SelectFloating";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const CreateProcessFlow = () => {
    const [formData, setFormData] = useState({
        title: "",
        status: "",
        is_active: true,
    });
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [processes, setProcesses] = useState([]);

    useEffect(() => {
        fetchProcesses();
    }, []);

    const fetchProcesses = async () => {
        try {
            const response = await axios.get("/api/v1/processes");
            setProcesses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching processes:", error);
        }
    };

    const statusOptions = [
        { id: "Draft", label: "Draft" },
        { id: "Active", label: "Active" },
        { id: "Pending", label: "Pending" },
        { id: "Rejected", label: "Rejected" },
        { id: "Expired", label: "Expired" },
    ];

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.status.trim()) newErrors.status = "Status is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`/api/v1/processes/${editingId}`, formData);
            } else {
                await axios.post("/api/v1/processes", formData);
            }
            setFormData({ title: "", status: "", is_active: true });
            setEditingId(null);
            fetchProcesses();
        } catch (error) {
            console.error("Error saving process:", error);
        }
        setLoading(false);
    };

    const handleEdit = (process) => {
        setFormData({
            title: process.title,
            status: process.status,
            is_active: process.is_active,
        });
        setEditingId(process.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Process?"))
            return;
        try {
            await axios.delete(`/api/v1/processes/${id}`);
            setProcesses(processes.filter((process) => process.id !== id));
        } catch (error) {
            console.error("Error deleting process:", error);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {editingId ? "Edit a Process" : "Make a New Process"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm">
                                {errors.title}
                            </p>
                        )}
                    </div>
                    <div>
                        <SelectFloating
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={statusOptions}
                        />
                        {errors.status && (
                            <p className="text-red-500 text-sm">
                                {errors.status}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading
                            ? "Saving..."
                            : editingId
                            ? "Update Process"
                            : "Create Process"}
                    </button>
                </div>
            </form>

            <div className="w-full overflow-hidden mt-10">
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                ID
                            </th>
                            <th className="py-3 px-4">Title</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {processes.length > 0 ? (
                            processes.map((process) => (
                                <tr key={process.id}>
                                    <td className="py-3 px-4">{process.id}</td>
                                    <td className="py-3 px-4">
                                        {process.title}
                                    </td>
                                    <td className="py-3 px-4">
                                        {process.status}
                                    </td>
                                    <td className="py-3 px-4 flex space-x-3">
                                        <button
                                            onClick={() => handleEdit(process)}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(process.id)
                                            }
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="text-center text-[#2C323C] font-medium py-4"
                                >
                                    No Process found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default CreateProcessFlow;
