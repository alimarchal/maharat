import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import CreateUserGuide from "./CreateUserGuide";
import axios from "axios";

export default function UserManualSubSections() {
    const { props } = usePage();
    const section = props.section;
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subSections, setSubSections] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubSections();
    }, [section]);

    const fetchSubSections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [cardsResponse, guidesResponse] = await Promise.all([
                axios.get('/api/v1/cards'),
                axios.get('/api/v1/user-manuals')
            ]);
            
            if (cardsResponse.data && cardsResponse.data.data) {
                // Filter for subsection cards that match the current section
                const subsectionCards = cardsResponse.data.data.filter(card => 
                    card.section_id === section && card.subsection_id
                );
                
                // Sort subsection cards by order
                const sortedSubsections = subsectionCards.sort((a, b) => {
                    if (a.order !== undefined && b.order !== undefined) {
                        return a.order - b.order;
                    }
                    return a.id - b.id;
                });
                
                setSubSections(sortedSubsections);
            }
            
            // Group guides by card_id
            const guidesData = guidesResponse.data.data || [];
            const guidesGrouped = {};
            
            guidesData.forEach(guide => {
                if (guide.card_id) {
                    if (!guidesGrouped[guide.card_id]) {
                        guidesGrouped[guide.card_id] = [];
                    }
                    guidesGrouped[guide.card_id].push(guide);
                }
            });
            
            setGuidesMap(guidesGrouped);
        } catch (error) {
            console.error("Error fetching subsections:", error);
            setError("Failed to load subsections. Please try again later.");
            setSubSections([]);
        } finally {
            setIsLoading(false);
        }
    };

    const SubManualSectionCard = ({ section }) => {
        // For database cards, use card properties
        const cardId = section.id;
        const title = section.name || section.title;
        const description = section.description;
        const subsectionId = section.subsection_id || section.id;
        const guides = guidesMap[cardId] || [];
        
        // Determine image URL based on section type
        const imageUrl = section.imageUrl || `/images/manuals/${props.section}.png`;
        
        // Determine the link based on whether there are guides for this card
        let linkUrl;
        if (guides.length > 0 && !isNaN(parseInt(guides[0].id))) {
            // If there's a guide, link directly to it
            linkUrl = `/user-manual/guide/${guides[0].id}`;
        } else {
            // Otherwise, link to subsection page
            linkUrl = `/user-manual/${props.section}/${subsectionId}`;
        }
        
        return (
        <Link
                href={linkUrl}
            className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                            {title}
                    </h3>
                        <p className="text-gray-600">{description}</p>
                </div>
                    <div className="w-16 h-16 flex-shrink-0">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/images/placeholder.png";
                            }}
                        />
                    </div>
            </div>
        </Link>
    );
    };

    const groupSectionsIntoRows = (sections, itemsPerRow = 3) => {
        const rows = [];
        for (let i = 0; i < sections.length; i += itemsPerRow) {
            rows.push(sections.slice(i, i + itemsPerRow));
        }
        return rows;
    };

    const sectionRows = groupSectionsIntoRows(subSections);

    // Format the section title by capitalizing each word and replacing hyphens with spaces
    const formatSectionTitle = (sectionId) => {
        return sectionId
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    {formatSectionTitle(section)} User Manual
                </h2>
                <button
                    type="button"
                    onClick={() => setIsCreateGuideOpen(true)}
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create a User Guide
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow border border-red-300 text-center">
                    <p>{error}</p>
                    <button 
                        onClick={fetchSubSections}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : subSections.length === 0 ? (
                <div className="bg-yellow-100 text-yellow-800 p-6 rounded-lg shadow text-center">
                    <h3 className="text-xl font-semibold mb-2">No subsections found</h3>
                    <p className="mb-4">There are no subsections available for {formatSectionTitle(section)} yet.</p>
                    <button
                        onClick={() => setIsCreateGuideOpen(true)}
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                        Create First Guide
                    </button>
                </div>
            ) : (
            <div className="space-y-6">
                {sectionRows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                            {row.map((section) => (
                            <SubManualSectionCard
                                    key={section.id}
                                section={section}
                            />
                        ))}
                    </div>
                ))}
            </div>
            )}

            {/* Create User Guide Modal */}
            <CreateUserGuide 
                isOpen={isCreateGuideOpen} 
                onClose={() => {
                    setIsCreateGuideOpen(false);
                    // Refresh data when modal closes
                    fetchSubSections();
                }} 
                sectionId={section}
            />
        </div>
    );
}
