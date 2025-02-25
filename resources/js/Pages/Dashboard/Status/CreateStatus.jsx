import { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateStatus = () => {
    const { statusId } = usePage().props;

    const [formData, setFormData] = useState({
        type: "",
        name: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (statusId) {
            axios
                .get(`/api/v1/statuses/${statusId}`)
                .then((response) => {
                    setFormData({
                        type: response.data.data.type,
                        name: response.data.data.name,
                    });
                })
                .catch((error) => {
                    console.error("Error fetching status:", error);
                });
        }
    }, [statusId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.type.trim()) newErrors.type = "Status Type is required";
        if (!formData.name.trim()) newErrors.name = "Status Name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            let response;
            if (statusId) {
                response = await axios.put(
                    `/api/v1/statuses/${statusId}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );
            } else {
                response = await axios.post("/api/v1/statuses", formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });
            }
            setFormData({ type: "", name: "" });
            router.visit("/status");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the status",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {statusId ? "Edit Status" : "Make a New Status"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Status Type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                        />
                        {errors.type && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.type}
                            </p>
                        )}
                    </div>
                    <div>
                        <InputFloating
                            label="Status Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.name}
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
                            ? statusId
                                ? "Updating..."
                                : "Creating..."
                            : statusId
                            ? "Update Status"
                            : "Create Status"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateStatus;
