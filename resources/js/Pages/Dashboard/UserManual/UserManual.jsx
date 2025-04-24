import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import CreateUserGuide from "./CreateUserGuide";

export default function UserManual() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [userDesignation, setUserDesignation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isManagingDirector, setIsManagingDirector] = useState(false);
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);
    const [cards, setCards] = useState([]);
    const [parentCards, setParentCards] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});

    useEffect(() => {
        fetchUserDesignation();
        fetchCards();
        
        // Check URL parameters for opening the Create Guide modal
        const url = new URL(window.location.href);
        const openCreateGuide = url.searchParams.get('openCreateGuide');
        const sectionId = url.searchParams.get('sectionId');
        const subsectionId = url.searchParams.get('subsectionId');
        
        if (openCreateGuide === 'true') {
            console.log("Opening Create Guide modal from URL parameters");
            console.log(`Section ID: ${sectionId}, Subsection ID: ${subsectionId}`);
            setIsCreateGuideOpen(true);
        }
    }, [user]);

    const fetchUserDesignation = async () => {
        if (!user?.designation_id) {
            processDesignationData(null);
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(
                `/api/v1/designations/${user.designation_id}`
            );
            const designationData = extractDesignationName(response.data);
            processDesignationData(designationData);
        } catch (error) {
            console.error("Error fetching designation:", error);
            fallbackToAuthUser();
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCards = async () => {
        try {
            setIsLoading(true);
            const [cardsResponse, guidesResponse] = await Promise.all([
                axios.get('/api/v1/cards'),
                axios.get('/api/v1/user-manuals')
            ]);
            
            console.log("Cards data:", cardsResponse.data);
            console.log("Guides data:", guidesResponse.data);
            
            if (cardsResponse.data && cardsResponse.data.data) {
                const allCards = cardsResponse.data.data;
                
                // Separate parent cards from subsection cards
                const parentCardsArray = allCards.filter(card => !card.subsection_id);
                const subsectionCards = allCards.filter(card => card.subsection_id);
                
                // Group subsection cards by their parent IDs
                const subsectionsByParent = {};
                subsectionCards.forEach(card => {
                    if (!subsectionsByParent[card.section_id]) {
                        subsectionsByParent[card.section_id] = [];
                    }
                    subsectionsByParent[card.section_id].push(card);
                });
                
                // Sort each group of subsections by order
                Object.keys(subsectionsByParent).forEach(sectionId => {
                    subsectionsByParent[sectionId].sort((a, b) => {
                        // If order exists, sort by order; otherwise, fall back to id
                        if (a.order !== undefined && b.order !== undefined) {
                            return a.order - b.order;
                        }
                        return a.id - b.id;
                    });
                });
                
                // Add subsections to parent cards and sort parent cards by order
                const parentsWithSubsections = parentCardsArray
                    .map(parent => ({
                        ...parent,
                        subsections: subsectionsByParent[parent.section_id] || []
                    }))
                    .sort((a, b) => {
                        // If order exists, sort by order; otherwise, fall back to id
                        if (a.order !== undefined && b.order !== undefined) {
                            return a.order - b.order;
                        }
                        return a.id - b.id;
                    });
                
                setParentCards(parentsWithSubsections);
                setCards(allCards);
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
            console.error("Error fetching cards and guides:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const extractDesignationName = (data) => {
        if (!data) return null;
        if (data.data?.designation) return data.data.designation;
        if (data.designation) return data.designation;
        if (data.data) {
            if (data.data.designation) return data.data.designation;
            if (typeof data.data === "string") return data.data;
        }
        if (typeof data === "object" && data !== null) {
            if (data.designation) return data.designation;
            if (data.name) return data.name;
        }
        return null;
    };

    const processDesignationData = (designationName) => {
        if (typeof designationName === "object" && designationName !== null) {
            designationName =
                designationName.designation ||
                designationName.name ||
                JSON.stringify(designationName);
        }
        setUserDesignation(designationName);
        setIsManagingDirector(designationName === "Managing Director");
    };

    const fallbackToAuthUser = () => {
        if (!auth?.user) {
            setUserDesignation(null);
            setIsManagingDirector(false);
            return;
        }

        let designationName = null;
        if (auth.user.designation) {
            designationName =
                auth.user.designation.designation ||
                auth.user.designation.name ||
                auth.user.designation;
        } else if (auth.user.designation_id === 1) {
            designationName = "Managing Director";
        }
        processDesignationData(designationName);
    };

    // Map card IDs to our hardcoded section IDs for backward compatibility
    const cardToSectionMapping = {
        1: "login-details",
        2: "notification-settings",
        9: "warehouse",
        11: "reports"
        // Add more mappings as needed
    };
    
    // Define which sections have subsections
    const sectionsWithSubsections = [
        "procurement", "finance", "warehouse", "budget", "configuration"
    ];

    // Display cards with associated guides
    const CardSection = ({ card }) => {
        const guides = guidesMap[card.id] || [];
        const sectionId = card.section_id || `card-${card.id}`;
        const hasSubsections = card.subsections && card.subsections.length > 0;
        
        // Determine the correct link based on whether this card has subsections
        let cardLink;
        
        if (hasSubsections) {
            // If card has subsections, link to the subsection page
            cardLink = `/user-manual/${sectionId}`;
        } else if (guides.length > 0 && !isNaN(parseInt(guides[0].id))) {
            // If card has guides, link directly to the first guide
            cardLink = `/user-manual/guide/${guides[0].id}`;
        } else {
            // If card has no guides, link to an empty guide detail page that will show "under construction"
            cardLink = `/user-manual/${sectionId}`;
        }
        
        const CardContent = () => (
            <>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-medium text-gray-800 mb-2">
                            {card.name}
                        </h3>
                        <p className="text-gray-600">{card.description || `Guide for ${card.name}`}</p>
                    </div>
                    <div className="w-16 h-16 flex-shrink-0">
                        <img
                            src={`/images/manuals/${sectionId}.png`}
                            alt={card.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/images/placeholder.png";
                            }}
                        />
                    </div>
                </div>
            </>
        );
        
        return (
            <div className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg">
                {cardLink ? (
                    <Link href={cardLink} className="block h-full">
                        <CardContent />
                    </Link>
                ) : (
                    <CardContent />
                )}
            </div>
        );
    };

    const groupCardsIntoRows = (cards, itemsPerRow = 3) => {
        const rows = [];
        for (let i = 0; i < cards.length; i += itemsPerRow) {
            rows.push(cards.slice(i, i + itemsPerRow));
        }
        return rows;
    };

    const cardRows = groupCardsIntoRows(parentCards);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    User Manual
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
            ) : (
                <div className="space-y-6">
                    {cardRows.map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {row.map((card) => (
                                <CardSection key={card.id} card={card} />
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
                    // Refresh the guides when the modal is closed
                    fetchCards();
                    
                    // Remove URL parameters if they exist
                    const url = new URL(window.location.href);
                    if (url.searchParams.has('openCreateGuide')) {
                        url.searchParams.delete('openCreateGuide');
                        url.searchParams.delete('sectionId');
                        url.searchParams.delete('subsectionId');
                        window.history.replaceState({}, '', url.toString());
                    }
                }} 
                sectionId={new URL(window.location.href).searchParams.get('sectionId') || undefined}
                subsectionId={new URL(window.location.href).searchParams.get('subsectionId') || undefined}
            />
        </div>
    );
}
