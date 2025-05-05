import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight, faCalendarAlt, faCheck, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const RFQStatus = () => {
  // Mock data for demonstration
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
    <AuthenticatedLayout>
      <Head title="RFQ Status" />
      <div className="min-h-screen p-6" style={{ backgroundColor: "inherit" }}>
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

        {/* Breadcrumbs */}
        <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
            <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
            <span className="text-[#009FDC] text-xl">RFQ Status</span>
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          RFQ Status for Regular Purchase Flow
        </h1>

        {/* Main Content - Wrapped in dotted border */}
        <div className="border border-dashed border-gray-300 rounded-3xl p-6 bg-white">
          {/* Request ID Card */}
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center">
              <div className="font-medium">
                Request ID: <span className="text-gray-600">{requestData.requestId}</span>
              </div>
              <div className="text-gray-500 text-sm">
                {requestData.date} <span className="text-xs text-gray-400">{requestData.time}</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator Section */}
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <h2 className="font-medium text-gray-800 mb-8">Purchase Request Progress</h2>
            
            {/* Progress Steps */}
            <div className="relative mb-16">
              {/* Step Names - positioned above circles */}
              <div className="flex justify-between mb-4">
                {requestData.steps.map((step, index) => (
                  <div key={`name-${step.id}`} className="text-center px-1" style={{ width: '25%' }}>
                    <div className="font-bold text-sm">{step.name}</div>
                  </div>
                ))}
              </div>
              
              {/* Progress Line */}
              <div className="relative flex items-center justify-between h-10">
                {/* Horizontal Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 z-0"></div>
                
                {/* Completed Line */}
                <div 
                  className="absolute left-0 h-0.5 bg-green-500 top-1/2 z-0"
                  style={{ width: '100%' }}
                ></div>
                
                {/* Step Circles */}
                {requestData.steps.map((step, index) => (
                  <div 
                    key={`circle-${step.id}`} 
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    {step.completed && (
                      <FontAwesomeIcon icon={faCheck} className="text-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TWO SEPARATE STATUS CARDS - SIDE BY SIDE */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 gap-4" style={{ maxWidth: "650px", width: "100%" }}>
              {/* First Card - Filled Request with Khadija */}
              <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-white">
                {/* Top Row - Button */}
                <div className="mb-6">
                  <button className="border border-green-400 text-green-500 rounded-full px-4 py-1 text-sm">
                    Filled Request
                  </button>
                </div>
                
                {/* Label with Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600 text-sm">Informed to Manager</span>
                  <span className="bg-green-100 text-green-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    <span className="font-bold italic">i</span>
                  </span>
                </div>
                
                {/* Miss Khadija */}
                <div className="flex items-start">
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                      <span className="text-gray-600 text-xs">K</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Miss Khadija</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-gray-400" />
                      <span>Post: 6 Jan 2025</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Second Card - In-Progress Status with Alif */}
              <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-white">
                {/* Top Row - Button */}
                <div className="mb-6">
                  <button className="border border-green-400 text-green-500 rounded-full px-4 py-1 text-sm flex items-center">
                    In-Progress Status
                    <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-xs" />
                  </button>
                </div>
                
                {/* Label with Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600 text-sm">Manager Concern</span>
                  <span className="bg-green-100 text-green-800 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    <span className="font-bold italic">i</span>
                  </span>
                </div>
                
                {/* Mr Alif */}
                <div className="flex items-start">
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                      <span className="text-gray-600 text-xs">A</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Mr Alif</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-gray-400" />
                      <span>Post: 6 Jan 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default RFQStatus;