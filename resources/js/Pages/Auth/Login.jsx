import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'react-feather';
import { Link, router } from "@inertiajs/react";

const LoginPage = () => {
  const [activeBoxes, setActiveBoxes] = useState([0, 1, 2, 3, 4, 5]);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [password, setPassword] = useState("");
  const [isFocused1, setIsFocused1] = useState(false);
  const [error, setError] = useState("");

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
      { top: "0%", left: "8%" },    // Top Left
      { top: "0%", left: "53%" },    // Top Right
      { top: "34%", left: "8%" },   // Middle Left
      { top: "34%", left: "53%" },   // Middle Right
      { top: "68%", left: "8%" },   // Bottom Left
      { top: "68%", left: "53%" },   // Bottom Right
    ];
    return positions[index];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    router.post("/login", { email, password }, {
        onSuccess: () => {
            router.visit("/dashboard"); 
        },
        onError: (errors) => {
            console.log("Login Errors:", errors); 
        
            if (errors.failed) {
                setError(errors.failed);  // "These credentials do not match our records."
            } else if (errors.password) {
                setError(errors.password);  // "The provided password is incorrect."
            } else if (errors.throttle) {
                setError(errors.throttle);  // "Too many login attempts. Please try again in X seconds."
            } else if (errors.email) {
                setError(errors.email);  // "Invalid email format"
            } else {
                setError("Invalid email or password. Please try again.");
            }
        }
    });
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5FAFF]">
      <div className="flex w-full">

        {/* Left Side with Rotating Boxes */}
        <div className="p-8 bg-cover bg-center rounded-3xl relative" 
             style={{
               backgroundImage: 'url("/images/BoxPic.jpeg")', 
               marginTop: '20px', 
               marginLeft: '20px', 
               marginBottom: '20px', 
               height: 'calc(100vh - 40px)', 
               flex: '1 1 50%',
             }}>

            <div style={{
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
            }} />

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
                <p className={`text-sm text-center ${box.textColor || 'text-white'}`}>{box.text}</p>
              </div>
            ))}

            {/* Rotating boxes with content */}
            {rotatingBoxes.map((box, index) => (
              box.bgColor !== "transparent" && ( 
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
                      <p className={`text-sm text-center ${box.textColor || 'text-white'}`}>{box.text}</p>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Right Side with Login Form */}
        <div
          className="p-8 relative"
          style={{
            marginTop: '20px',
            marginRight: '2px',
            marginBottom: '20px',
            height: 'calc(100vh - 40px)',
            flex: '1 1 50%',
            borderRadius: '0',
          }}
        >
        
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("/images/favicon.png")',
              backgroundSize: '80%',
              opacity: 0.1,
              pointerEvents: 'none', 
            }}
          />

          <div className="flex justify-center items-center h-full bg-transparent">
            <div className="max-w-md w-full bg-transparent">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Login</h1>
              <p className="text-gray-700 mb-8">
                Enter your credentials below to access our reliable and seamless inventory management and control system.
              </p>

              <form className="space-y-6">
                <div className="relative">
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
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused1(true)}
                    onBlur={() => setIsFocused1(password.length > 0)}
                    className="peer block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg 
                              focus:ring-[#009FDC] focus:border-[#009FDC] placeholder-gray-400"
                  />
                  <label
                    htmlFor="password"
                    className={`absolute transition-all text-base ${
                      isFocused1 || password
                        ? "top-[-1.2rem] left-1 text-sm text-[#009FDC] font-bold"
                        : "top-1/2 transform -translate-y-1/2 left-5 text-gray-400 font-normal"
                    }`}
                  >
                    {password ? "Password" : "Enter your Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
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

                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                </div>

                <div className="text-center space-y-4">
                  <Link 
                    href="forgot-password" 
                    className="text-[#009FDC] hover:text-[#0077B6] text-sm"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </form>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-600 text-sm">
                <p>Powered by: <a href="dummy-link" className="text-[#009FDC]">الشركة خبراء المعرفة المحدوده</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;