import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faPlus } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../Components/SelectFloating";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const MakeRequest = () => {
    const user_id = usePage().props.auth.user.id;

    const [formData, setFormData] = useState({
        requester_id: user_id || "",
        warehouse_id: "",
        expected_delivery_date: "",
        status_id: "1",
        items: [
            {
                product_id: "",
                unit_id: "",
                category_id: "",
                quantity: "",
                urgency: "",
                photo: null,
                description: "",
            },
        ],
    });
    const [errors, setErrors] = useState({});
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [statuses, setStatuses] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    productsRes,
                    categoriesRes,
                    unitsRes,
                    warehousesRes,
                    statusesRes,
                ] = await Promise.all([
                    axios.get("/api/v1/products"),
                    axios.get("/api/v1/product-categories"),
                    axios.get("/api/v1/units"),
                    axios.get("/api/v1/warehouses"),
                    axios.get("/api/v1/statuses"),
                ]);
                setProducts(productsRes.data.data);
                setCategories(categoriesRes.data.data);
                setUnits(unitsRes.data.data);
                setWarehouses(warehousesRes.data.data);
                setStatuses(statusesRes.data.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const validateForm = () => {
        let newErrors = {};
        if (!formData.warehouse_id)
            newErrors.warehouse_id = "Warehouse is required";
        if (!formData.expected_delivery_date)
            newErrors.expected_delivery_date = "Delivery Date is required";

        formData.items.forEach((item, index) => {
            if (!item.product_id)
                newErrors[`items.${index}.product_id`] = "Item is required";
            if (!item.unit_id)
                newErrors[`items.${index}.unit_id`] = "Unit is required";
            if (!item.category_id)
                newErrors[`items.${index}.category_id`] =
                    "Category is required";
            if (!item.quantity)
                newErrors[`items.${index}.quantity`] = "Quantity is required";
            if (!item.urgency)
                newErrors[`items.${index}.urgency`] = "Urgency is required";
            if (!item.description)
                newErrors[`items.${index}.description`] =
                    "Description is required";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...formData.items];
        newItems[index][name] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newItems = [...formData.items];
            newItems[index].photo = file.name;
            setFormData({ ...formData, items: newItems });
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    product_id: "",
                    unit_id: "",
                    category_id: "",
                    quantity: "",
                    urgency: "",
                    photo: null,
                    description: "",
                },
            ],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            response = await axios.post("/api/v1/material-requests", formData, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });
            router.visit("/my-requests");
        } catch (error) {
            console.error("Error submitting request:", error);
        }
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
                {formData.items.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div>
                            <SelectFloating
                                label="Item"
                                name="product_id"
                                value={item.product_id}
                                onChange={(e) => handleItemChange(index, e)}
                                options={products.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                            />
                            {errors[`items.${index}.product_id`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.product_id`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Category"
                                name="category_id"
                                value={item.category_id}
                                onChange={(e) => handleItemChange(index, e)}
                                options={categories.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                            />
                            {errors[`items.${index}.category_id`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.category_id`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <SelectFloating
                                label="Unit"
                                name="unit_id"
                                value={item.unit_id}
                                onChange={(e) => handleItemChange(index, e)}
                                options={units.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                            />
                            {errors[`items.${index}.unit_id`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.unit_id`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <div>
                                <InputFloating
                                    label="Quantity"
                                    name="quantity"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, e)}
                                />
                                {errors[`items.${index}.quantity`] && (
                                    <p className="text-red-500 text-sm">
                                        {errors[`items.${index}.quantity`]}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <SelectFloating
                                label="Urgency"
                                name="urgency"
                                value={item.urgency}
                                onChange={(e) => handleItemChange(index, e)}
                                options={statuses.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                            />
                            {errors[`items.${index}.urgency`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.urgency`]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="border p-5 rounded-2xl bg-white w-full flex items-center justify-center cursor-pointer relative">
                                <FontAwesomeIcon
                                    icon={faCamera}
                                    className="text-gray-500 mr-2"
                                />
                                {item.photo ? (
                                    <span className="text-gray-700">
                                        {item.photo}
                                    </span>
                                ) : (
                                    "Add a Photo"
                                )}
                                <input
                                    type="file"
                                    name="photo"
                                    onChange={(e) => handleFileChange(index, e)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative w-full">
                                <textarea
                                    name="description"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, e)}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full h-24 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                ></textarea>
                                <label
                                    className={`absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                ${
                    item.description
                        ? "-top-2 left-2 text-base text-[#009FDC] px-1"
                        : "top-4 text-base text-gray-400"
                }
                peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1`}
                                >
                                    Description
                                </label>
                            </div>
                            {errors[`items.${index}.description`] && (
                                <p className="text-red-500 text-sm">
                                    {errors[`items.${index}.description`]}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                <div className="flex justify-center items-center relative w-full">
                    <div className="absolute top-1/2 left-0 w-[45%] border-t border-[#9B9DA2] max-sm:w-[35%]"></div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="p-3 text-xl flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] z-10 transition-all duration-300 hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add
                        Item
                    </button>
                    <div className="absolute top-1/2 right-0 w-[45%] border-t border-[#9B9DA2] max-sm:w-[35%]"></div>
                </div>

                <h3 className="text-2xl font-medium text-[#6E66AC]">
                    Warehouse Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SelectFloating
                            label="Warehouse"
                            name="warehouse_id"
                            value={formData.warehouse_id}
                            onChange={handleChange}
                            options={warehouses.map((p) => ({
                                id: p.id,
                                label: p.name,
                            }))}
                        />
                        {errors.warehouse_id && (
                            <p className="text-red-500 text-sm">
                                {errors.warehouse_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <div className="relative w-full">
                            <input
                                type="date"
                                name="expected_delivery_date"
                                value={formData.expected_delivery_date}
                                onChange={handleChange}
                                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                            />
                            <label
                                className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all 
                ${
                    formData.expected_delivery_date
                        ? "-top-2 text-[#009FDC] text-sm px-2"
                        : "top-1/2 text-gray-400 -translate-y-1/2"
                }
                peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2`}
                            >
                                Select Delivery Date
                            </label>
                        </div>
                        {errors.expected_delivery_date && (
                            <p className="text-red-500 text-sm">
                                {errors.expected_delivery_date}
                            </p>
                        )}
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
