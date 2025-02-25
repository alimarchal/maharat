import { useState, useEffect } from "react";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateUnit = () => {
    const { unitId } = usePage().props;

    const [formData, setFormData] = useState({
        name: "",
        short_title: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (unitId) {
            axios
                .get(`/api/v1/units/${unitId}`)
                .then((response) => {
                    setFormData({
                        name: response.data.data.name,
                        short_title: response.data.data.short_title,
                    });
                })
                .catch((error) => {
                    console.error("Error fetching units:", error);
                });
        }
    }, [unitId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};

        if (!formData?.name?.trim()) newErrors.name = "Unit Name is required";
        if (!formData?.short_title?.trim())
            newErrors.short_title = "Unit Short Title is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            let response;
            if (unitId) {
                response = await axios.put(
                    `/api/v1/units/${unitId}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );
            } else {
                response = await axios.post("/api/v1/units", formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });
            }
            setFormData({ name: "" });
            router.visit("/units");
        } catch (error) {
            setErrors(
                error.response?.data?.errors || {
                    general: "An error occurred while saving the units",
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {unitId ? "Edit Unit" : "Create New Unit"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Unit Name"
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
                    <div>
                        <InputFloating
                            label="Unit Short Title"
                            name="short_title"
                            value={formData.short_title}
                            onChange={handleChange}
                        />
                        {errors.short_title && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.short_title}
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
                            ? unitId
                                ? "Updating..."
                                : "Creating..."
                            : unitId
                            ? "Update Unit"
                            : "Create Unit"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateUnit;
