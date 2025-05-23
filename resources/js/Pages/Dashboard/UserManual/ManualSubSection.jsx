import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import CreateUserGuide from "./CreateUserGuide";
import CardForm from "./CardForm";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faFile, faChevronUp, faChevronDown, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "react-hot-toast";

export default function UserManualSubSections() {
    const { props } = usePage();
    const section = props.section;
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subSections, setSubSections] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});
    const [error, setError] = useState(null);
    const [isManagingDirector, setIsManagingDirector] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedParentCard, setSelectedParentCard] = useState(null);
    const [currentCardLevel, setCurrentCardLevel] = useState(0);
    const [showCardForm, setShowCardForm] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetchSubSections();
        fetchUserData();
        // Check if user is managing director
        setIsManagingDirector(props.auth?.user?.designation === "Managing Director");
    }, [section]);

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

    const fetchSubSections = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if we have children data in the URL params
            const urlParams = new URLSearchParams(window.location.search);
            const childrenData = urlParams.get('children');
            const parentCardData = urlParams.get('parentCard');

            if (childrenData) {
                try {
                    const parsedChildren = JSON.parse(decodeURIComponent(childrenData));
                    console.log('ManualSubSection - Using children from URL params:', {
                        children: parsedChildren,
                        count: parsedChildren.length
                    });
                    setSubSections(parsedChildren);
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.error('ManualSubSection - Error parsing children data:', e);
                }
            }

            const [cardsResponse, guidesResponse] = await Promise.all([
                axios.get("/api/v1/cards"),
                axios.get("/api/v1/user-manuals"),
            ]);

            const allCards = cardsResponse.data.data;
            const subCards = allCards.sub_cards || [];
            const mainCards = allCards.main_cards || [];

            // Find the parent card for this section
            const parentCard = mainCards.find(card => 
                card.section_id === section || 
                card.id === section
            );

            if (!parentCard) {
                setError("Parent card not found");
                return;
            }

            console.log('ManualSubSection - Parent card found:', {
                parentId: parentCard.id,
                sectionId: parentCard.section_id
            });

            // Get sub-cards for this parent
            const subsectionCards = subCards.filter(
                (card) => card.parent_id === parentCard.id
            );

            console.log('ManualSubSection - Filtered sub-cards:', {
                parentId: parentCard.id,
                subCardsCount: subsectionCards.length,
                subCards: subsectionCards
            });

            const sortedSubsections = subsectionCards.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return a.id - b.id;
            });

            setSubSections(sortedSubsections);

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
            console.error("Error fetching sub-sections:", error);
            setError("Failed to load sub-sections. Please try again later.");
            setSubSections([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination || !isAdmin) return;

        const items = Array.from(subSections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setSubSections(items);

        try {
            const reorderedItems = items.map((item, index) => ({
                id: item.id,
                order: index,
            }));

            await axios.post(
                "/api/v1/cards/reorder",
                { items: reorderedItems },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (error) {
            console.error("Error reordering sub-cards:", error);
            fetchSubSections(); // Revert to original order if error occurs
        }
    };

    const formatSectionTitle = (sectionId) => {
        return sectionId
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const SubManualSectionCard = ({ sectionCard, provided }) => {
        const cardId = sectionCard.id;
        const title = sectionCard.name;
        const description = sectionCard.description;
        const guides = guidesMap[cardId] || [];

        const handleClick = async () => {
            console.log('ManualSubSection - Starting card click handler:', {
                cardId: cardId,
                cardName: title,
                sectionId: sectionCard.section_id,
                subsectionId: sectionCard.subsection_id,
                currentUrl: window.location.pathname
            });
            
            try {
                console.log('ManualSubSection - Checking for children at:', `/api/v1/cards/${cardId}/children`);
                const response = await axios.get(`/api/v1/cards/${cardId}/children`);
                console.log('ManualSubSection - Children check response:', {
                    cardId: cardId,
                    hasChildren: response.data.data.has_children,
                    children: response.data.data.children,
                    responseData: response.data
                });
                
                if (response.data.data.has_children) {
                    // For any card with children, use section_id and subsection_id directly
                    const targetUrl = `/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id}`;
                    console.log('ManualSubSection - Card has children, routing to:', {
                        targetUrl: targetUrl,
                        currentUrl: window.location.pathname,
                        sectionId: sectionCard.section_id,
                        subsectionId: sectionCard.subsection_id,
                        cardName: title
                    });
                    router.get(targetUrl, {
                        cardId: cardId
                    }, {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true
                    });
                } else {
                    const guide = guides[0];
                    console.log('ManualSubSection - No children, checking for guide:', {
                        hasGuide: !!guide,
                        guideId: guide?.id
                    });
                    
                    if (guide) {
                        console.log('ManualSubSection - Routing to GuideDetail');
                        router.visit(`/user-manual/guide/${guide.id}`);
                    } else {
                        // For any card without children and no guide, use section_id and subsection_id directly
                        const targetUrl = `/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id}`;
                        console.log('ManualSubSection - No guide, routing to card URL with cardId');
                        router.get(targetUrl, {
                            cardId: cardId
                        }, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true
                        });
                    }
                }
            } catch (error) {
                console.error('ManualSubSection - Error checking for children:', error);
                const guide = guides[0];
                if (guide) {
                    console.log('ManualSubSection - Error fallback: Routing to GuideDetail');
                    router.visit(`/user-manual/guide/${guide.id}`);
                } else {
                    // For any card without children and no guide, use section_id and subsection_id directly
                    const targetUrl = `/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id}`;
                    console.log('ManualSubSection - Error fallback: Routing to card URL with cardId');
                    router.get(targetUrl, {
                        cardId: cardId
                    }, {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true
                    });
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
                                        setSelectedCard(null);
                                        setSelectedParentCard(sectionCard);
                                        setCurrentCardLevel(2);
                                        setShowCardForm(true);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="text-lg" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedCard(sectionCard);
                                        setSelectedParentCard(null);
                                        setCurrentCardLevel(1);
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

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    {formatSectionTitle(section)}
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
                    <Droppable droppableId="sub-sections">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                            >
                                {subSections.map((sectionCard, index) => (
                                    <Draggable
                                        key={sectionCard.id}
                                        draggableId={sectionCard.id.toString()}
                                        index={index}
                                        isDragDisabled={!isAdmin}
                                    >
                                        {(provided) => (
                                            <SubManualSectionCard
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
                    fetchSubSections();
                }}
                sectionId={section}
                subsectionId={undefined}
            />

            {/* Card Form Modal */}
            <CardForm
                isOpen={showCardForm}
                onClose={() => {
                    setShowCardForm(false);
                    setSelectedCard(null);
                    setSelectedParentCard(null);
                    fetchSubSections();
                }}
                card={selectedCard}
                parentCard={selectedParentCard}
                level={currentCardLevel}
            />
        </div>
    );
}
