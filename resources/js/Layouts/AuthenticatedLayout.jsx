import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { faSearch, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FaUserCircle, FaMale, FaFemale } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Sidebar from "@/Components/Sidebar";
import { RequestItemsProvider } from "@/Components/RequestItemsContext";

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        const currentHour = new Date().getHours();

        if (currentHour >= 0 && currentHour < 12) {
            setGreeting("Good Morning");
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreeting("Good Afternoon");
        } else {
            setGreeting("Good Evening");
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <RequestItemsProvider>
            <div className="min-h-screen flex flex-col bg-[#C4E4F0] bg-opacity-20">
                <header
                    className={`flex justify-between items-center px-6 py-4 w-full fixed top-0 left-0 right-0 z-[100] transition-all ${
                        isScrolled ? "bg-white shadow-md" : "bg-transparent"
                    }`}
                >
                    <div className="flex items-center gap-4 lg:gap-12">
                        <button
                            className="lg:hidden text-gray-600 focus:outline-none"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <FontAwesomeIcon icon={faBars} size="lg" />
                        </button>

                        <Link href="/">
                            <ApplicationLogo className="block h-10 w-auto fill-current" />
                        </Link>

                        <div>
                            <h1 className="text-xl lg:text-2xl font-medium text-[#2C323C]">
                                Hi {user.name}!
                            </h1>
                            <p className="text-sm lg:text-base text-[#7D8086]">
                                {greeting}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="relative hidden md:flex w-40 lg:w-72">
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-4 top-3 text-[#B9BBBD]"
                            />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-10 py-2 w-full bg-white rounded-full border border-[#B9BBBD] focus:outline-none"
                            />
                        </div>

                        <Link href="/user-profile" className="cursor-pointer">
                            {user.profile_photo_path ? (
                                <img
                                    src={`/storage/${user.profile_photo_path}`}
                                    alt="Profile"
                                    className="h-10 w-10 lg:h-12 lg:w-12 rounded-full object-cover border border-gray-300 shadow-sm"
                                />
                            ) : user.gender === "Male" ? (
                                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-blue-100 flex items-center justify-center border border-blue-400 shadow-sm">
                                    <FaMale className="text-blue-400 text-xl lg:text-2xl" />
                                </div>
                            ) : user.gender === "Female" ? (
                                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-pink-100 flex items-center justify-center border border-pink-400 shadow-sm">
                                    <FaFemale className="text-pink-400 text-xl lg:text-2xl" />
                                </div>
                            ) : (
                                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-400 shadow-sm">
                                    <FaUserCircle className="text-gray-400 text-xl lg:text-2xl" />
                                </div>
                            )}
                        </Link>
                    </div>
                </header>

                <div className="flex flex-1 pt-20">
                    <div
                        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden ${
                            isSidebarOpen
                                ? "opacity-100 visible"
                                : "opacity-0 invisible"
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>

                    <div
                        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
                            isSidebarOpen
                                ? "translate-x-0"
                                : "-translate-x-full"
                        }`}
                    >
                        <div className="pt-20">
                            <Sidebar />
                        </div>

                        <button
                            className="absolute top-4 right-4 text-gray-600"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>

                    <div className="hidden lg:block lg:relative">
                        <Sidebar />
                    </div>

                    <main className="flex-1 lg:ml-36 transition-all">
                        {header && (
                            <header className="p-6 mb-4">{header}</header>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </RequestItemsProvider>
    );
}
