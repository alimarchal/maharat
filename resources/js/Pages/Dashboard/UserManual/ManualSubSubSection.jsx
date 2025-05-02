import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import CreateUserGuide from "./CreateUserGuide";
import axios from "axios";

export default function ManualSubSubSection() {
    const { props } = usePage();
    console.log('ManualSubSubSection - Component initialized with props:', {
        props: props,
        section: props.section,
        subsection: props.subsection,
        card: props.card,
        currentUrl: window.location.pathname
    });

    const section = props.section;
    const subsection = props.subsection;
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subSubSections, setSubSubSections] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('ManualSubSubSection - useEffect triggered:', {
            section: section,
            subsection: subsection,
            currentUrl: window.location.pathname
        });
        fetchSubSubSections();
    }, [section, subsection]);

    const fetchSubSubSections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('ManualSubSubSection - Starting data fetch:', {
                section: section,
                subsection: subsection,
                currentUrl: window.location.pathname
            });

            const [cardsResponse, guidesResponse] = await Promise.all([
                axios.get("/api/v1/cards"),
                axios.get("/api/v1/user-manuals"),
            ]);

            console.log('ManualSubSubSection - API responses received:', {
                cardsResponse: cardsResponse.data,
                guidesResponse: guidesResponse.data,
                currentUrl: window.location.pathname
            });

            const allCards = cardsResponse.data.data || {};
            const subSubCards = allCards.sub_sub_cards || [];
            const subCards = allCards.sub_cards || [];
            const mainCards = allCards.main_cards || [];

            console.log('ManualSubSubSection - Card data processed:', {
                allCards,
                subSubCards,
                subCards,
                mainCards,
                section,
                subsection,
                currentUrl: window.location.pathname
            });

            // First try to find the parent card by id
            let parentSubCard = subCards.find(card => card.id === subsection);
            console.log('ManualSubSubSection - Parent card search by id:', {
                subsection,
                foundCard: parentSubCard,
                currentUrl: window.location.pathname
            });
            
            // If not found, try to find by subsection_id
            if (!parentSubCard) {
                parentSubCard = subCards.find(card => card.subsection_id === subsection);
                console.log('ManualSubSubSection - Parent card search by subsection_id:', {
                    subsection,
                    foundCard: parentSubCard,
                    currentUrl: window.location.pathname
                });
            }

            // If still not found, try to find in main cards
            if (!parentSubCard) {
                parentSubCard = mainCards.find(card => card.id === subsection);
                console.log('ManualSubSubSection - Parent card search in main cards:', {
                    subsection,
                    foundCard: parentSubCard,
                    currentUrl: window.location.pathname
                });
            }

            if (!parentSubCard) {
                console.log('ManualSubSubSection - No parent sub-card found:', {
                    subsection,
                    subCards,
                    mainCards,
                    currentUrl: window.location.pathname
                });
                setError("Parent sub-card not found");
                return;
            }

            console.log('ManualSubSubSection - Parent sub-card found:', {
                parentId: parentSubCard.id,
                sectionId: parentSubCard.section_id,
                subsectionId: parentSubCard.subsection_id,
                currentUrl: window.location.pathname
            });

            // Get sub-sub-cards for this parent
            const subSubSectionCards = subSubCards.filter(
                (card) => card.parent_id === parentSubCard.id
            );

            console.log('ManualSubSubSection - Filtered sub-sub-cards:', {
                parentId: parentSubCard.id,
                subSubCardsCount: subSubSectionCards.length,
                subSubCards: subSubSectionCards,
                currentUrl: window.location.pathname
            });

            // If no sub-sub-cards found, try to get children from the API
            if (subSubSectionCards.length === 0) {
                try {
                    console.log('ManualSubSubSection - No sub-sub-cards found, checking API for children:', {
                        parentId: parentSubCard.id,
                        currentUrl: window.location.pathname
                    });
                    const childrenResponse = await axios.get(`/api/v1/cards/${parentSubCard.id}/children`);
                    console.log('ManualSubSubSection - Children API response:', {
                        parentId: parentSubCard.id,
                        response: childrenResponse.data,
                        currentUrl: window.location.pathname
                    });
                    
                    if (childrenResponse.data.data && childrenResponse.data.data.children) {
                        setSubSubSections(childrenResponse.data.data.children);
                    } else {
                        setSubSubSections([]);
                    }
                } catch (error) {
                    console.error('ManualSubSubSection - Error fetching children:', {
                        error: error,
                        parentId: parentSubCard.id,
                        currentUrl: window.location.pathname
                    });
                    setSubSubSections([]);
                }
            } else {
                const sortedSubSubSections = subSubSectionCards.sort((a, b) => {
                    if (a.order !== undefined && b.order !== undefined) {
                        return a.order - b.order;
                    }
                    return a.id - b.id;
                });
                setSubSubSections(sortedSubSubSections);
            }

            const guidesData = guidesResponse.data?.data || [];
            const grouped = {};
            guidesData.forEach((guide) => {
                if (guide.card_id) {
                    if (!grouped[guide.card_id]) {
                        grouped[guide.card_id] = [];
                    }
                    grouped[guide.card_id].push(guide);
                }
            });

            setGuidesMap(grouped);
        } catch (error) {
            console.error("Error fetching sub-sub-sections:", error);
            setError("Failed to load sub-sub-sections. Please try again later.");
            setSubSubSections([]);
        } finally {
            setIsLoading(false);
        }
    };

    const SubSubManualSectionCard = ({ section }) => {
        const cardId = section.id;
        const title = section.name || section.title;
        const description = section.description;
        const guides = guidesMap[cardId] || [];

        const getImageUrl = () => {
            if (section.icon_path) {
                return `/storage/${section.icon_path}`;
            }
            if (section.image_path) {
                return `/storage/${section.image_path}`;
            }
            return `/images/manuals/${section.id}.png`;
        };

        const handleClick = async () => {
            console.log('ManualSubSubSection - Card clicked:', {
                cardId: cardId,
                cardName: title,
                sectionId: section.section_id,
                subsectionId: section.subsection_id
            });
            
            try {
                const response = await axios.get(`/api/v1/cards/${cardId}/children`);
                console.log('ManualSubSubSection - Children check response:', {
                    cardId: cardId,
                    hasChildren: response.data.data.has_children,
                    children: response.data.data.children
                });
                
                if (response.data.data.has_children) {
                    console.log('ManualSubSubSection - Routing to next level');
                    router.visit(`/user-manual/${section.section_id}/${section.subsection_id}/${cardId}`);
                } else {
                    const guide = guides[0];
                    console.log('ManualSubSubSection - No children, checking for guide:', {
                        hasGuide: !!guide,
                        guideId: guide?.id
                    });
                    
                    if (guide) {
                        console.log('ManualSubSubSection - Routing to GuideDetail');
                        router.visit(`/user-manual/guide/${guide.id}`, {
                            data: {
                                sectionId: section.section_id,
                                subsectionId: section.subsection_id,
                                cardId: cardId
                            }
                        });
                    } else {
                        console.log('ManualSubSubSection - No guide, staying on current level');
                        router.visit(`/user-manual/${section.section_id}/${section.subsection_id}`);
                    }
                }
            } catch (error) {
                console.error('ManualSubSubSection - Error checking for children:', error);
                const guide = guides[0];
                if (guide) {
                    console.log('ManualSubSubSection - Error fallback: Routing to GuideDetail');
                    router.visit(`/user-manual/guide/${guide.id}`, {
                        data: {
                            sectionId: section.section_id,
                            subsectionId: section.subsection_id,
                            cardId: cardId
                        }
                    });
                } else {
                    console.log('ManualSubSubSection - Error fallback: Staying on current level');
                    router.visit(`/user-manual/${section.section_id}/${section.subsection_id}`);
                }
            }
        };

        return (
            <div
                onClick={handleClick}
                className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg cursor-pointer"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{title}</h3>
                        <p className="text-base font-medium">{description}</p>
                    </div>
                    <div className="w-16 h-16 flex-shrink-0">
                        <img
                            src={getImageUrl()}
                            alt={title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.src = '/images/default-manual.png';
                                e.target.onerror = null; // Prevent infinite loop
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

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
                    {formatSectionTitle(subsection)}
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
                <div className="text-red-500 text-center">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {subSubSections.map((sectionCard) => (
                        <SubSubManualSectionCard
                            key={sectionCard.id}
                            section={sectionCard}
                        />
                    ))}
                </div>
            )}

            {/* Create User Guide Modal */}
            <CreateUserGuide
                isOpen={isCreateGuideOpen}
                onClose={() => {
                    setIsCreateGuideOpen(false);
                    fetchSubSubSections();
                }}
                sectionId={section}
                subsectionId={subsection}
            />
        </div>
    );
} 