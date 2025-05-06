import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import CreateUserGuide from "./CreateUserGuide";
import CardForm from "./CardForm";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faFile, faChevronUp, faChevronDown, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCardForm, setShowCardForm] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedParentCard, setSelectedParentCard] = useState(null);
    const [currentCardLevel, setCurrentCardLevel] = useState(2);

    useEffect(() => {
        console.log('ManualSubSubSection - useEffect triggered:', {
            section: section,
            subsection: subsection,
            currentUrl: window.location.pathname
        });
        fetchSubSubSections();
        fetchUserData();
    }, [section, subsection]);

    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/v1/user/current", {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (response.data && response.data.data) {
                const userData = response.data.data;
                setIsAdmin(userData.roles && userData.roles.includes("Admin"));
            } else {
                console.error("Invalid user data format:", response.data);
                setIsAdmin(false);
            }
        } catch (error) {
            if (error.response) {
                console.error("Response data:", error.response.data);
            }
            setIsAdmin(false);
        }
    };

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

    const handleDragEnd = async (result) => {
        if (!result.destination || !isAdmin) return;

        const items = Array.from(subSubSections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setSubSubSections(items);

        try {
            const reorderedItems = items.map((item, index) => ({
                id: item.id,
                order: index,
                parent_id: item.parent_id
            }));

            console.log('ManualSubSubSection - Sending reorder request:', {
                items: reorderedItems
            });

            await axios.post(
                "/api/v1/cards/reorder",
                { cards: reorderedItems },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            // Refresh data after successful reorder
            fetchSubSubSections();
        } catch (error) {
            console.error("Error reordering cards:", error);
            fetchSubSubSections(); // Revert to original order if error occurs
        }
    };

    const SubSubManualSectionCard = ({ sectionCard, provided }) => {
        const cardId = sectionCard.id;
        const title = sectionCard.name || sectionCard.title;
        const description = sectionCard.description;
        const guides = guidesMap[cardId] || [];

        const handleClick = async () => {
            if (isAdmin) return; // Prevent navigation if in admin mode
            
            console.log('ManualSubSubSection - Card clicked:', {
                cardId: cardId,
                cardName: title,
                sectionId: sectionCard.section_id,
                subsectionId: sectionCard.subsection_id,
                parentId: sectionCard.parent_id
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
                    router.visit(`/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id}/${cardId}`);
                } else {
                    const guide = guides[0];
                    console.log('ManualSubSubSection - No children, checking for guide:', {
                        hasGuide: !!guide,
                        guideId: guide?.id
                    });
                    
                    if (guide) {
                        console.log('ManualSubSubSection - Routing to GuideDetail');
                        router.visit(`/user-manual/guide/${guide.id}`);
                    } else {
                        console.log('ManualSubSubSection - No guide, staying on current level');
                        router.visit(`/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id}`);
                    }
                }
            } catch (error) {
                console.error('ManualSubSubSection - Error checking for children:', error);
                const guide = guides[0];
                if (guide) {
                    console.log('ManualSubSubSection - Error fallback: Routing to GuideDetail');
                    router.visit(`/user-manual/guide/${guide.id}`);
                } else {
                    console.log('ManualSubSubSection - Error fallback: Staying on current level');
                    router.visit(`/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id}`);
                }
            }
        };

        return (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg cursor-pointer"
                onClick={handleClick}
            >
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">
                            {title}
                        </h3>
                        {isAdmin && (
                            <div className="flex items-center space-x-2">
                                <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-[#009FDC]/10 rounded-full transition-colors duration-200">
                                    <FontAwesomeIcon icon={faGripVertical} className="text-[#009FDC] hover:text-[#007BB5] transition-colors duration-200" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedCard({
                                            ...sectionCard,
                                            parent_id: sectionCard.parent_id,
                                            subsection_id: sectionCard.subsection_id
                                        });
                                        setSelectedParentCard(null);
                                        setCurrentCardLevel(2);
                                        setShowCardForm(true);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center">
                        <p className="text-base font-medium flex-grow">
                            {description}
                        </p>
                        <div className="w-16 h-16 flex-shrink-0 ml-1">
                            <img
                                src={sectionCard.icon_path ? `/storage/${sectionCard.icon_path}` : `/images/manuals/${sectionCard.section_id}.png`}
                                alt={title}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.target.src = '/images/default-manual.png';
                                }}
                            />
                        </div>
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
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="sub-sub-sections">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                            >
                                {subSubSections.map((sectionCard, index) => (
                                    <Draggable
                                        key={sectionCard.id}
                                        draggableId={sectionCard.id.toString()}
                                        index={index}
                                        isDragDisabled={!isAdmin}
                                    >
                                        {(provided) => (
                                            <SubSubManualSectionCard
                                                key={sectionCard.id}
                                                sectionCard={sectionCard}
                                                provided={provided}
                                            />
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
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

            {/* Card Form Modal */}
            <CardForm
                isOpen={showCardForm}
                onClose={() => {
                    setShowCardForm(false);
                    setSelectedCard(null);
                    setSelectedParentCard(null);
                    fetchSubSubSections();
                }}
                card={selectedCard}
                parentCard={selectedParentCard}
                level={currentCardLevel}
            />
        </div>
    );
} 