import React, { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Play } from "lucide-react";
import axios from "axios";

export default function GuideDetail() {
    const { props } = usePage();
    const guideId = props.section;
    const subsectionId = props.subsection;

    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFromApi, setIsFromApi] = useState(false);

    // Determine which ID to use for filtering
    const searchId = subsectionId || guideId;

    useEffect(() => {
        const fetchGuideData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/v1/user-manuals?filter[title]=${searchId}`
                );
                if (
                    response.data &&
                    response.data.data &&
                    response.data.data.length > 0
                ) {
                    setGuide(response.data.data[0]);
                    setIsFromApi(true);
                } else {
                    // Only use fallback for certain IDs
                    const fallbackGuide = getFallbackGuide(searchId);
                    if (fallbackGuide) {
                        setGuide(fallbackGuide);
                        setIsFromApi(false);
                    } else {
                        // If no fallback exists for this ID, set error
                        setError("Guide not found");
                        setGuide(null);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching guide data:", err);
                setError("Failed to load guide content");

                // Only use fallback for certain IDs
                const fallbackGuide = getFallbackGuide(searchId);
                if (fallbackGuide) {
                    setGuide(fallbackGuide);
                    setIsFromApi(false);
                } else {
                    setGuide(null);
                }
                setLoading(false);
            }
        };

        fetchGuideData();
    }, [searchId]);

    // Get appropriate fallback content only for specified guides
    const getFallbackGuide = (id) => {
        // Only return fallback data for "task" and login-related guides
        if (id === "task-center" || id === "login-details") {
            return fallbackGuideContent[id];
        }
        return null;
    };

    // Fallback content in case API fails or no content is found
    const fallbackGuideContent = {
        "task-center": {
            title: "How to Create and Manage Tasks",
            video_path: null,
            video_url: "https://example.com/videos/task-tutorial.mp4",
            steps: [
                {
                    id: 1,
                    step_number: 1,
                    title: "Access the Task Management System",
                    description:
                        "1. Login to your account\n2. Navigate to the Task Management dashboard\n3. Click on 'Task Center' to view all tasks",
                    image_url: "/images/banner.png",
                    hyperLink: "/user-manual/task-management",
                },
                {
                    id: 2,
                    step_number: 2,
                    title: "Creating a New Task",
                    description:
                        "1. Click on the '+ New Task' button in the top right corner\n2. Fill in the required task details including title, description, and priority\n3. Assign the task to a team member if needed",
                    image_url: "/images/dashboard.png",
                    hyperLink: "/user-manual/task-creation",
                },
                {
                    id: 3,
                    step_number: 3,
                    title: "Setting Task Deadlines",
                    description:
                        "1. In the task creation form, locate the 'Deadline' field\n2. Click on the calendar icon to open the date picker\n3. Select the appropriate deadline date and time\n4. Optionally, set reminder notifications",
                    image_url: "/images/review-task.png",
                    hyperLink: "/user-manual/task-deadlines",
                },
                {
                    id: 4,
                    step_number: 4,
                    title: "Tracking Task Progress",
                    description:
                        "1. Go to 'My Tasks' or 'All Tasks' section\n2. Use filters to sort tasks by status, priority, or assignee\n3. Click on any task to view detailed progress and update history",
                    image_url: "/images/BoxPic.jpeg",
                    hyperLink: "/user-manual/task-tracking",
                },
                {
                    id: 5,
                    step_number: 5,
                    title: "Completing Tasks",
                    description:
                        "1. Open the task you want to mark as complete\n2. Update the status to 'Completed'\n3. Add any final notes or attachments if necessary\n4. Submit the update to notify all stakeholders",
                    image_url: "/images/dashboard.png",
                    hyperLink: "/user-manual/task-completion",
                },
            ],
        },
        "login-details": {
            title: "Login Details",
            video_url: "https://example.com/videos/login-tutorial.mp4",
            steps: [
                {
                    id: 1,
                    step_number: 1,
                    title: "Open the Maharat System",
                    description:
                        "1. Launch your preferred web browser\n2. Navigate to the Maharat system URL",
                    image_url: "/images/manuals/login-details.png",
                },
                {
                    id: 2,
                    step_number: 2,
                    title: "Enter Your Credentials",
                    description:
                        "1. Enter your username in the username field\n2. Enter your password in the password field\n3. Click the 'Login' button",
                    image_url: "/images/banner.png",
                },
                {
                    id: 3,
                    step_number: 3,
                    title: "Navigate the Dashboard",
                    description:
                        "1. Once logged in, you'll see the main dashboard\n2. Explore the various menu options available to you based on your role",
                    image_url: "/images/manuals/login-details.png",
                },
            ],
        },
    };

    const formatContent = (content) => {
        if (!content) return null;

        // Process the content by splitting on newlines
        return content.split("\n").map((line, idx) => (
            <p key={idx} className="text-lg font-medium mb-2">
                {line.trim()}
            </p>
        ));
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Show the "Guide Not Found" message only when guide is null and there was an error
    if (error || !guide) {
        return (
            <div className="w-full flex justify-center items-center h-64">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Guide Coming Soon
                    </h2>
                    <p className="text-gray-600">
                        We're currently preparing this guide to better assist
                        you. Please check back shortly for updates.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-center items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    {guide.title}
                </h1>
            </div>

            <div className="relative">
                {guide.steps && guide.steps.length > 0 && (
                    <div className="absolute left-6 top-10 bottom-20 w-0.5 bg-[#93D3EC]"></div>
                )}

                <div className="space-y-12">
                    {guide.steps &&
                        guide.steps.map((step, index) => (
                            <div key={step.id || index} className="flex">
                                <div className="relative z-0">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#93D3EC] text-lg font-medium">
                                        {step.step_number}
                                    </div>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-xl font-bold mb-2 text-gray-800">
                                        {step.title}
                                    </h3>
                                    <div className="mb-4">
                                        {formatContent(step.description)}
                                    </div>

                                    {(step.image_url || step.image_path) && (
                                        <div className="p-2">
                                            <div className="h-48 border border-[#009FDC] rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                                                <img
                                                    src={
                                                        step.image_url ||
                                                        step.image_path
                                                    }
                                                    alt={`Step ${step.step_number} illustration`}
                                                    className="w-full h-full object-cover rounded-2xl"
                                                />
                                            </div>
                                            {step.hyperLink && (
                                                <div className="flex justify-center">
                                                    <a
                                                        href={step.hyperLink}
                                                        className="text-[#009FDC] text-2xl font-bold flex items-center hover:underline"
                                                    >
                                                        View detailed
                                                        instructions
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>

                {/* Video Section (if available) */}
                {(guide.video_url || guide.video_path) && (
                    <div className="flex flex-col items-center justify-center p-6 border border-[#009FDC] rounded-2xl my-12 mx-auto max-w-4xl">
                        <div className="h-64 flex items-center justify-center mb-4">
                            <div className="bg-[#009FDC] rounded-full p-4 cursor-pointer hover:bg-blue-600 transition duration-200">
                                <Play size={32} className="text-white" />
                            </div>
                        </div>
                        <a
                            href={guide.video_url || guide.video_path}
                            className="text-[#009FDC] text-sm mt-2 flex items-center hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open video tutorial in new window
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
