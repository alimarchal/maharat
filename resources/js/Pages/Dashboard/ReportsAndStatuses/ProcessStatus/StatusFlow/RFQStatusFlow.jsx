import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faCalendarAlt,
    faCheck,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import UserInfoModal from "../UserInfoModal";

const RFQStatusFlow = () => {
    const { id } = usePage().props;

    const [statuses, setStatuses] = useState([]);
    const [cardData, setCardData] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState("");

    useEffect(() => {
        if (id) {
            fetchStatus(id);
        }
    }, [id]);

    const fetchStatus = async (id) => {
        try {
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=RFQ Approval"
            );

            if (processResponse.data?.data?.[0]?.steps?.[0]) {
                const process = processResponse.data.data[0];
                const processStep = process.steps;

                const sortedStatuses = processStep.sort(
                    (a, b) => a.order - b.order
                );
                setStatuses(sortedStatuses);
            }

            const response = await axios.get(
                `/api/v1/rfq-approval-transactions?filter[rfq_id]=${id}&include=rfq,requester,assignedTo,referredTo,creator,updater`
            );
            setCardData(response.data?.data);

            if (response.data?.data && response.data.data.length > 0) {
                setCurrentStep(response.data.data.length);
            }
        } catch (error) {
            console.error("Error fetching status:", error);
        }
    };

    const openModal = (user, type) => {
        setSelectedUser(user);
        setModalType(type);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    return (
        <div className="w-full overflow-hidden">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                RFQ Statuses for Regular Purchase Flow
            </h1>

            <div className="border border-dashed border-gray-300 rounded-3xl p-6 bg-white">
                <div className="p-4 border-b border-gray-300">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">
                            Request ID:{" "}
                            <span className="text-gray-600">RFQ-{id}</span>
                        </div>
                        <div className="text-gray-500 text-sm">
                            {statuses.length > 0 ? (
                                <>
                                    {new Date(
                                        statuses[0].created_at
                                    ).toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}{" "}
                                    <span className="text-xs text-gray-400">
                                        {new Date(
                                            statuses[0].created_at
                                        ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </span>
                                </>
                            ) : (
                                <span className="text-gray-500 text-sm">
                                    No Process Step found.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {statuses.length > 0 ? (
                    <>
                        <div className="p-4">
                            <h2 className="font-semibold text-xl text-gray-800">
                                RFQ Progress
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

                        {cardData.length > 0 ? (
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
                                            {cardData.map((card) => (
                                                <div
                                                    key={`card-container-${card.id}`}
                                                    className="flex-none w-full md:w-2/3 lg:w-1/2 xl:w-1/3 border-2 border-dashed border-gray-400 rounded-xl p-4 bg-white"
                                                    style={{
                                                        minWidth: "400px",
                                                        maxWidth: "500px",
                                                    }}
                                                >
                                                    <div className="flex flex-row gap-4">
                                                        <div className="w-1/2 rounded-xl p-6 bg-gray-100">
                                                            <div className="mb-4">
                                                                <button className="border border-[#22c55e] text-[#22c55e] rounded-full px-4 py-1 text-base flex items-center">
                                                                    Filled
                                                                    Request
                                                                </button>
                                                            </div>

                                                            <div className="flex justify-between items-center gap-4">
                                                                <span className="text-sm font-medium">
                                                                    {card
                                                                        .requester
                                                                        ?.designation
                                                                        ?.designation ||
                                                                        card.requester?.designation ||
                                                                        ""}
                                                                </span>
                                                                <span className="bg-[#22c55e] text-white text-sm w-6 h-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-green-600 transition-colors duration-200"
                                                                    onClick={() =>
                                                                        openModal(
                                                                            card.requester,
                                                                            "requester"
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
                                                                <div className="w-8 h-8 bg-blue-200 text-blue-600 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm">
                                                                        {
                                                                            card
                                                                                .requester
                                                                                .firstname[0]
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div className="ml-4">
                                                                    <div className="text-base font-medium">
                                                                        {
                                                                            card
                                                                                .requester
                                                                                .name
                                                                        }
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

                                                        <div className="w-1/2 rounded-xl p-6 bg-gray-100">
                                                            <div className="mb-4">
                                                                <button className="border border-[#22c55e] text-[#22c55e] rounded-full px-4 py-1 text-base flex items-center">
                                                                    {
                                                                        card.status
                                                                    }
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faChevronRight
                                                                        }
                                                                        className="ml-2 text-xs"
                                                                    />
                                                                </button>
                                                            </div>

                                                            <div className="flex justify-between items-center gap-4">
                                                                <span className="text-sm font-medium">
                                                                    {card
                                                                        .assigned_to_user
                                                                        ?.designation
                                                                        ?.designation ||
                                                                        card.assigned_to_user?.designation ||
                                                                        ""}
                                                                </span>
                                                                <span className="bg-[#22c55e] text-white text-sm w-6 h-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-green-600 transition-colors duration-200"
                                                                    onClick={() =>
                                                                        openModal(
                                                                            card.assigned_to_user,
                                                                            "assigned"
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
                                                                <div className="w-8 h-8 bg-purple-200 text-purple-600 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm">
                                                                        {
                                                                            card
                                                                                .assigned_to_user
                                                                                .firstname[0]
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-base font-medium">
                                                                        {
                                                                            card
                                                                                .assigned_to_user
                                                                                .name
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                faCalendarAlt
                                                                            }
                                                                            className="mr-1 text-gray-400"
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
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-base">
                                No RFQ Approval transactions available.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-4 text-center text-red-500 text-base">
                        No Process Step found.
                    </div>
                )}
            </div>

            {/* Modal Component */}
            <UserInfoModal
                isOpen={showModal}
                onClose={closeModal}
                user={selectedUser}
                type={modalType}
            />
        </div>
    );
};

export default RFQStatusFlow;
