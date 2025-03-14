import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import SelectFloating from "../../../Components/SelectFloating";
import InputFloating from "../../../Components/InputFloating";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

const MakeRequest = () => {
    const { requestId } = usePage().props;
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
    const [filteredProducts, setFilteredProducts] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes, unitsRes, warehousesRes] =
                    await Promise.all([
                        axios.get("/api/v1/products"),
                        axios.get("/api/v1/product-categories"),
                        axios.get("/api/v1/units"),
                        axios.get("/api/v1/warehouses"),
                    ]);

                setProducts(productsRes.data.data);
                setCategories(categoriesRes.data.data);
                setUnits(unitsRes.data.data);
                setWarehouses(warehousesRes.data.data);
                fetchAllStatuses();
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (products.length === 0) return;
        const updatedFilteredProducts = {};
        categories.forEach((category) => {
            const categoryProducts = products.filter(
                (product) => product.category_id === category.id
            );
            updatedFilteredProducts[category.id] = categoryProducts;
        });

        setFilteredProducts(updatedFilteredProducts);
    }, [products, categories]);

    const fetchAllStatuses = async () => {
        let allStatuses = [];
        let page = 1;
        let lastPage = false;

        try {
            while (!lastPage) {
                const response = await axios.get(
                    `/api/v1/statuses?page=${page}`
                );
                const { data, meta } = response.data;
                allStatuses = [...allStatuses, ...data];
                if (meta?.last_page && page >= meta.last_page) {
                    lastPage = true;
                } else {
                    page++;
                }
            }
            const urgencyStatuses = allStatuses.filter(
                (status) => status.type === "Urgency"
            );
            setStatuses(urgencyStatuses);
        } catch (error) {
            console.error("Error fetching all statuses:", error);
        }
    };

    useEffect(() => {
        if (requestId) {
            axios
                .get(
                    `/api/v1/material-requests/${requestId}?include=requester,warehouse,status,items.product,items.unit,items.category,items.urgencyStatus`
                )
                .then((response) => {
                    const requestData = response.data.data;
                    const items = requestData.items || [];
                    if (items.length === 0) {
                        console.warn("No items found in the request.");
                        return;
                    }
                    setFormData({
                        ...formData,
                        warehouse_id: requestData.warehouse?.id || "",
                        expected_delivery_date:
                            requestData.expected_delivery_date || "",
                        status_id: "1",
                        items: items.map((item) => ({
                            product_id: item.product?.id || "",
                            unit_id: item.unit?.id || "",
                            category_id: item.category?.id || "",
                            quantity: item.quantity || "",
                            urgency: item.urgency_status?.id || "",
                            photo: item.photo || null,
                            description: item.description || "",
                        })),
                    });
                })
                .catch((error) => {
                    console.error("Error fetching request data:", error);
                });
        }
    }, [requestId]);

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
            if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0)
                newErrors[`items.${index}.quantity`] =
                    "Valid quantity is required";
            if (!item.urgency)
                newErrors[`items.${index}.urgency`] = "Urgency is required";
            if (!item.description.trim())
                newErrors[`items.${index}.description`] =
                    "Description is required";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [name]: value };

            if (name === "category_id") {
                newItems[index].product_id = "";
            }

            return { ...prev, items: newItems };
        });
    };

    const handleFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newItems = [...formData.items];
            newItems[index].photo = file.name;
            setFormData({ ...formData, items: newItems });
        }
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
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
        }));
    };

    const handleDeleteItem = (index) => {
        setFormData((prev) => {
            const newItems = prev.items.filter((_, i) => i !== index);
            return { ...prev, items: newItems };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            const url = requestId
                ? `/api/v1/material-requests/${requestId}`
                : "/api/v1/material-requests";
            const method = requestId ? "put" : "post";

            const materialRequest = await axios[method](url, formData);
            const materialRequestId = materialRequest.data.data.id;

            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Material Request"
            );
            const processList = processResponse.data.data;

            if (!processList?.length) {
                console.error("No processes found.");
                return;
            }
            const process = processList[0];
            if (!process?.steps?.length) {
                console.error("No process steps found.");
                return;
            }
            const processStep = process.steps[0];

            const transactionPayload = {
                material_request_id: materialRequestId,
                requester_id: user_id,
                assigned_to:
                    processStep.approver_id || processStep.designation_id,
                order: String(processStep.order),
                description: processStep.description,
                status: "Pending",
            };
            await axios.post(
                "/api/v1/material-request-transactions",
                transactionPayload
            );

            const taskPayload = {
                process_step_id: processStep.id,
                process_id: processStep.process_id,
                assigned_at: new Date().toISOString(),
                urgency: "Normal",
                assigned_user_id: user_id,
                read_status: null,
            };
            await axios.post("/api/v1/tasks", taskPayload);

            router.visit("/my-requests");
        } catch (error) {
            console.error("Error submitting request:", error);
        } finally {
            setLoading(false);
        }
    };

    const getAvailableProducts = (index, categoryId) => {
        if (!categoryId) return [];

        return filteredProducts[categoryId] || [];
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                {requestId
                    ? "Update Request for Material"
                    : "Make a New Request for Material"}
            </h2>
            <p className="text-[#7D8086] text-xl mb-6">
                Employee requests for materials from the Maharat warehouse.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center w-full gap-4">
                    <h3 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                        Requested Item Detail
                    </h3>
                    <div
                        className="h-[3px] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                        }}
                    ></div>
                </div>

                {formData.items.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
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
                                label="Item"
                                name="product_id"
                                value={item.product_id}
                                onChange={(e) => handleItemChange(index, e)}
                                options={getAvailableProducts(
                                    index,
                                    item.category_id
                                ).map((p) => ({
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
                                    type="number"
                                    min="1"
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
                                options={statuses.map((s) => ({
                                    id: s.id,
                                    label: s.name,
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
                                    <span className="text-gray-700 text-sm sm:text-base overflow-hidden text-ellipsis max-w-[80%]">
                                        {item.photo}
                                    </span>
                                ) : (
                                    <span className="text-sm sm:text-base">
                                        Add a Photo
                                    </span>
                                )}
                                <input
                                    type="file"
                                    name="photo"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(index, e)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex justify-start items-center gap-2">
                                <div className="w-full">
                                    <div className="relative w-full">
                                        <textarea
                                            name="description"
                                            value={item.description}
                                            onChange={(e) =>
                                                handleItemChange(index, e)
                                            }
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
                                            {
                                                errors[
                                                    `items.${index}.description`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteItem(index)}
                                        className="text-red-500 text-xl hover:text-red-700 p-2"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center items-center relative w-full my-8">
                    <div
                        className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                        }}
                    ></div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] z-10 transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add
                        Item
                    </button>
                    <div
                        className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                        }}
                    ></div>
                </div>

                <div className="flex items-center w-full gap-4">
                    <h3 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                        Warehouse Info
                    </h3>
                    <div
                        className="h-[3px] flex-grow"
                        style={{
                            background:
                                "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                        }}
                    ></div>
                </div>

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
                                min={new Date().toISOString().split("T")[0]}
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
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50 w-full sm:w-auto"
                        disabled={loading}
                    >
                        {loading
                            ? requestId
                                ? "Updating..."
                                : "Creating..."
                            : requestId
                            ? "Update Request"
                            : "Create Request"}
                    </button>
                </div>
            </form>
        </>
    );
};

export default MakeRequest;
