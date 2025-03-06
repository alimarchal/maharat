import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Users = () => {
    return (
        <AuthenticatedLayout>
            <Head title="Users" />
            <div className="min-h-screen p-6">
                {/* Back Button and Breadcrumbs */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/dashboard")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl">User Management</span>
                </div>

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-[#2C323C]">User Management</h1>
                    <div className="flex space-x-4">
                        <button className="border-2 border-[#009FDC] text-[#009FDC] bg-white px-4 py-2 rounded-full text-xl font-medium">
                            <FontAwesomeIcon icon={faFileCsv} />
                            <span> Download CSV Template </span>
                        </button>
                        <button className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium">
                            <FontAwesomeIcon icon={faFileCsv} />
                            <span> Upload CSV File </span>
                        </button>
                    </div>
                </div>

                <p className="text-[#7D8086] text-xl mb-6">
                    Manage users and their account permissions here.
                </p>

                <div className="flex items-center w-full gap-4 mb-6">
                    <h2 className="text-2xl font-medium text-[#6E66AC] whitespace-nowrap">
                        Add a User
                    </h2>
                    <div
                        className="h-[3px] flex-grow"
                        style={{
                            background: "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                        }}
                    ></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {[
                        { label: "ID", type: "text", name: "id" },
                        { label: "Username", type: "text", name: "username" },
                        { label: "First Name", type: "text", name: "firstName" },
                        { label: "Last Name", type: "text", name: "lastName" },
                        { label: "Email", type: "email", name: "email" },
                        { label: "Extension Number", type: "text", name: "extensionNumber" },
                        { label: "Mobile Number", type: "text", name: "mobileNumber" },
                        { label: "Department", type: "text", name: "department" },
                        { label: "Language", type: "text", name: "language" },
                        { label: "Employee Type", type: "text", name: "employeeType" },
                    ].map((field, index) => (
                        <div key={index}>
                            <div className="relative">
                                <input
                                    type={field.type}
                                    name={field.name}
                                    className="peer block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg 
                                              focus:ring-[#009FDC] focus:border-[#009FDC] placeholder-gray-400 mb-4"
                                />
                                <label
                                    htmlFor={field.name}
                                    className="absolute transition-all text-base top-1/2 transform -translate-y-1/2 left-5 text-gray-400 font-normal peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:top-[-1.2rem] peer-focus:left-1 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:font-bold"
                                >
                                    {field.label}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <textarea
                            className="peer block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg 
                                      focus:ring-[#009FDC] focus:border-[#009FDC] placeholder-gray-400"
                            rows="3"
                        ></textarea>
                       <label
                            className="absolute transition-all text-base top-1/2 transform -translate-y-1/2 left-5 text-gray-400 font-normal peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:top-[-1.2rem] peer-focus:left-1 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:font-bold"
                        >
                            Description
                        </label>
                    </div>
                </div>

                <div className="flex items-center mb-6">
                    <input
                        type="checkbox"
                        className="h-6 w-6 text-[#009FDC] focus:ring-[#009FDC] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-lg text-gray-900">Enable OTP</label>
                </div>

                <div className="flex justify-end gap-4">
                    <button className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium">
                        Cancel
                    </button>
                    <button className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium">
                        Save
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Users;