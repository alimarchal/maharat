import { useState } from "react";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const CreateStatus = () => {
    const { props } = usePage();
    const [formData, setFormData] = useState({
        type: "",
        name: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.type.trim()) newErrors.type = "Type is required";
        if (!formData.name.trim()) newErrors.name = "Name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setSuccessMessage(""); 

        try {
            const response = await axios.post('/api/v1/statuses', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Success:', response.data);
            setSuccessMessage("Status created successfully!"); 
            setFormData({ type: "", name: "" }); // Reset form
            
            //Redirect after success
            setTimeout(() => {
                window.location.href = '/status';
            }, 2000);

        } catch (error) {
            console.error('Error:', error.response?.data || error);
            setErrors(error.response?.data?.errors || {
                general: 'An error occurred while creating the status'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                Make a New Status
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Requested New Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating
                            label="Type"
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
                        {loading ? "Creating..." : "Create Status"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateStatus;
