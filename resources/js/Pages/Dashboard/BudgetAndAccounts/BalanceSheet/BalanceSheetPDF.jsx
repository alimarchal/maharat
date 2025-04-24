import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faFilePdf, faDownload, faSave } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-hot-toast";

const BalanceSheetPDF = ({ isOpen, onClose, balanceSheetData, summary, year }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const generatePDF = async () => {
        try {
            setIsGenerating(true);
            // Send data to backend to generate PDF
            const response = await axios.post("/api/v1/balance-sheet/generate-pdf", {
                balanceSheetData,
                summary,
                year
            });

            if (response.data && response.data.pdf_url) {
                setPdfUrl(response.data.pdf_url);
                toast.success("PDF generated successfully");
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const savePDF = async () => {
        if (!pdfUrl) return;
        
        try {
            setIsSaving(true);
            // Save the PDF URL to the database
            const response = await axios.post("/api/v1/balance-sheet/save-pdf", {
                pdf_url: pdfUrl,
                year
            });

            if (response.data && response.data.success) {
                toast.success("PDF saved successfully");
                onClose();
            }
        } catch (error) {
            console.error("Error saving PDF:", error);
            toast.error("Failed to save PDF");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-[#2C323C]">
                        Balance Sheet PDF Generator
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} className="text-xl" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Generate Balance Sheet PDF</h3>
                        <p className="text-gray-600 mb-4">
                            This will create a PDF version of the {year} balance sheet report which you can download or save to the system.
                        </p>
                        
                        {!pdfUrl ? (
                            <button
                                onClick={generatePDF}
                                disabled={isGenerating}
                                className="flex items-center justify-center bg-[#009FDC] text-white px-6 py-3 rounded-md hover:bg-[#0077B6] transition duration-200 w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                                        Generate PDF
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faFilePdf} className="text-red-500 text-xl mr-3" />
                                        <span>Balance Sheet {year}.pdf</span>
                                    </div>
                                    <a
                                        href={pdfUrl}
                                        download={`Balance_Sheet_${year}.pdf`}
                                        className="text-[#009FDC] hover:text-[#0077B6]"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                    </a>
                                </div>
                                
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => {
                                            setPdfUrl(null);
                                        }}
                                        className="flex-1 flex items-center justify-center bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition duration-200"
                                    >
                                        Generate New PDF
                                    </button>
                                    
                                    <button
                                        onClick={savePDF}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-200"
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                                Save to System
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-2">PDF Preview</h3>
                        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                            {pdfUrl ? (
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                                    className="w-full h-full rounded-lg"
                                    title="Balance Sheet PDF Preview"
                                />
                            ) : (
                                <div className="text-gray-500 text-center">
                                    <FontAwesomeIcon icon={faFilePdf} className="text-4xl mb-3" />
                                    <p>Generate the PDF to see a preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheetPDF; 