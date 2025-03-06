import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InputFloating from "../../../../Components/InputFloating";
import SelectFloating from "../../../../Components/SelectFloating";

const CostCenterModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        department: "",
        manager: "",
        status: "",
        description: "",
    });

    const [errors, setErrors] = useState({});
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users");
                setUsers(response.data.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // await axios.post("/api/v1/cost-centers", formData);
            // onSave(formData);
            // setFormData({
            //     name: "",
            //     type: "",
            //     department: "",
            //     manager: "",
            //     status: "",
            //     description: "",
            // });
            onClose();
        } catch (error) {
            setErrors(error.response?.data.errors || {});
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-lg">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        Add Cost Center
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputFloating
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                    <SelectFloating
                        label="Type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={[
                            { id: "fixed", label: "Fixed" },
                            { id: "variable", label: "Variable" },
                            { id: "support", label: "Support" },
                            { id: "direct", label: "Direct" },
                        ]}
                    />
                    <InputFloating
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                    />
                    <SelectFloating
                        label="Manager"
                        name="manager"
                        value={formData.manager}
                        onChange={handleChange}
                        options={users.map((user) => ({
                            id: user.id,
                            label: user.name,
                        }))}
                    />
                    <SelectFloating
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={[
                            { id: "approved", label: "Approved" },
                            { id: "pending", label: "Pending" },
                        ]}
                    />
                    <InputFloating
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                    <div className="my-4 flex justify-center w-full">
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CostCenterModal;
