import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faChevronRight,
    faCalendarAlt,
    faCheck,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import UserInfoModal from "../ReportsAndStatuses/ProcessStatus/UserInfoModal";

const ViewCardModal = ({ isOpen, onClose, request }) => {
    const [statuses, setStatuses] = useState([]);
    const [cardData, setCardData] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && request?.id) {
            fetchStatus(request.id);
        }
    }, [isOpen, request?.id]);

    const fetchStatus = async (id) => {
        setLoading(true);
        try {
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Material Request"
            );

            if (processResponse.data?.data?.[0]?.steps?.[0]) {
                const process = processResponse.data.data[0];
                const processStep = process.steps;

                const sortedStatuses = processStep.sort(
                    (a, b) => a.order - b.order
                );
                
                // Add requester step at the beginning
                const requesterStep = {
                    id: 'requester',
                    description: 'Requester',
                    order: 0
                };
                
                setStatuses([requesterStep, ...sortedStatuses]);
            }

            const response = await axios.get(
                `/api/v1/material-request-transactions?filter[material_request_id]=${id}&include=materialRequest,requester,assignedUser,referredUser`
            );
            setCardData(response.data?.data);

            if (response.data?.data && response.data.data.length > 0) {
                setCurrentStep(1 + response.data.data.length);
            }
        } catch (error) {
            console.error("Error fetching status:", error);
        } finally {
            setLoading(false);
        }
    };

    const openUserModal = (user, type) => {
        setSelectedUser(user);
        setModalType(type);
        setShowModal(true);
    };

    const closeUserModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    // Create cards array - show requester + all assigned users
    const createCardsArray = () => {
        if (cardData.length === 0) return [];
        const cards = [];

        // First card - Always show the requester from the first record
        if (cardData[0]) {
            cards.push({
                id: `requester-${cardData[0].id}`,
                type: "requester",
                user: cardData[0].requester,
                status: "Filled Request",
                created_at: cardData[0].created_at,
                cardData: cardData[0],
            });
        }

        // Then show all assigned users from all records
        cardData.forEach((card, index) => {
            cards.push({
                id: `assigned-${card.id}`,
                type: "assigned",
                user: card.assigned_user,
                status: card.status,
                created_at: card.created_at,
                cardData: card,
            });
        });

        return cards;
    };

    const cardsToShow = createCardsArray();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[110]">
            <div className="bg-white p-8 rounded-2xl w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-2xl font-bold text-[#2C323C]">
                        Material Request Status Flow
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800 text-xl"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="w-full overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-16 h-16 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="border border-dashed border-gray-300 rounded-3xl p-6 bg-white shadow-sm">
                            <div className="p-4 border-b border-gray-300">
                                <div className="flex justify-between items-center">
                                    <div className="font-medium">
                                        Request ID:{" "}
                                        <span className="text-gray-600">MR-{request?.id}</span>
                                    </div>
                                </div>
                            </div>

                            {statuses.length > 0 ? (
                                <>
                                    <div className="p-4">
                                        <h2 className="font-semibold text-xl text-gray-800">
                                            Material Request Progress
                                        </h2>

                                        <div className="my-16">
                                            <div
                                                className="grid gap-8 mb-4"
                                                style={{
                                                    gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))`,
                                                }}
                                            >
                                                {statuses.map((status) => (
                                                    <div key={`name-${status.id}`}>
                                                        <div className="font-semibold text-sm">
                                                            {status.description}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div
                                                className="relative grid gap-4 h-10"
                                                style={{
                                                    gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))`,
                                                }}
                                            >
                                                <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 z-0"></div>
                                                <div
                                                    className="absolute left-0 h-0.5 bg-green-500 top-1/2 z-0"
                                                    style={{
                                                        width:
                                                            currentStep > 0
                                                                ? `${
                                                                      ((currentStep - 1) /
                                                                          (statuses.length -
                                                                              1)) *
                                                                      100
                                                                  }%`
                                                                : "0%",
                                                    }}
                                                ></div>

                                                {statuses.map((status, index) => (
                                                    <div
                                                        key={`circle-${status.id}`}
                                                        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                                                            index < currentStep
                                                                ? "bg-green-500"
                                                                : "bg-gray-300"
                                                        }`}
                                                    >
                                                        {index < currentStep ? (
                                                            <FontAwesomeIcon
                                                                icon={faCheck}
                                                                className="text-white"
                                                            />
                                                        ) : (
                                                            <span className="text-white font-medium">
                                                                {index + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {cardsToShow.length > 0 ? (
                                        <div className="w-full pb-4 mb-6">
                                            <div className="relative w-full">
                                                <div
                                                    className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                                                    style={{
                                                        scrollbarWidth: "thin",
                                                        WebkitOverflowScrolling: "touch",
                                                    }}
                                                >
                                                    <div className="flex space-x-4 pb-4">
                                                        {cardsToShow.map((card) => (
                                                            <div
                                                                key={`card-container-${card.id}`}
                                                                className="flex-none w-full md:w-2/3 lg:w-1/2 xl:w-1/6 border-2 border-dashed border-gray-400 rounded-xl p-4 bg-white shadow-md"
                                                                style={{
                                                                    minWidth: "400px",
                                                                    maxWidth: "500px",
                                                                }}
                                                            >
                                                                <div className="rounded-xl p-5 bg-gray-100 shadow-sm">
                                                                    <div className="mb-4">
                                                                        <button className="border border-[#22c55e] text-[#22c55e] rounded-full px-4 py-1 text-base flex items-center">
                                                                            {card.status}
                                                                            {card.type !==
                                                                                "requester" && (
                                                                                <FontAwesomeIcon
                                                                                    icon={
                                                                                        faChevronRight
                                                                                    }
                                                                                    className="ml-2 text-xs"
                                                                                />
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex justify-between items-center gap-4">
                                                                        <span className="text-sm font-medium">
                                                                            {card.user
                                                                                ?.designation
                                                                                ?.designation ||
                                                                                card.user
                                                                                    ?.designation ||
                                                                                ""}
                                                                        </span>
                                                                        <span
                                                                            className="bg-[#22c55e] text-white text-sm w-6 h-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-green-600 transition-colors duration-200"
                                                                            onClick={() =>
                                                                                openUserModal(
                                                                                    card.user,
                                                                                    card.type
                                                                                )
                                                                            }
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faInfoCircle
                                                                                }
                                                                                className="text-white"
                                                                            />
                                                                        </span>
                                                                    </div>

                                                                    <div className="h-px bg-gray-300 w-full my-4"></div>

                                                                    <div className="flex items-start">
                                                                        <div
                                                                            className={`w-10 h-10 ${
                                                                                card.type ===
                                                                                "requester"
                                                                                    ? "bg-blue-200 text-blue-600"
                                                                                    : "bg-purple-200 text-purple-600"
                                                                            } rounded-full flex items-center justify-center`}
                                                                        >
                                                                            <span className="text-sm font-medium">
                                                                                {card.user
                                                                                    ?.firstname?.[0] ||
                                                                                    card
                                                                                        .user
                                                                                        ?.name?.[0] ||
                                                                                    "?"}
                                                                            </span>
                                                                        </div>

                                                                        <div className="ml-4">
                                                                            <div
                                                                                className="text-base font-medium cursor-pointer"
                                                                                onClick={() =>
                                                                                    openUserModal(
                                                                                        card.user,
                                                                                        card.type
                                                                                    )
                                                                                }
                                                                            >
                                                                                {card.user
                                                                                    ?.name ||
                                                                                    "Unknown User"}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                                                <FontAwesomeIcon
                                                                                    icon={
                                                                                        faCalendarAlt
                                                                                    }
                                                                                    className="mr-1 text-gray-500"
                                                                                />
                                                                                <span>
                                                                                    Post:{" "}
                                                                                    {new Date(
                                                                                        card.created_at
                                                                                    ).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-base">
                                            No Material Request transactions available.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-4 text-center text-red-500 text-base">
                                    No Process Step found.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Info Modal */}
                <UserInfoModal
                    isOpen={showModal}
                    onClose={closeUserModal}
                    user={selectedUser}
                    type={modalType}
                />
            </div>
        </div>
    );
};

export default ViewCardModal;
