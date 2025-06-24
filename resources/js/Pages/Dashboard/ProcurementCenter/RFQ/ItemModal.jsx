import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const ItemModal = ({
    isOpen,
    onClose,
    onSave,
    item = null,
    isEdit = false,
    products,
    units,
    brands,
    rfqId,
    selectedCategoryId,
}) => {
    const [formData, setFormData] = useState({
        product_id: "",
        item_name: "",
        description: "",
        unit_id: "",
        quantity: "",
        brand_id: "",
        expected_delivery_date: "",
        attachment: null,
        rfq_id: rfqId,
    });

    const [errors, setErrors] = useState({});
    const [tempFile, setTempFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEdit && item) {
                console.log('Editing item:', item);
                console.log('Available products:', products);
                
                // Try to find product_id by item_name if product_id is empty
                let productId = item.product_id ? String(item.product_id) : "";
                if (!productId && item.item_name && products.length > 0) {
                    const matchingProduct = products.find(p => p.name === item.item_name);
                    if (matchingProduct) {
                        productId = String(matchingProduct.id);
                        console.log('Found matching product by name:', matchingProduct);
                    }
                }
                
                const newFormData = {
                    product_id: productId,
                    item_name: item.item_name || "",
                    description: item.description || "",
                    unit_id: item.unit_id ? String(item.unit_id) : "",
                    quantity: item.quantity || "",
                    brand_id: item.brand_id ? String(item.brand_id) : "",
                    expected_delivery_date: item.expected_delivery_date || "",
                    attachment: item.attachment || null,
                    id: item.id,
                    rfq_id: rfqId,
                };
                console.log('Setting formData for edit:', newFormData);
                setFormData(newFormData);
            } else {
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setMonth(today.getMonth() + 1);

                setFormData({
                    product_id: "",
                    item_name: "",
                    description: "",
                    unit_id: "",
                    quantity: "",
                    brand_id: "",
                    expected_delivery_date: nextMonth
                        .toISOString()
                        .split("T")[0],
                    attachment: null,
                    rfq_id: rfqId,
                });
            }
            setTempFile(null);
            setErrors({});
        }
    }, [isOpen, item, isEdit, rfqId, products]);

    // Additional useEffect to handle product selection when products are loaded
    useEffect(() => {
        if (isEdit && item && products.length > 0 && formData.product_id) {
            const productExists = products.find(p => String(p.id) === String(formData.product_id));
            if (!productExists) {
                console.log('Product not found in products list, clearing product_id');
                setFormData(prev => ({
                    ...prev,
                    product_id: "",
                    item_name: "",
                    description: ""
                }));
            }
        }
    }, [products, isEdit, item, formData.product_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "product_id") {
            const selectedProduct = products.find(
                (p) => String(p.id) === value
            );
            if (selectedProduct) {
                setFormData({
                    ...formData,
                    product_id: String(selectedProduct.id),
                    item_name: selectedProduct.name,
                    description: selectedProduct.description || "",
                });
            } else {
                setFormData({
                    ...formData,
                    product_id: "",
                    item_name: "",
                    description: "",
                });
            }
        } else if (name === "quantity") {
            setFormData({ ...formData, quantity: value });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempFile(file);
            setFormData({
                ...formData,
                attachment: {
                    name: file.name,
                    original_filename: file.name,
                    file: file,
                },
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validationErrors = {};
        if (!formData.product_id)
            validationErrors.product_id = "Product is required";
        if (!formData.unit_id) validationErrors.unit_id = "Unit is required";
        if (!formData.quantity)
            validationErrors.quantity = "Quantity is required";
        if (!formData.brand_id) validationErrors.brand_id = "Brand is required";
        if (!formData.expected_delivery_date)
            validationErrors.expected_delivery_date =
                "Delivery date is required";

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const itemData = { ...formData };
            if (tempFile) {
                itemData.tempFile = tempFile;
            }
            onSave(itemData);
            onClose();
        } catch (error) {
            setErrors({ submit: "Failed to save item" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const FileDisplay = ({ file }) => {
        if (!file) {
            return (
                <div className="flex flex-col items-center justify-center space-y-2">
                    <DocumentArrowDownIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-500">
                        No file attached
                    </span>
                </div>
            );
        }

        let fileName = "";
        let fileUrl = null;

        if (file instanceof File) {
            fileName = file.name;
            fileUrl = URL.createObjectURL(file);
        } else if (file.file && file.file instanceof File) {
            fileName = file.name || file.file.name;
            fileUrl = URL.createObjectURL(file.file);
        } else if (typeof file === "object") {
            fileName = file.original_filename || file.name || file.file_name;
            if (file.url && file.url.startsWith("http")) {
                fileUrl = file.url;
            } else {
                fileUrl = `/storage/${file.url || file.path || file}`.replace(
                    "/storage/storage/",
                    "/storage/"
                );
            }
        } else if (typeof file === "string") {
            // Legacy format - just the path
            fileName = file.split("/").pop();
            fileUrl = `/storage/${file}`.replace(
                "/storage/storage/",
                "/storage/"
            );
        }

        return (
            <div className="flex flex-col items-center justify-center space-y-2">
                <DocumentArrowDownIcon
                    className="h-6 w-6 text-blue-500 cursor-pointer hover:text-blue-700"
                    onClick={() => {
                        if (fileUrl) window.open(fileUrl, "_blank");
                    }}
                />
                {fileName && (
                    <span
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center break-words whitespace-normal w-full"
                        onClick={() => {
                            if (fileUrl) window.open(fileUrl, "_blank");
                        }}
                    >
                        {fileName}
                    </span>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-3xl">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit ? "Edit Item" : "Add Item"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {errors.submit && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product
                            </label>
                            <select
                                name="product_id"
                                value={formData.product_id || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Product</option>
                                {products
                                    .filter(product => !selectedCategoryId || product.category_id == selectedCategoryId)
                                    .map((product) => (
                                        <option key={product.id} value={String(product.id)}>
                                            {product.name}
                                        </option>
                                    ))}
                            </select>
                            {errors.product_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.product_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ""}
                                readOnly
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                rows="2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit
                            </label>
                            <select
                                name="unit_id"
                                value={formData.unit_id || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Unit</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={String(unit.id)}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                            {errors.unit_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.unit_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                            </label>
                            <input
                                type="text"
                                name="quantity"
                                value={formData.quantity || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.quantity && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.quantity}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand
                            </label>
                            <select
                                name="brand_id"
                                value={formData.brand_id || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Brand</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={String(brand.id)}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            {errors.brand_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.brand_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Delivery Date
                            </label>
                            <input
                                type="date"
                                name="expected_delivery_date"
                                value={formData.expected_delivery_date || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.expected_delivery_date && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.expected_delivery_date}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <div className="space-y-2 w-full max-w-sm">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                                Attachment (Optional)
                            </label>

                            {tempFile && (
                                <div className="flex justify-center">
                                    <div
                                        className="text-sm text-orange-600 mb-2 truncate max-w-[220px] text-center"
                                        title={tempFile.name}
                                    >
                                        Selected: {tempFile.name}
                                    </div>
                                </div>
                            )}

                            {!tempFile && formData.attachment && (
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <span
                                        className="text-sm text-blue-600 cursor-pointer truncate max-w-[220px]"
                                        title={formData.attachment.name || formData.attachment.original_filename}
                                        onClick={() => {
                                            if (formData.attachment.url || formData.attachment.path) {
                                                const fileUrl = formData.attachment.url && formData.attachment.url.startsWith("http") 
                                                    ? formData.attachment.url 
                                                    : `/storage/${formData.attachment.url || formData.attachment.path}`.replace("/storage/storage/", "/storage/");
                                                window.open(fileUrl, "_blank");
                                            }
                                        }}
                                    >
                                        {formData.attachment.name || formData.attachment.original_filename}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-[#009FDC] file:text-white
                                        hover:file:bg-[#007BB5]"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="w-full">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5]"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemModal;
