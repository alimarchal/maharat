import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";
import CreateUserGuide from "./CreateUserGuide";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes, faEdit, faFile, faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import CardForm from "./CardForm";

// Fallback input component if InputFloating is not available
const InputFloating = ({ label, type, value, onChange }) => (
    <div className="relative">
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#009FDC] focus:border-[#009FDC]"
            placeholder=" "
            required
        />
        <label className="absolute left-3 -top-2 bg-white px-1 text-sm text-gray-500">
            {label}
        </label>
    </div>
);

export default function UserManual() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [userDesignation, setUserDesignation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isManagingDirector, setIsManagingDirector] = useState(false);
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);
    const [parentCards, setParentCards] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});
    const [subCardsMap, setSubCardsMap] = useState({});
    const [showCardForm, setShowCardForm] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedParentCard, setSelectedParentCard] = useState(null);
    const [currentCardLevel, setCurrentCardLevel] = useState(0);
    const [subCards, setSubCards] = useState([]);

    useEffect(() => {
        fetchUserDesignation();
        fetchCards();

        const url = new URL(window.location.href);
        const openCreateGuide = url.searchParams.get("openCreateGuide");
        const sectionId = url.searchParams.get("sectionId");
        const subsectionId = url.searchParams.get("subsectionId");

        if (openCreateGuide === "true") {
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
            fallbackToAuthUser();
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCards = async () => {
        try {
            setIsLoading(true);
            const [cardsRes, guidesRes] = await Promise.all([
                axios.get("/api/v1/cards"),
                axios.get("/api/v1/user-manuals"),
            ]);

            // Convert main_cards to array if it's a collection
            const mainCards = Array.isArray(cardsRes.data.data.main_cards) 
                ? cardsRes.data.data.main_cards 
                : Object.values(cardsRes.data.data.main_cards || {});

            const subCards = cardsRes.data.data.sub_cards || [];
            const guidesData = guidesRes.data?.data || [];

            // Create a map of sub-cards by parent_id
            const subCardsByParent = {};
            subCards.forEach(subCard => {
                if (!subCardsByParent[subCard.parent_id]) {
                    subCardsByParent[subCard.parent_id] = [];
                }
                subCardsByParent[subCard.parent_id].push(subCard);
            });
            setSubCardsMap(subCardsByParent);

            const sortedMainCards = mainCards.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return a.id - b.id;
            });

            setParentCards(sortedMainCards);

            const guidesGrouped = {};
            guidesData.forEach((guide) => {
                if (guide.card_id) {
                    if (!guidesGrouped[guide.card_id]) {
                        guidesGrouped[guide.card_id] = [];
                    }
                    guidesGrouped[guide.card_id].push(guide);
                }
            });

            setGuidesMap(guidesGrouped);
            setSubCards(subCards);
        } catch (error) {
            console.error("Error fetching cards/guides", error);
        } finally {
            setIsLoading(false);
        }
    };

    const extractDesignationName = (data) => {
        if (!data) return null;
        return (
            data?.data?.designation ||
            data?.designation ||
            data?.data ||
            data?.name ||
            null
        );
    };

    const processDesignationData = (designationName) => {
        if (typeof designationName === "object") {
            designationName =
                designationName.designation ||
                designationName.name ||
                JSON.stringify(designationName);
        }
        setUserDesignation(designationName);
        setIsManagingDirector(designationName === "Managing Director");
    };

    const fallbackToAuthUser = () => {
        if (!auth?.user) return;
        const designation = auth.user.designation;
        let designationName = null;

        if (designation) {
            designationName =
                designation.designation || designation.name || designation;
        } else if (auth.user.designation_id === 1) {
            designationName = "Managing Director";
        }

        processDesignationData(designationName);
    };

    const CardSection = ({ card, guides, onAddSubCard, onEditCard }) => {
        // Check if this card is a parent by looking at all sub-cards
        const isParent = subCards.some(subCard => subCard.parent_id === card.id);

        const handleCardClick = () => {
            if (isParent) {
                // If card is a parent, navigate to sub-section
                router.visit(`/user-manual/${card.section_id}`);
            } else {
                // If not a parent, navigate to guide detail
                router.visit(`/user-manual/${card.section_id}/${card.subsection_id || card.id}`);
            }
        };

        // Get the correct image path
        const getImagePath = () => {
            if (card.icon_path) {
                return `/storage/${card.icon_path}`;
            }
            
            // Then try the section_id based path
            if (card.section_id) {
                return `/images/manuals/${card.section_id}.png`;
            }
            
            // Finally fallback to default
            return '/images/default-manual.png';
        };

        return (
            <div className="bg-white rounded-xl shadow-md p-6 transition-transform cursor-pointer hover:translate-y-[-5px] hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-grow" onClick={handleCardClick}>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">
                                {card.name}
                            </h3>
                            <p className="text-base font-medium">
                                {card.description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <div className="w-16 h-16 flex-shrink-0">
                            <img
                                src={getImagePath()}
                                alt={card.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    // If image fails to load, show the default icon
                                    e.target.src = '/images/default-manual.png';
                                }}
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onAddSubCard();
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition-colors duration-200"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-lg" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onEditCard();
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition-colors duration-200"
                            >
                                <FontAwesomeIcon icon={faEdit} className="text-lg" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {parentCards.map((card) => (
                        <CardSection
                            key={card.id}
                            card={card}
                            guides={guidesMap[card.id] || []}
                            onAddSubCard={() => {
                                setSelectedCard(null);
                                setSelectedParentCard(card);
                                setCurrentCardLevel(1);
                                setShowCardForm(true);
                            }}
                            onEditCard={() => {
                                setSelectedCard(card);
                                setSelectedParentCard(null);
                                setCurrentCardLevel(0);
                                setShowCardForm(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {showCardForm && (
                <CardForm
                    isOpen={showCardForm}
                    onClose={() => {
                        setShowCardForm(false);
                        setSelectedCard(null);
                        setSelectedParentCard(null);
                        fetchCards();
                    }}
                    card={selectedCard}
                    parentCard={selectedParentCard}
                    level={currentCardLevel}
                />
            )}

            {/* Create User Guide Modal */}
            <CreateUserGuide
                isOpen={isCreateGuideOpen}
                onClose={() => {
                    setIsCreateGuideOpen(false);
                    fetchCards();
                }}
                sectionId={new URL(window.location.href).searchParams.get("sectionId") || undefined}
                subsectionId={new URL(window.location.href).searchParams.get("subsectionId") || undefined}
            />
        </div>
    );
}
