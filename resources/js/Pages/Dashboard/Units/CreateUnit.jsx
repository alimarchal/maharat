import { useState } from "react";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";

const CreateUnit = () => {
    const { props } = usePage();
    const [formData, setFormData] = useState({
        name: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        router.post("/api/units", formData, {
            headers: {
                Authorization: `Bearer ${props.auth.token}`,
            },
            onSuccess: () => {
                setFormData({ type: "", name: "" });
                router.visit("/units");
            },
            onError: (err) => {
                console.error("Error:", err);
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                Make a New Unit
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Requested New Unit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Name"
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
                        className="bg-[#009FDC] text-white px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Unit"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateUnit;
