import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

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
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                Make a New Request for Material
            </h2>
            <p className="text-[#7D8086] text-xl mb-6">
                Employee requests for materials from the Maharat warehouse.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Requested Item Detail
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative w-full">
                        <select
                            name="itemName"
                            value={formData.itemName}
                            onChange={handleChange}
                            className="peer border border-gray-300 p-3 rounded-lg w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="" disabled hidden></option>
                            <option value="Computer">Computer</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Mouse">Mouse</option>
                            <option value="Keyboard">Keyboard</option>
                        </select>
                        <label
                            className={`absolute left-3 px-1 bg-white text-gray-500 text-sm transition-all ${
                                formData.itemName
                                    ? "top-0 text-xs text-blue-500 px-2 -translate-y-1/2"
                                    : "top-1/2 -translate-y-1/2 text-base text-gray-400"
                            }`}
                        >
                            Item Name
                        </label>
                    </div>

                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border p-3 rounded-lg w-full"
                        required
                    >
                        <option value="">Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Stationary">Stationary</option>
                    </select>
                    <input
                        type="text"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        placeholder="Unit"
                        className="border p-3 rounded-lg w-full"
                        required
                    />
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Quantity"
                        className="border p-3 rounded-lg w-full"
                        required
                    />
                    <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        className="border p-3 rounded-lg w-full"
                        required
                    >
                        <option value="">Urgency</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <label className="border p-3 rounded-lg w-full flex items-center justify-center cursor-pointer">
                        <FontAwesomeIcon
                            icon={faCamera}
                            className="text-gray-500 mr-2"
                        />{" "}
                        Add a Photo
                        <input
                            type="file"
                            name="photo"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="border p-3 rounded-lg w-full h-24"
                />

                {/* Warehouse Info */}
                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Warehouse Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="warehouse"
                        value={formData.warehouse}
                        onChange={handleChange}
                        placeholder="Warehouse #"
                        className="border p-3 rounded-lg w-full"
                        required
                    />
                    <input
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        className="border p-3 rounded-lg w-full"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="bg-[#009FDC] text-white px-6 py-2 rounded-lg hover:bg-[#007CB8]"
                >
                    Submit Request
                </button>
            </form>
        </>
    );
};

export default MakeRequest;
