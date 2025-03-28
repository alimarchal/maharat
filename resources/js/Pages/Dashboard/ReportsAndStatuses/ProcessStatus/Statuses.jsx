import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faCalendarAlt,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";

const Statuses = () => {
    const requestData = {
        requestId: "0123456",
        date: "03 Jan 2025",
        time: "10:35 PM",
        steps: [
            { id: 1, name: "Created Request", completed: true },
            { id: 2, name: "Verified Request", completed: true },
            { id: 3, name: "Approved Request", completed: true },
            { id: 4, name: "Complete Request", completed: true },
        ],
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Material Request Statuses for Regular Purchase Flow
            </h1>

            <div className="border border-dashed border-gray-300 rounded-3xl p-6 bg-white">
                <div className="p-4 border-b border-gray-300">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">
                            Request ID:{" "}
                            <span className="text-gray-600">
                                {requestData.requestId}
                            </span>
                        </div>
                        <div className="text-gray-500 text-sm">
                            {requestData.date}{" "}
                            <span className="text-xs text-gray-400">
                                {requestData.time}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <h2 className="font-medium text-gray-800">
                        Material Request Progress
                    </h2>

                    <div className="relative my-16">
                        <div className="grid grid-cols-4 mb-4">
                            {requestData.steps.map((step, index) => (
                                <div key={`name-${step.id}`}>
                                    <div className="font-bold text-sm">
                                        {step.name}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative grid grid-cols-4 h-10">
                            <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 z-0"></div>
                            <div className="absolute left-0 h-0.5 bg-green-500 top-1/2 z-0"></div>

                            {requestData.steps.map((step, index) => (
                                <div
                                    key={`circle-${step.id}`}
                                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                                        step.completed
                                            ? "bg-green-500"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    {step.completed && (
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className="text-white"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mb-6">
                    <div
                        className="grid grid-cols-2 gap-4"
                        style={{ maxWidth: "650px", width: "100%" }}
                    >
                        <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-white">
                            <div className="mb-6">
                                <button className="border border-green-400 text-green-500 rounded-full px-4 py-1 text-sm">
                                    Filled Request
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-600 text-sm">
                                    Informed to Manager
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    <span className="font-bold italic">i</span>
                                </span>
                            </div>

                            <div className="flex items-start">
                                <div className="mr-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                        <span className="text-gray-600 text-xs">
                                            K
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">
                                        Miss Khadija
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                        <FontAwesomeIcon
                                            icon={faCalendarAlt}
                                            className="mr-1 text-gray-400"
                                        />
                                        <span>Post: 6 Jan 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-white">
                            <div className="mb-6">
                                <button className="border border-green-400 text-green-500 rounded-full px-4 py-1 text-sm flex items-center">
                                    In-Progress Status
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="ml-1 text-xs"
                                    />
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-600 text-sm">
                                    Manager Concern
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    <span className="font-bold italic">i</span>
                                </span>
                            </div>

                            <div className="flex items-start">
                                <div className="mr-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                        <span className="text-gray-600 text-xs">
                                            A
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">
                                        Mr Alif
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                        <FontAwesomeIcon
                                            icon={faCalendarAlt}
                                            className="mr-1 text-gray-400"
                                        />
                                        <span>Post: 6 Jan 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statuses;
