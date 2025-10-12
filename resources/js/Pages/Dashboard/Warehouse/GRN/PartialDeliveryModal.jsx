import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const PartialDeliveryModal = ({ 
    isOpen, 
    onClose, 
    partialItems, 
    onConfirm,
    purchaseOrderNumber 
}) => {
    const user_id = usePage().props.auth.user.id;
    const [deliveryOption, setDeliveryOption] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!deliveryOption) {
            setErrors({ submit: "Please select a delivery option" });
            return;
        }
        
        console.log('=== FRONTEND: PARTIAL DELIVERY MODAL CONFIRM ===', {
            deliveryOption: deliveryOption,
            note: 'User clicked confirm button'
        });
        
        setLoading(true);
        setErrors({});
        
        try {
            // For adjust_order, the backend will automatically handle the approval process
            // For later_delivery, no approval process needed
            console.log('=== FRONTEND: CALLING ONCONFIRM ===', {
                deliveryOption: deliveryOption,
                note: 'About to call parent component'
            });
            await onConfirm(deliveryOption);
        } catch (error) {
            console.error("Error in handleConfirm:", error);
            setErrors({
                submit: error.response?.data?.message || 
                        "An error occurred while processing your request. Please try again.",
            });
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[99999]">
            <div className="bg-white rounded-2xl w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-amber-100 text-amber-800 px-8 py-4 rounded-t-2xl border-l-4 border-amber-500">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <FontAwesomeIcon 
                                icon={faExclamationTriangle} 
                                className="mr-3 text-xl" 
                            />
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Partial Delivery Detected
                                </h2>
                                <p className="text-sm">
                                    Purchase Order: {purchaseOrderNumber}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} disabled={loading}>
                            <FontAwesomeIcon 
                                icon={faTimes} 
                                size="lg" 
                                className="hover:text-amber-600" 
                            />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Error Display */}
                    {errors.submit && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            <span className="block sm:inline">{errors.submit}</span>
                        </div>
                    )}

                    {/* Warning Message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <FontAwesomeIcon 
                                icon={faExclamationTriangle} 
                                className="text-amber-500 mr-3 mt-1" 
                            />
                            <div>
                                <h3 className="font-semibold text-amber-800 mb-2">
                                    Delivery quantity doesn't match ordered quantity
                                </h3>
                                <p className="text-amber-700 text-sm">
                                    Some items have been delivered in quantities different from what was ordered. 
                                    Please choose how to handle this situation.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Affected Items
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#C7E7DE] text-[#2C323C] text-base font-medium text-left">
                                    <tr>
                                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                            Item Name
                                        </th>
                                        <th className="py-3 px-4 text-center">Ordered Qty</th>
                                        <th className="py-3 px-4 text-center">Delivered Qty</th>
                                        <th className="py-3 px-4 text-center">Shortage</th>
                                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                                    {partialItems.map((item, index) => {
                                        const shortage = item.quantityOrdered - item.quantityDelivered;
                                        const isShortage = shortage > 0;
                                        const isOverDelivery = shortage < 0;
                                        
                                        return (
                                            <tr key={index}>
                                                <td className="px-3 py-4">
                                                    <div>
                                                        <p className="font-medium">
                                                            {item.itemName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    {item.quantityOrdered}
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    {item.quantityDelivered}
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <span className={`font-medium ${
                                                        isShortage ? 'text-red-600' : 
                                                        isOverDelivery ? 'text-blue-600' : 
                                                        'text-green-600'
                                                    }`}>
                                                        {Math.abs(shortage)}
                                                        {isOverDelivery && ' (Over)'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        isShortage ? 'bg-red-100 text-red-800' : 
                                                        isOverDelivery ? 'bg-blue-100 text-blue-800' : 
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {isShortage ? 'Shortage' : 
                                                         isOverDelivery ? 'Over Delivered' : 
                                                         'Complete'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            How would you like to handle this partial delivery?
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Later Delivery Option */}
                            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="deliveryOption"
                                    value="later_delivery"
                                    checked={deliveryOption === "later_delivery"}
                                    onChange={(e) => setDeliveryOption(e.target.value)}
                                    className="mt-1 mr-3 text-blue-600"
                                    disabled={loading}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 mb-1">
                                        Expect Later Delivery
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        The remaining items will be delivered later. Keep the purchase order active for future deliveries.
                                    </div>
                                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                        <strong>Impact:</strong> Purchase order remains open. Delivered items are added to warehouse inventory. Material requests will be checked for fulfillment - only set to pending if sufficient inventory is available.
                                    </div>
                                </div>
                            </label>

                            {/* Adjustment Option */}
                            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="deliveryOption"
                                    value="adjust_order"
                                    checked={deliveryOption === "adjust_order"}
                                    onChange={(e) => {
                                        console.log('=== FRONTEND: USER SELECTED ADJUST ORDER ===', {
                                            value: e.target.value,
                                            note: 'User clicked Adjust Order & Close option'
                                        });
                                        setDeliveryOption(e.target.value);
                                    }}
                                    className="mt-1 mr-3 text-orange-600"
                                    disabled={loading}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 mb-1">
                                        Adjust Order & Close
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        Accept the delivered quantity as final. The remaining items will not be delivered.
                                    </div>
                                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                        <strong>Impact:</strong> Purchase order will be marked as completed. Invoice amount may need adjustment for undelivered items. <strong>Requires approval.</strong>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Warning for Adjustment */}
                    {deliveryOption === "adjust_order" && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <FontAwesomeIcon 
                                    icon={faExclamationTriangle} 
                                    className="text-orange-500 mr-3 mt-1" 
                                />
                                <div>
                                    <h4 className="font-semibold text-orange-800 mb-1">
                                        Order Adjustment Warning
                                    </h4>
                                    <p className="text-sm text-orange-700 mb-2">
                                        By choosing this option:
                                    </p>
                                    <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                                        <li>This action will require approval before processing</li>
                                        <li>The purchase order will be marked as completed after approval</li>
                                        <li>Undelivered items will be removed from the order</li>
                                        <li>You may need to adjust the invoice amount with the supplier</li>
                                        <li>This action cannot be easily reversed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            onClick={handleConfirm}
                            disabled={!deliveryOption || loading}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                deliveryOption && !loading
                                    ? 'bg-[#009FDC] text-white hover:bg-[#0077B6]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Processing...
                                </div>
                            ) : (
                                'Confirm & Proceed'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartialDeliveryModal;
