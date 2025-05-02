import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import CreateUserGuide from "./CreateUserGuide";
import axios from "axios";

export default function ManualSubSubSection() {
    const { props } = usePage();
    const section = props.section;
    const subsection = props.subsection;
    const [isCreateGuideOpen, setIsCreateGuideOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subSubSections, setSubSubSections] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubSubSections();
    }, [section, subsection]);

    const fetchSubSubSections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [cardsResponse, guidesResponse] = await Promise.all([
                axios.get("/api/v1/cards"),
                axios.get("/api/v1/user-manuals"),
            ]);

            const allCards = cardsResponse.data.data;
            const subSubCards = allCards.sub_sub_cards || [];
            const subCards = allCards.sub_cards || [];

            // Find the parent sub-card for this section
            const parentSubCard = subCards.find(card => 
                card.id === subsection
            );

            // Get sub-sub-cards for this parent
            const subSubSectionCards = subSubCards.filter(
                (card) => card.parent_id === parentSubCard?.id
            );

            const sortedSubSubSections = subSubSectionCards.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return a.id - b.id;
            });

            setSubSubSections(sortedSubSubSections);

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

        let linkUrl = guides.length > 0
            ? `/user-manual/guide/${guides[0].id}`
            : `/user-manual/${section}/${subsection}/${section.id}`;

        return (
            <Link
                href={linkUrl}
                className="bg-white rounded-xl shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{title}</h3>
                        <p className="text-base font-medium">{description}</p>
                    </div>
                    <div className="w-16 h-16 flex-shrink-0">
                        <img
                            src={section.icon_path ? `/storage/${section.icon_path}` : `/images/manuals/${section.id}.png`}
                            alt={title}
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            </Link>
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
                    {formatSectionTitle(section)} - {formatSectionTitle(subsection)}
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