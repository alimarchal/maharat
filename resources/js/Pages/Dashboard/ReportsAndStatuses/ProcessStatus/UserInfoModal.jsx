import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faEnvelope,
    faPhone,
    faIdCard,
    faBuilding,
    faBriefcase,
} from "@fortawesome/free-solid-svg-icons";

const UserInfoModal = ({ isOpen, onClose, user, type }) => {
    if (!isOpen || !user) return null;

    const getColorByType = () => {
        return type === "requester" ? "blue" : "purple";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-[#C7E7DE] text-[#2C323C] p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold">
                                User Information
                            </h3>
                            <p className="text-sm opacity-80 mt-1">
                                Details about the respective user
                            </p>
                        </div>
                        <button onClick={onClose}>
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-lg"
                            />
                        </button>
                    </div>
                </div>

                {/* User profile */}
                <div className="p-6 pt-5">
                    <div className="flex items-center mb-6">
                        <div
                            className={`w-16 h-16 bg-${getColorByType()}-100 text-${getColorByType()}-600 rounded-full flex items-center justify-center mr-4 shadow-sm`}
                        >
                            <span className="text-xl font-bold">
                                {user.firstname[0]}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">
                                {user.name}
                            </h4>
                            <p
                                className={`text-${getColorByType()}-600 font-medium`}
                            >
                                {user.designation?.designation ||
                                    "Unknown Position"}
                            </p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <div
                                className={`w-10 h-10 bg-${getColorByType()}-100 text-${getColorByType()}-600 rounded-lg flex items-center justify-center mr-4`}
                            >
                                <FontAwesomeIcon icon={faIdCard} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Employee ID
                                </p>
                                <p className="font-medium">
                                    {user.employee_id}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div
                                className={`w-10 h-10 bg-${getColorByType()}-100 text-${getColorByType()}-600 rounded-lg flex items-center justify-center mr-4`}
                            >
                                <FontAwesomeIcon icon={faBuilding} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Department
                                </p>
                                <p className="font-medium">{user.department}</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div
                                className={`w-10 h-10 bg-${getColorByType()}-100 text-${getColorByType()}-600 rounded-lg flex items-center justify-center mr-4`}
                            >
                                <FontAwesomeIcon icon={faEnvelope} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium break-all">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div
                                className={`w-10 h-10 bg-${getColorByType()}-100 text-${getColorByType()}-600 rounded-lg flex items-center justify-center mr-4`}
                            >
                                <FontAwesomeIcon icon={faPhone} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{user.mobile}</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div
                                className={`w-10 h-10 bg-${getColorByType()}-100 text-${getColorByType()}-600 rounded-lg flex items-center justify-center mr-4`}
                            >
                                <FontAwesomeIcon icon={faBriefcase} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Employment Type
                                </p>
                                <p className="font-medium capitalize">
                                    {user.employee_type}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfoModal;
