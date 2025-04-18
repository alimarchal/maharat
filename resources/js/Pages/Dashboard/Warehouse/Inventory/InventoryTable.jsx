import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faFileExcel, faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InventoryModal from "./InventoryModal";
import InventoryExcel from "./InventoryExcel";
import InventoryPDF from "./InventoryPDF";

const InventoryTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [selectedExcelInventoryId, setSelectedExcelInventoryId] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedPDFInventoryId, setSelectedPDFInventoryId] = useState(null);

    const fetchInventories = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/v1/inventories?include=warehouse,product`
            );
            setInventories(response.data.data);
            setError(null);
        } catch (error) {
            console.error("Error fetching inventories:", error);
            setError("Failed to load inventories. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventories();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this Inventory?")) {
            try {
                await axios.delete(`/api/v1/inventories/${id}`);
                fetchInventories();
            } catch (error) {
                console.error("Error deleting inventory:", error);
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedInventory(null);
    };

    const handleGenerateExcel = (inventoryId) => {
        // Generate a new Excel file
        console.log(`Setting up Excel generation for inventory ID: ${inventoryId}`);
        setIsGeneratingExcel(true);
        setSelectedExcelInventoryId(inventoryId);
    };

    const handleExcelGenerated = (result, error) => {
        setIsGeneratingExcel(false);
        setSelectedExcelInventoryId(null);
        
        console.log("Excel generation completed with result:", result);
        
        if (error) {
            console.warn("Excel generation encountered errors:", error);
            
            // Show a more detailed message based on the result
            if (result === "downloaded_only") {
                alert("Excel file was generated and downloaded, but could not be saved to the server.");
            } else {
                alert("Excel file was generated but encountered an error: " + (error.message || "Unknown error"));
            }
        } else if (result === "success_fallback") {
            console.log("Excel generation succeeded with fallback method");
        } else {
            console.log("Excel generation completed successfully");
        }
        
        // Refresh the data regardless of whether there was an error
        fetchInventories();
    };

    const handleGeneratePDF = (inventoryId) => {
        // Generate a new PDF file
        console.log(`Setting up PDF generation for inventory ID: ${inventoryId}`);
        setIsGeneratingPDF(true);
        setSelectedPDFInventoryId(inventoryId);
    };

    // Function to force generating a new PDF
    const handleForceGeneratePDF = (inventoryId) => {
        console.log(`Forcing new PDF generation for inventory ID: ${inventoryId}`);
        setIsGeneratingPDF(true);
        setSelectedPDFInventoryId(inventoryId);
    };

    // Function to force generating a new Excel
    const handleForceGenerateExcel = (inventoryId) => {
        console.log(`Forcing new Excel generation for inventory ID: ${inventoryId}`);
        setIsGeneratingExcel(true);
        setSelectedExcelInventoryId(inventoryId);
    };

    const handlePDFGenerated = (result, error) => {
        setIsGeneratingPDF(false);
        setSelectedPDFInventoryId(null);
        
        console.log("PDF generation completed with result:", result);
        
        if (error) {
            console.warn("PDF generation encountered errors:", error);
            
            // Show a more detailed message based on the result
            if (result === "downloaded_only") {
                alert("PDF file was generated and downloaded, but could not be saved to the server.");
            } else {
                alert("PDF file was generated but encountered an error: " + (error.message || "Unknown error"));
            }
        } else if (result === "success_fallback") {
            console.log("PDF generation succeeded with fallback method");
        } else {
            console.log("PDF generation completed successfully");
        }
        
        // Refresh the data regardless of whether there was an error
        fetchInventories();
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-[#2C323C] mb-8">
                Inventory Tracking
            </h2>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Warehouse</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4">Reorder Level</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : inventories.length > 0 ? (
                        inventories.map((inventory) => (
                            <tr key={inventory.id}>
                                <td className="py-3 px-4">{inventory.id}</td>
                                <td className="py-3 px-4">
                                    {inventory.warehouse?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {inventory.product?.name || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {parseInt(inventory.quantity)}
                                </td>
                                <td className="py-3 px-4">
                                    {parseInt(inventory.reorder_level)}
                                </td>
                                <td className="py-3 px-4">
                                    {inventory.description}
                                </td>
                                <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                    <button
                                        onClick={() => {
                                            setSelectedInventory(inventory);
                                            setIsModalOpen(true);
                                        }}
                                        className="text-blue-400 hover:text-blue-500"
                                        title="Edit Inventory"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    {/* PDF Button */}
                                    {inventory.pdf_document ? (
                                        <button
                                            onClick={() => {
                                                console.log("Regenerating PDF for inventory:", inventory.id);
                                                handleGeneratePDF(inventory.id);
                                            }}
                                            className="w-4 h-4"
                                            title="Regenerate PDF"
                                        >
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="w-full h-full"
                                            />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                console.log("Generating PDF for inventory:", inventory.id);
                                                handleGeneratePDF(inventory.id);
                                            }}
                                            className="w-4 h-4"
                                            title="Generate PDF"
                                        >
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="w-full h-full"
                                            />
                                        </button>
                                    )}
                                    {/* Excel Button */}
                                    {inventory.excel_document ? (
                                        <button
                                            onClick={() => {
                                                console.log("Regenerating Excel for inventory:", inventory.id);
                                                handleGenerateExcel(inventory.id);
                                            }}
                                            className="text-green-600 hover:text-green-800"
                                            title="Regenerate Excel"
                                        >
                                            <FontAwesomeIcon icon={faFileExcel} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                console.log("Generating Excel for inventory:", inventory.id);
                                                handleGenerateExcel(inventory.id);
                                            }}
                                            className="text-green-600 hover:text-green-800"
                                            title="Generate Excel"
                                        >
                                            <FontAwesomeIcon icon={faFileExcel} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(inventory.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete Inventory"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Inventories found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

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
                    className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    onClick={() => setIsModalOpen(true)}
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add
                    Inventory
                </button>
                <div
                    className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
            </div>

            {/* Render the modal */}
            <InventoryModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                inventoryData={selectedInventory}
                fetchInventories={fetchInventories}
            />

            {/* Excel Generation Component (conditionally rendered) */}
            {isGeneratingExcel && selectedExcelInventoryId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Generating Excel
                        </h3>
                        <div className="flex items-center">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p>Please wait, generating Excel file...</p>
                        </div>
                        <InventoryExcel
                            inventoryId={selectedExcelInventoryId}
                            onGenerated={handleExcelGenerated}
                        />
                    </div>
                </div>
            )}

            {/* PDF Generation Component (conditionally rendered) */}
            {isGeneratingPDF && selectedPDFInventoryId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Generating PDF
                        </h3>
                        <div className="flex items-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                            <p>Please wait, generating PDF document...</p>
                        </div>
                        <InventoryPDF
                            inventoryId={selectedPDFInventoryId}
                            onGenerated={handlePDFGenerated}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTable;
