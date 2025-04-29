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
    const [parentCards, setParentCards] = useState([]);
    const [guidesMap, setGuidesMap] = useState({});

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

            const allCards = cardsRes.data.data || [];

            const parentCardsArray = allCards.filter((c) => !c.subsection_id);
            const subsectionCards = allCards.filter((c) => c.subsection_id);

            const subsectionsByParent = {};
            subsectionCards.forEach((c) => {
                if (!subsectionsByParent[c.section_id]) {
                    subsectionsByParent[c.section_id] = [];
                }
                subsectionsByParent[c.section_id].push(c);
            });

            Object.keys(subsectionsByParent).forEach((sectionId) => {
                subsectionsByParent[sectionId].sort((a, b) =>
                    a.order !== undefined && b.order !== undefined
                        ? a.order - b.order
                        : a.id - b.id
                );
            });

            const sortedParentCards = parentCardsArray
                .map((p) => ({
                    ...p,
                    subsections: subsectionsByParent[p.section_id] || [],
                }))
                .sort((a, b) =>
                    a.order !== undefined && b.order !== undefined
                        ? a.order - b.order
                        : a.id - b.id
                );

            setParentCards(sortedParentCards);

            const guidesGrouped = {};
            (guidesRes.data.data || []).forEach((guide) => {
                if (guide.card_id) {
                    if (!guidesGrouped[guide.card_id]) {
                        guidesGrouped[guide.card_id] = [];
                    }
                    guidesGrouped[guide.card_id].push(guide);
                }
            });

            setGuidesMap(guidesGrouped);
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

    const CardSection = ({ card }) => {
        const guides = guidesMap[card.id] || [];
        const sectionId = card.section_id || `card-${card.id}`;
        const hasSubsections = card.subsections && card.subsections.length > 0;

        let cardLink = hasSubsections
            ? `/user-manual/${sectionId}`
            : guides.length > 0
            ? `/user-manual/guide/${guides[0].id}`
            : `/user-manual/${sectionId}`;

        return (
            <div className="bg-white rounded-xl shadow-md p-6 transition-transform cursor-pointer hover:translate-y-[-5px] hover:shadow-lg">
                <Link href={cardLink} className="block h-full">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">
                                {card.name}
                            </h3>
                            <p className="text-base font-medium">
                                {card.description}
                            </p>
                        </div>
                        
                        <div className="w-16 h-16 flex-shrink-0">
                            <img
                                src={`/images/manuals/${sectionId}.png`}
                                alt={card.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </Link>
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
                        <CardSection card={card} />
                    ))}
                </div>
            )}

            {/* Create User Guide Modal */}
            <CreateUserGuide
                isOpen={isCreateGuideOpen}
                onClose={() => {
                    setIsCreateGuideOpen(false);
                    fetchCards();

                    const url = new URL(window.location.href);
                    if (url.searchParams.has("openCreateGuide")) {
                        url.searchParams.delete("openCreateGuide");
                        url.searchParams.delete("sectionId");
                        url.searchParams.delete("subsectionId");
                        window.history.replaceState({}, "", url.toString());
                    }
                }}
                sectionId={
                    new URL(window.location.href).searchParams.get(
                        "sectionId"
                    ) || undefined
                }
                subsectionId={
                    new URL(window.location.href).searchParams.get(
                        "subsectionId"
                    ) || undefined
                }
            />
        </div>
    );
}
