import React from "react";
import { usePage } from "@inertiajs/react";
import { Play } from "lucide-react";

export default function GuideDetail() {
    const { section } = usePage().props;

    const tasks = [
        {
            number: 1,
            title: "To create a material request in the Material system, follow these steps:",
            content: `"1. Login"
                          "2. Open the Material Procurement and Inventory Management System"
                          "3. Enter your credentials (e.g., Zadeem Portal) and login."`,
            imageUrl: "/images/manuals/request.png",
            hyperLink: "/user-manual/request",
        },
        {
            number: 2,
            title: "Navigate to Tasks",
            content:
                "1. On the dashboard, click on Task Center to view assigned tasks.",
            imageUrl: "/images/manuals/request.png",
            hyperLink: "/user-manual/request",
        },
        {
            number: 3,
            title: "Locate the Material Request",
            content: `"1. In the My Tasks section, find the new material request."
                          "2. Click on the eye icon under Actions to review the request details."`,
            imageUrl: "/images/manuals/request.png",
            hyperLink: "/user-manual/request",
        },
        {
            number: 4,
            title: "Review the Request Details",
            content: `"1. Examine all provided information, including urgency, description, and requested items."`,
            imageUrl: "/images/manuals/request.png",
            hyperLink: "/user-manual/request",
        },
        {
            number: 5,
            title: "Approve, Reject or Refer",
            content: `"1. Fill the required fields."
                          "2. Select value from dropdown"`,
            imageUrl: "/images/manuals/request.png",
            hyperLink: "/user-manual/request",
        },
        {
            number: 6,
            title: "Confirm Action",
            content: `"1. Click on the respective button to finalize your decision."`,
            imageUrl: "/images/manuals/request.png",
            hyperLink: "/user-manual/request",
        },
        { video: "video link" },
    ];

    const formatContent = (content) => {
        if (!content) return null;
        const lines = content.match(/"(.*?)"/g);
        return lines?.map((line, idx) => (
            <p key={idx} className="text-lg font-medium mb-2">
                {line.replace(/"/g, "").trim()}
            </p>
        ));
    };

    return (
        <div className="w-full">
            <div className="flex justify-center items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    How to create a material request for warehouses
                </h1>
            </div>

            <div className="relative">
                <div className="absolute left-6 top-10 bottom-20 w-0.5 bg-[#93D3EC]"></div>

                <div className="space-y-12"></div>
                {tasks.map((step, index) => {
                    // Render video step separately (no stepper)
                    if (step.video) {
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center justify-center p-6 border border-[#009FDC] rounded-2xl my-12 mx-auto max-w-4xl"
                            >
                                <div className="h-64 flex items-center justify-center mb-4">
                                    <div className="bg-[#009FDC] rounded-full p-4 cursor-pointer hover:bg-blue-600 transition duration-200">
                                        <Play
                                            size={32}
                                            className="text-white"
                                        />
                                    </div>
                                </div>
                                <a
                                    href={step.video}
                                    className="text-[#009FDC] text-sm mt-2 flex items-center hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open in new window
                                </a>
                            </div>
                        );
                    }

                    // Render regular steps with stepper
                    return (
                        <div key={index} className="flex">
                            <div className="relative z-10">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#93D3EC] text-lg font-medium">
                                    {step.number}
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-xl font-bold mb-2 text-gray-800">
                                    {step.title}
                                </h3>
                                <div className="mb-4">
                                    {formatContent(step.content)}
                                </div>

                                {step.imageUrl && (
                                    <div className="p-2">
                                        <div className="h-48 border border-[#009FDC] rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                                            <img
                                                src="/api/placeholder/600/300"
                                                alt={`Step ${step.number} illustration`}
                                                className="w-full h-full object-cover rounded-2xl"
                                            />
                                        </div>
                                        {step.hyperLink && (
                                            <div className="flex justify-center">
                                                <a
                                                    href={step.hyperLink}
                                                    className="text-[#009FDC] text-2xl font-bold flex items-center hover:underline"
                                                >
                                                    View detailed instructions
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
