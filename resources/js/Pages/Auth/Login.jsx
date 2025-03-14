import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "react-feather";
import { Link, router } from "@inertiajs/react";
import InputFloating from "../../Components/InputFloating";

const LoginPage = () => {
    const [activeBoxes, setActiveBoxes] = useState([0, 1, 2, 3, 4, 5]);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [password, setPassword] = useState("");
    const [isFocused1, setIsFocused1] = useState(false);
    const [errors, setErrors] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBoxes((prevBoxes) => {
                const newBoxes = [...prevBoxes];
                newBoxes[0] = prevBoxes[1];
                newBoxes[1] = prevBoxes[3];
                newBoxes[2] = prevBoxes[0];
                newBoxes[3] = prevBoxes[5];
                newBoxes[4] = prevBoxes[2];
                newBoxes[5] = prevBoxes[4];
                return newBoxes;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const fixedBoxes = Array.from({ length: 6 }, () => ({
        text: "",
        bgColor: "rgba(255, 255, 255, 0.3)", // White shade with transparency
        isEmpty: true,
    }));

    // Rotating boxes content
    const rotatingBoxes = [
        {
            text: "Trustable purchase and inventory management system.",
            bgColor: "#C7E7DE",
            isEmpty: false,
            textColor: "text-black",
        },

        {
            text: "",
            bgColor: "transparent",
            isEmpty: true,
            opacity: 5,
        },

        {
            text: "",
            imgSrc: "/images/MCTC Logo.png",
            bgColor: "white",
            isEmpty: false,
        },

        {
            text: "Build your skilled workforce with the leader in construction training",
            bgColor: "#C7E7DE",
            isEmpty: false,
            textColor: "text-black",
        },

        {
            text: "",
            bgColor: "transparent",
            isEmpty: true,
        },

        {
            text: "Skilling innovatively",
            bgColor: "white",
            isEmpty: false,
            textColor: "text-black",
        },
    ];

    const getBoxPosition = (index) => {
        const positions = [
            { top: "0%", left: "8%" }, // Top Left
            { top: "0%", left: "53%" }, // Top Right
            { top: "34%", left: "8%" }, // Middle Left
            { top: "34%", left: "53%" }, // Middle Right
            { top: "68%", left: "8%" }, // Bottom Left
            { top: "68%", left: "53%" }, // Bottom Right
        ];
        return positions[index];
    };

    const validateForm = () => {
        let errors = {};
        if (!email) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Invalid email format";
        }
        if (!password) {
            errors.password = "Password is required";
        }
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        router.post(
            "/login",
            { email, password },
            {
                onSuccess: () => router.visit("/dashboard"),
                onError: (errors) => {
                    console.log("Login Errors:", errors);

                    if (errors.failed) {
                        setErrors(errors.failed); // "These credentials do not match our records."
                    } else if (errors.password) {
                        setErrors(errors.password); // "The provided password is incorrect."
                    } else if (errors.throttle) {
                        setErrors(errors.throttle); // "Too many login attempts. Please try again in X seconds."
                    } else if (errors.email) {
                        setErrors(errors.email); // "Invalid email format"
                    } else {
                        setErrors(
                            "Invalid email or password. Please try again."
                        );
                    }
                },
            }
        );
    };

    return (
        <div className="w-full bg-[#F5FAFF]">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side with Rotating Boxes */}
                <div
                    className="w-full h-[40vh] lg:h-[calc(100vh-40px)] lg:flex-1 p-8 bg-cover bg-center rounded-3xl relative my-5 mx-0 lg:mx-5"
                    style={{
                        backgroundImage: 'url("/images/BoxPic.jpeg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#005372",
                            mixBlendMode: "multiply",
                            opacity: 0.45,
                            borderRadius: "1.5rem",
                            zIndex: 0,
                        }}
                    />

                    <div className="relative w-full h-full flex justify-center items-center">
                        {/* Fixed transparent background boxes */}
                        {fixedBoxes.map((box, index) => (
                            <div
                                key={`fixed-${index}`}
                                className={`absolute flex justify-center items-center p-1 md:p-6 rounded-2xl backdrop-blur-sm
                                  ${getBoxPosition(index)}`}
                                style={{
                                    backgroundColor: box.bgColor,
                                    opacity: 1,
                                    width: "40%", // Increased width by 2% (now 40%)
                                    height: "31%", // Increased height by 2% (now 31%)
                                    top: getBoxPosition(
                                        activeBoxes.indexOf(index)
                                    ).top,
                                    left: getBoxPosition(
                                        activeBoxes.indexOf(index)
                                    ).left,
                                }}
                            >
                                <p
                                    className={`text-sm text-center ${
                                        box.textColor || "text-white"
                                    }`}
                                >
                                    {box.text}
                                </p>
                            </div>
                        ))}

                        {/* Rotating boxes with content */}
                        {rotatingBoxes.map((box, index) =>
                            box.bgColor !== "transparent" ? (
                                <div
                                    key={`rotating-${index}`}
                                    className={`absolute flex justify-center items-center p-1 md:p-6 rounded-2xl backdrop-blur-sm transition-all duration-[3000ms] ease-in-out
                    ${getBoxPosition(activeBoxes.indexOf(index))}`}
                                    style={{
                                        backgroundColor: box.bgColor,
                                        opacity: 1,
                                        width: "40%", // Increased width by 2% (now 40%)
                                        height: "31%", // Increased height by 2% (now 31%)
                                        top: getBoxPosition(
                                            activeBoxes.indexOf(index)
                                        ).top,
                                        left: getBoxPosition(
                                            activeBoxes.indexOf(index)
                                        ).left,
                                    }}
                                >
                                    <div className="flex flex-col justify-center items-center">
                                        {box.imgSrc && (
                                            <img
                                                src={box.imgSrc}
                                                alt={`Box ${index + 1}`}
                                                className="w-[50%] h-[50%] object-contain mb-2" // Adjusted image size to fit
                                            />
                                        )}
                                        {box.text && !box.isEmpty && (
                                            <p
                                                className={`text-sm text-center ${
                                                    box.textColor ||
                                                    "text-white"
                                                }`}
                                            >
                                                {box.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null
                        )}
                    </div>
                </div>

                {/* Right Side with Login Form */}
                <div className="w-full h-[60vh] lg:h-[calc(100vh-40px)] lg:flex-1 p-0 md:p-8 relative rounded-none my-5 mx-0">
                    <div
                        className="absolute top-0 left-0 right-0 bottom-0 bg-center bg-no-repeat"
                        style={{
                            backgroundImage: 'url("/images/favicon.png")',
                            opacity: 0.1,
                            pointerEvents: "none",
                            backgroundSize: "90%",
                        }}
                    >
                        <style>
                            {`
                              @media (min-width: 640px) { 
                                div[style] { background-size: 60% !important; }
                              }
                              @media (min-width: 1024px) {
                                div[style] { background-size: 80% !important; }
                              }
                            `}
                        </style>
                    </div>

                    <div className="flex justify-center lg:items-center h-full bg-transparent">
                        <div className="w-11/12 md:w-4/5 lg:w-3/5 bg-transparent">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Login
                            </h1>
                            <p className="text-gray-700 mb-8">
                                Enter your credentials below to access our
                                reliable and seamless inventory management and
                                control system.
                            </p>

                            <form className="flex flex-col text-center space-y-4 md:space-y-6">
                                <div>
                                    <InputFloating
                                        label="Email"
                                        name="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-sm">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="relative">
                                    <InputFloating
                                        label="Password"
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? (
                                            <Eye size={20} />
                                        ) : (
                                            <EyeOff size={20} />
                                        )}
                                    </button>
                                    {errors.password && (
                                        <p className="text-red-500 text-sm">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        type="submit"
                                        onClick={handleSubmit}
                                        className="w-full py-3 px-4 text-white font-medium rounded-full transition duration-150"
                                        style={{
                                            backgroundColor: "#009FDC",
                                            opacity: 1,
                                            backgroundImage: "none",
                                            zIndex: 10,
                                        }}
                                    >
                                        Login
                                    </button>

                                    {errors && (
                                        <p className="text-red-500 text-sm mt-2 text-center">
                                            {errors}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Link
                                        href="forgot-password"
                                        className="text-[#009FDC] hover:text-[#0077B6] text-sm"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </form>

                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-600 text-base">
                                <p>
                                    Powered by:{" "}
                                    <a
                                        href="https://kexpertsco.com/"
                                        className="text-[#009FDC]"
                                    >
                                        الشركة خبراء المعرفة المحدوده
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
