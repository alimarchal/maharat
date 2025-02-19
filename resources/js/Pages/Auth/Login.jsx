import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'react-feather';
import { Link } from "@inertiajs/react";

const LoginPage = () => {
  const [activeBoxes, setActiveBoxes] = useState([0, 1, 2, 3, 4, 5]);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [password, setPassword] = useState("");
  const [isFocused1, setIsFocused1] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Update boxes positions to rotate them clockwise
      setActiveBoxes((prevBoxes) => {
        const newBoxes = [...prevBoxes];
        // Rotate boxes in the sequence: 1 -> 2, 2 -> 4, 3 -> 1, 4 -> 6, 5 -> 3, 6 -> 5
        newBoxes[0] = prevBoxes[1];
        newBoxes[1] = prevBoxes[3];
        newBoxes[2] = prevBoxes[0];
        newBoxes[3] = prevBoxes[5];
        newBoxes[4] = prevBoxes[2];
        newBoxes[5] = prevBoxes[4];
        return newBoxes;
      });
    }, 2000); // Rotate every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const boxes = [
    {
      text: "Trustable purchase and inventory management system.",
      bgColor: "#C7E7DE", // Green background
      isEmpty: false, // Not empty
      textColor: "text-black",
    },
    {
        text: "", // Empty box
        bgColor: "transparent", // No background
        isEmpty: true, // Empty box
        opacity: 5, // Increased opacity
    },
    {
      text: "", // Empty text, logo will be displayed
      imgSrc: "/images/MCTC Logo.png",
      bgColor: "white", // White background
      isEmpty: false, // Not empty
    },
    {
      text: "Build your skilled workforce with the leader in construction training",
      bgColor: "#C7E7DE", // Green background
      isEmpty: false, // Not empty
      textColor: "text-black",
    },
    {
      text: "", // Empty box
      bgColor: "transparent", // No background
      isEmpty: true, // Empty box
    },
    {
      text: "Skilling innovatively",
      bgColor: "white", // White background
      isEmpty: false, // Not empty
      textColor: "text-black",
    }
  ];

  const getBoxPosition = (index, activeBoxes) => {
    
    const boxOrder = {
        0: 'top-0 left-[10%] -translate-x-[4%] -translate-y-[0%]',  
        1: 'top-0 right-[10%] translate-x-[4%] -translate-y-[0%]',     
        2: 'top-1/3 left-[10%] -translate-x-[4%] -translate-y-[0%]',  
        3: 'top-1/3 right-[10%] translate-x-[4%] -translate-y-[0%]',  
        4: 'bottom-0 left-[10%] -translate-x-[4%] translate-y-[0%]',  
        5: 'bottom-0 right-[10%] translate-x-[4%] translate-y-[0%]',  
      };

    return boxOrder[activeBoxes.indexOf(index)];
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6F2FF]">
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
          <div className="relative w-full h-full flex justify-center items-center">
        {boxes.map((box, index) => (
            <div
            key={index}
            className={`absolute flex justify-center items-center w-[250px] h-[220px] p-6 rounded-2xl backdrop-blur-sm transition-all duration-[1000ms] ease-in-out
            ${index === activeBoxes[0] ? 'opacity-100 transform scale-100' : 'opacity-100 scale-100'}
            ${getBoxPosition(index, activeBoxes)}`}
            style={{
            backgroundColor: box.bgColor === 'transparent' ? 'rgba(255, 255, 255, 0.4)' : box.bgColor, // Apply semi-transparent background for empty boxes
            opacity: 1, // Make sure it's not transparent
            }}
        >
            <div className="flex flex-col justify-center items-center">
                {/* Render the logo or image only if imgSrc is provided */}
                {box.imgSrc ? (
                <img
                    src={box.imgSrc}
                    alt={`Box ${index + 1}`}
                    className={`w-[100px] h-[100px] object-contain mb-2`} // Adjust logo size
                />
                ) : null}

                {/* Render text only if text is provided */}
                {box.text && !box.isEmpty ? (
                <p className={`text-sm text-center ${box.textColor || 'text-white'}`}>{box.text}</p>
                ) : null}
            </div>
            </div>
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
          {/* Background image with opacity applied using pseudo-element */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("/images/favicon.png")',
              backgroundSize: '80%',
              opacity: 0.1,
              pointerEvents: 'none', 
            }}
          />

          {/* Content inside right box */}
          <div className="flex justify-center items-center h-full bg-transparent">
            <div className="max-w-md w-full bg-transparent">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Login</h1>
              <p className="text-gray-700 mb-8">
                Enter your credential below to our reliable and seamless inventory management and control.
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

                <button
                type="submit"
                className="w-full py-3 px-4 text-white font-medium rounded-full transition duration-150"
                style={{
                    backgroundColor: "#009FDC",  
                    opacity: 1, 
                    backgroundImage: "none",   
                }}
                >
                Login
                </button>


                <div className="text-center space-y-4">
                    <Link 
                        href="forgot-password" 
                        className="text-[#009FDC] hover:text-[#0077B6] text-sm"
                    >
                        Forgot Password?
                    </Link>
                </div>
              </form>

              {/* Powered by Text */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-600 text-sm">
                <p>Powered by: <a href="dummy-link" className="text-[#009FDC]">خبراء المعدودة المحدودة</a></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
