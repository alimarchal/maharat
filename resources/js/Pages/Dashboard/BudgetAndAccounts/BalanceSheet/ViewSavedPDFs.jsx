import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-hot-toast";

const ViewSavedPDFs = ({ year }) => {
    const [savedPDFs, setSavedPDFs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (year) {
            fetchSavedPDFs(year);
        }
    }, [year]);

    const fetchSavedPDFs = async (year) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/v1/balance-sheet/saved-pdfs/${year}`);
            if (response.data && response.data.pdfs) {
                setSavedPDFs(response.data.pdfs);
            }
        } catch (error) {
            console.error("Error fetching saved PDFs:", error);
            toast.error("Failed to fetch saved PDFs");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!savedPDFs.length) {
        return (
            <div className="text-gray-500 text-center py-6">
                <FontAwesomeIcon icon={faFilePdf} className="text-3xl mb-2" />
                <p>No saved PDFs for {year}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Saved Balance Sheet PDFs</h3>
            <div className="bg-white rounded-lg shadow-md">
                {savedPDFs.map((pdf, index) => (
                    <div 
                        key={index} 
                        className={`p-4 flex items-center justify-between ${
                            index !== savedPDFs.length - 1 ? "border-b border-gray-200" : ""
                        }`}
                    >
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faFilePdf} className="text-red-500 text-xl mr-3" />
                            <div>
                                <p className="font-medium">{pdf.filename || `Balance Sheet ${year}`}</p>
                                <p className="text-sm text-gray-500">{pdf.created_at || "Unknown date"}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => window.open(`/storage/${pdf.path}`, '_blank')}
                                className="text-blue-500 hover:text-blue-700 p-2"
                                title="View PDF"
                            >
                                <FontAwesomeIcon icon={faEye} />
                            </button>
                            <a
                                href={`/storage/${pdf.path}`}
                                download={pdf.filename || `Balance_Sheet_${year}.pdf`}
                                className="text-green-500 hover:text-green-700 p-2"
                                title="Download PDF"
                            >
                                <FontAwesomeIcon icon={faDownload} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ViewSavedPDFs; 