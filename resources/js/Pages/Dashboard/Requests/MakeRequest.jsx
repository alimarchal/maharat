import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../Components/SelectFloating";
import { router } from "@inertiajs/react";

const MakeRequest = () => {
    const [formData, setFormData] = useState({
        itemName: "",
        category: "",
        unit: "",
        quantity: "",
        urgency: "",
        photo: null,
        description: "",
        warehouse: "",
        deliveryDate: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, photo: e.target.files[0] });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        router.visit("/my-requests");
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                Make a New Request for Material
            </h2>
            <p className="text-[#7D8086] text-xl mb-6">
                Employee requests for materials from the Maharat warehouse.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Requested Item Detail
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <SelectFloating
                        label="Item Name"
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleChange}
                        options={["Computer", "Laptop", "Mouse", "Keyboard"]}
                    />
                    <SelectFloating
                        label="Category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        options={["Electronics", "Stationary"]}
                    />
                    <SelectFloating
                        label="Unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        options={["Piece", "Box", "Pack", "Set"]}
                    />
                    <SelectFloating
                        label="Quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        options={["1", "2", "5", "10", "20", "50", "100"]}
                    />
                    <SelectFloating
                        label="Urgency"
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        options={["High", "Medium", "Low"]}
                    />
                    <label className="border p-3 rounded-lg bg-white w-full flex items-center justify-center cursor-pointer">
                        <FontAwesomeIcon
                            icon={faCamera}
                            className="text-gray-500 mr-2"
                        />
                        Add a Photo
                        <input
                            type="file"
                            name="photo"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>
                <div className="relative w-full">
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="peer border border-gray-300 p-3 rounded-lg w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                        required
                    ></textarea>
                    <label
                        className={`absolute left-3 px-1 bg-white text-gray-500 text-sm transition-all
        peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
        peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-[#009FDC] peer-focus:px-1
        ${
            formData.description
                ? "-top-2 left-2 text-xs text-[#009FDC] px-1"
                : "top-4 text-base text-gray-400"
        }`}
                    >
                        Description
                    </label>
                </div>

                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Warehouse Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <SelectFloating
                        label="Warehouse"
                        name="warehouse"
                        value={formData.warehouse}
                        onChange={handleChange}
                        options={["Warehouse A", "Warehouse B", "Warehouse C"]}
                    />
                    <div className="relative w-full">
                        <input
                            type="date"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-3 rounded-lg w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                            required
                        />
                        <label
                            className={`absolute left-3 px-1 bg-white text-gray-500 text-sm transition-all 
                peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 
                peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#009FDC] peer-focus:px-2
                ${
                    formData.deliveryDate
                        ? "top-0 text-xs text-[#009FDC] px-2"
                        : "top-1/2 text-base text-gray-400 -translate-y-1/2"
                }`}
                        >
                            Select Delivery Date
                        </label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white px-6 py-2 rounded-lg hover:bg-[#007CB8]"
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </>
    );
};

export default MakeRequest;
