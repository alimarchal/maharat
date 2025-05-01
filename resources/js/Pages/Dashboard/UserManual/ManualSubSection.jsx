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

    useEffect(() => {
        fetchSubSections();
        // Check if user is managing director
        setIsManagingDirector(props.auth?.user?.designation === "Managing Director");
    }, [section]);

    const fetchSubSections = async () => {
        try {
            setIsLoading(true);
            setError(null);
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

            // Check if this card is a parent by looking at all sub-cards
            const isParent = subCards.some(subCard => subCard.parent_id === parentCard.id);

            if (!isParent) {
                // If not a parent, redirect to guide detail
                router.visit(`/user-manual/${parentCard.section_id}/${parentCard.subsection_id || parentCard.id}`);
                return;
            }

            // Get sub-cards for this parent
            const subsectionCards = subCards.filter(
                (card) => card.parent_id === parentCard.id
            );

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
            console.error("Error fetching subsections:", error);
            setError("Failed to load subsections. Please try again later.");
            setSubSections([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(subSections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order numbers
        const updatedCards = items.map((card, index) => ({
            ...card,
            order: index + 1
        }));

        setSubSections(updatedCards);

        try {
            await axios.post('/api/v1/cards/reorder', {
                cards: updatedCards.map(card => ({
                    id: card.id,
                    order: card.order,
                    parent_id: card.parent_id
                }))
            });
            toast.success('Cards reordered successfully');
        } catch (error) {
            console.error('Error reordering cards:', error);
            toast.error('Failed to reorder cards');
            // Refresh cards to restore original order
            fetchSubSections();
        }
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
                    <Droppable droppableId="subSections">
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
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div 
                                                        className="flex-grow cursor-pointer"
                                                        onClick={() => {
                                                            router.visit(`/user-manual/${sectionCard.section_id}/${sectionCard.subsection_id || sectionCard.id}`);
                                                        }}
                                                    >
                                                        <div>
                                                            <h3 className="text-2xl font-bold mb-2">
                                                                {sectionCard.name}
                                                            </h3>
                                                            <p className="text-base font-medium">
                                                                {sectionCard.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-16 h-16 flex-shrink-0">
                                                            <img
                                                                src={sectionCard.icon_path ? `/storage/${sectionCard.icon_path}` : `/images/manuals/${sectionCard.subsection_id || sectionCard.id}.png`}
                                                                alt={sectionCard.name}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    e.target.src = '/images/manuals/default.png';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-center space-y-2">
                                                            <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-[#009FDC]/10 rounded-full transition-colors duration-200">
                                                                <FontAwesomeIcon icon={faGripVertical} className="text-[#009FDC] hover:text-[#007BB5] transition-colors duration-200" />
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
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
                                                    </div>
                                                </div>
                                            </div>
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
