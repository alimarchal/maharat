import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from "@inertiajs/react";

const ForgotPasswordPage = () => {
  const [activeBoxes, setActiveBoxes] = useState([0, 1, 2, 3, 4, 5]);
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFocusedNewPassword, setIsFocusedNewPassword] = useState(false);
  const [isFocusedConfirmPassword, setIsFocusedConfirmPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationFocused, setIsVerificationFocused] = useState(false);
  const verificationInputs = useRef([]);

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
  }, [verificationInputs.current]); 

  const fixedBoxes = Array.from({ length: 6 }, () => ({
    text: "",
    bgColor: "rgba(255, 255, 255, 0.3)", // White shade with transparency
    isEmpty: true,
  }));

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setError("");

    // Validate email format
    if (!validateEmail(email)) {
      setError("Invalid email format. Please enter a valid email address.");
      return;
    }

    // Simulate email existence check (replace with actual API call)
    const emailExists = await checkEmailExists(email);

    if (!emailExists) {
      setError("Email does not exist. Please contact Admin.");
      return;
    }

    // Simulate sending verification code (replace with actual API call)
    const code = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit code
    console.log("Verification Code:", code); // For testing purposes
    setVerificationCode(code.toString());
    setShowVerification(true);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError("");

    const enteredCode = Array.from({ length: 6 }, (_, i) => e.target[`code-${i}`].value).join("");

    if (enteredCode !== verificationCode) {
      setError("Verification code is incorrect.");
      return;
    }

    setIsVerified(true);
    setShowVerification(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Simulate password reset (replace with actual API call)
    const resetSuccess = await resetPassword(email, newPassword);

    if (!resetSuccess) {
      setError("Failed to reset password. Please try again.");
      return;
    }

    // Redirect to login page
    router.visit("/login");
  };

  const handleVerificationInput = (index, e) => {
    const value = e.target.value;

    // Move forward when a digit is entered
    if (value.length === 1 && index < 5) {
        verificationInputs.current[index + 1]?.focus();
    }

    // Move backward when backspace is pressed on an empty field
    if (e.key === "Backspace") {
        if (value === "" && index > 0) {
            verificationInputs.current[index - 1].value = ""; // Clear the previous input
            verificationInputs.current[index - 1]?.focus();
        } else {
            e.target.value = ""; // Clear the current input
        }
    }
};

  // Simulated functions (replace with actual API calls)
  const checkEmailExists = async (email) => {
    // Replace with actual API call to check if email exists
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000)); // Simulate success
  };

  const resetPassword = async (email, newPassword) => {
    // Replace with actual API call to reset password
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000)); // Simulate success
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5FAFF]">
      <div className="flex w-full">
        {/* Left Side with Rotating Boxes */}
        <div
          className="p-8 bg-cover bg-center rounded-3xl relative"
          style={{
            backgroundImage: 'url("/images/BoxPic.jpeg")',
            marginTop: "20px",
            marginLeft: "20px",
            marginBottom: "20px",
            height: "calc(100vh - 40px)",
            flex: "1 1 50%",
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
                className={`absolute flex justify-center items-center w-[250px] h-[220px] p-6 rounded-2xl backdrop-blur-sm
                  ${getBoxPosition(index)}`}
                style={{
                  backgroundColor: box.bgColor,
                  opacity: 1,
                  top: getBoxPosition(activeBoxes.indexOf(index)).top,
                  left: getBoxPosition(activeBoxes.indexOf(index)).left,
                }}
              >
                <p className={`text-sm text-center ${box.textColor || "text-white"}`}>{box.text}</p>
              </div>
            ))}

            {/* Rotating boxes with content */}
            {rotatingBoxes.map((box, index) =>
              box.bgColor !== "transparent" ? (
                <div
                  key={`rotating-${index}`}
                  className={`absolute flex justify-center items-center w-[250px] h-[220px] p-6 rounded-2xl backdrop-blur-sm transition-all duration-[3000ms] ease-in-out
                    ${getBoxPosition(activeBoxes.indexOf(index))}`}
                  style={{
                    backgroundColor: box.bgColor,
                    opacity: 1,
                    top: getBoxPosition(activeBoxes.indexOf(index)).top,
                    left: getBoxPosition(activeBoxes.indexOf(index)).left,
                  }}
                >
                  <div className="flex flex-col justify-center items-center">
                    {box.imgSrc && (
                      <img
                        src={box.imgSrc}
                        alt={`Box ${index + 1}`}
                        className="w-[100px] h-[100px] object-contain mb-2"
                      />
                    )}
                    {box.text && !box.isEmpty && (
                      <p className={`text-sm text-center ${box.textColor || "text-white"}`}>{box.text}</p>
                    )}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Right Side with Forgot Password Form */}
        <div
          className="p-8 relative"
          style={{
            marginTop: "20px",
            marginRight: "2px",
            marginBottom: "20px",
            height: "calc(100vh - 40px)",
            flex: "1 1 50%",
            borderRadius: "0",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("/images/favicon.png")',
              backgroundSize: "80%",
              opacity: 0.1,
              pointerEvents: "none",
            }}
          />

          <div className="flex justify-center items-center h-full bg-transparent">
            <div className="max-w-md w-full bg-transparent">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
              <p className="text-gray-700 mb-8">
                Just let us know your email address and we will email you a password reset link that will allow you to
                choose a new one.
              </p>

              <form className="space-y-6" onSubmit={isVerified ? handleResetPassword : handleVerifyCode}>
              <div className="relative">
                {!showVerification && !isVerified && (
                    <>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(email.length > 0)}
                        className="peer block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-[#009FDC] focus:border-[#009FDC] placeholder-gray-400"
                    />
                    <label
                        htmlFor="email"
                        className={`absolute transition-all text-base ${
                        isFocused || email
                            ? "top-[-1.2rem] left-1 text-sm text-[#009FDC] font-bold"
                            : "top-1/2 transform -translate-y-1/2 left-5 text-gray-400 font-normal"
                        }`}
                    >
                        {email ? "Email" : "Enter your Email"}
                    </label>
                    </>
                )}
                </div>

                {!showVerification && !isVerified && (
                  <button
                    type="button"
                    onClick={handleEmailVerification}
                    className="w-full py-3 px-4 text-white font-medium rounded-full transition duration-150"
                    style={{
                      backgroundColor: "#009FDC",
                      opacity: 1,
                      backgroundImage: "none",
                    }}
                  >
                    Email Verification Code
                  </button>
                )}

                {showVerification && !isVerified && (
                <>
                    <div className="relative">
                    <label
                    className={`absolute transition-all text-base ${
                        verificationInputs.current.some(input => input?.value.length > 0) 
                        ? "top-[-1.2rem] left-1 text-sm text-[#009FDC] font-bold"
                        : "top-[-1.2rem] left-1 text-sm text-[#009FDC] font-bold"
                    }`}
                >
                    {verificationInputs.current[0]?.value.length > 0 || 
                    verificationInputs.current.some(input => input?.value.length > 0) 
                        ? "Verification Code" 
                        : "Enter 6 Digit Verification Code"}
                </label>

                    <div className="flex justify-between space-x-2 mt-8">
                    {Array.from({ length: 6 }, (_, i) => (
                        <input
                            key={i}
                            type="text"
                            id={`code-${i}`}
                            maxLength={1}
                            ref={(el) => (verificationInputs.current[i] = el)}
                            onChange={(e) => handleVerificationInput(i, e)}
                            onKeyDown={(e) => handleVerificationInput(i, e)}
                            className="w-1/6 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-center focus:ring-[#009FDC] focus:border-[#009FDC]"
                        />
                    ))}
                    </div>
                    </div>
                    <button
                    type="submit"
                    className="w-full py-3 px-4 text-white font-medium rounded-full transition duration-150 mt-4"
                    style={{
                        backgroundColor: "#009FDC",
                        opacity: 1,
                        backgroundImage: "none",
                    }}
                    >
                    Verify Code
                    </button>
                </>
                )}


                {isVerified && (
                  <>
                    <div className="relative">
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onFocus={() => setIsFocusedNewPassword(true)}
                        onBlur={() => setIsFocusedNewPassword(newPassword.length > 0)}
                        className="peer block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg 
                                  focus:ring-[#009FDC] focus:border-[#009FDC] placeholder-gray-400"
                      />
                      <label
                        htmlFor="newPassword"
                        className={`absolute transition-all text-base ${
                          isFocusedNewPassword || newPassword
                            ? "top-[-1.2rem] left-1 text-sm text-[#009FDC] font-bold"
                            : "top-1/2 transform -translate-y-1/2 left-5 text-gray-400 font-normal"
                        }`}
                      >
                        {newPassword ? "New Password" : "Enter New Password"}
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setIsFocusedConfirmPassword(true)}
                        onBlur={() => setIsFocusedConfirmPassword(confirmPassword.length > 0)}
                        className="peer block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg 
                                  focus:ring-[#009FDC] focus:border-[#009FDC] placeholder-gray-400"
                      />
                      <label
                        htmlFor="confirmPassword"
                        className={`absolute transition-all text-base ${
                          isFocusedConfirmPassword || confirmPassword
                            ? "top-[-1.2rem] left-1 text-sm text-[#009FDC] font-bold"
                            : "top-1/2 transform -translate-y-1/2 left-5 text-gray-400 font-normal"
                        }`}
                      >
                        {confirmPassword ? "Confirmed New Password" : "Re-enter New Password"}
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 text-white font-medium rounded-full transition duration-150"
                      style={{
                        backgroundColor: "#009FDC",
                        opacity: 1,
                        backgroundImage: "none",
                      }}
                    >
                      Reset Password
                    </button>
                  </>
                )}

                {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
              </form>

              <div className="text-center space-y-4 mt-4">
                <Link href="/login" className="text-[#009FDC] hover:text-[#0077B6] text-sm">
                  Back to Login
                </Link>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-600 text-sm">
                <p>
                  Powered by:{" "}
                  <a href="dummy-link" className="text-[#009FDC]">
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

export default ForgotPasswordPage;