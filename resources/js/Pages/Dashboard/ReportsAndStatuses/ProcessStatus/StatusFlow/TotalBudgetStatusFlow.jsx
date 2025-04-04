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

const TotalBudgetStatusFlow = () => {
    const { id } = usePage().props;

    const [statuses, setStatuses] = useState([]);
    const [cardData, setCardData] = useState([]);

    useEffect(() => {
        if (id) {
            fetchStatus(id);
        }
    }, [id]);

    const fetchStatus = async (id) => {
        try {
            const processResponse = await axios.get(
                "/api/v1/processes?include=steps,creator,updater&filter[title]=Total Budget Approval"
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
                `/api/v1/budget-approval-transactions?filter[budget_id]=${id}&include=budget,requester,assignedUser,referredUser,createdByUser,updatedByUser`
            );
            setCardData(response.data?.data);
        } catch (error) {
            console.error("Error fetching status:", error);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Total Budget Statuses for Regular Purchase Flow
            </h1>

            <div className="border border-dashed border-gray-300 rounded-3xl p-6 bg-white">
                <div className="p-4 border-b border-gray-300">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">
                            Request ID:{" "}
                            <span className="text-gray-600">{id}</span>
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
                                Total Budget Progress
                            </h2>

                            <div className="relative my-16">
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
                                            width: `${
                                                (statuses.length - 1) *
                                                (100 / statuses.length)
                                            }%`,
                                        }}
                                    ></div>

                                    {statuses.map((status) => (
                                        <div
                                            key={`circle-${status.id}`}
                                            className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-green-500"
                                        >
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="text-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {cardData.length > 0 ? (
                            <div className="mb-6">
                                <div
                                    className={`${
                                        cardData.length > 3
                                            ? "overflow-x-auto pb-4"
                                            : ""
                                    }`}
                                >
                                    <div
                                        className={`grid ${
                                            cardData.length > 3
                                                ? "grid-flow-col auto-cols-max gap-4"
                                                : "grid-cols-3 gap-4"
                                        }`}
                                        style={
                                            cardData.length > 3
                                                ? {
                                                      width: `${
                                                          cardData.length * 600
                                                      }px`,
                                                  }
                                                : {}
                                        }
                                    >
                                        {cardData.map((card) => (
                                            <div
                                                key={`card-container-${card.id}`}
                                                className="border-2 border-dashed border-gray-400 rounded-xl p-4 bg-white flex flex-row gap-4"
                                                style={
                                                    cardData.length > 3
                                                        ? { width: "580px" }
                                                        : {}
                                                }
                                            >
                                                <div
                                                    key={`card-requester-${card.id}`}
                                                    className="w-full rounded-xl p-6 bg-gray-100"
                                                >
                                                    <div className="mb-4">
                                                        <button className="border border-[#22c55e] text-[#22c55e] rounded-full px-4 py-1 text-base flex items-center">
                                                            Filled Request
                                                        </button>
                                                    </div>

                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-sm font-medium">
                                                            User
                                                        </span>
                                                        <span className="bg-[#22c55e] text-white text-sm w-6 h-6 flex items-center justify-center rounded-full">
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
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
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

                                                <div
                                                    key={`card-manager-${card.id}`}
                                                    className="w-full rounded-xl p-6 bg-gray-100"
                                                >
                                                    <div className="mb-4">
                                                        <button className="border border-[#22c55e] text-[#22c55e] rounded-full px-4 py-1 text-base flex items-center">
                                                            {card.status}
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
                                                            Direct Manager
                                                        </span>
                                                        <span className="bg-[#22c55e] text-white text-sm w-6 h-6 flex items-center justify-center rounded-full">
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
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                            <span className="text-sm">
                                                                {
                                                                    card
                                                                        .assigned_user
                                                                        .firstname[0]
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-base font-medium">
                                                                {
                                                                    card
                                                                        .assigned_user
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
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-base">
                                No Total Budget Approval transactions available.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-4 text-center text-red-500 text-base">
                        No Process Step found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TotalBudgetStatusFlow;
