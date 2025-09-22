import React, { useState, useRef, useEffect } from 'react';

const SelectFloating = ({ label, name, value, onChange, options, onScroll, loading, hasMore = true, showPagination = false, currentPage = 1, totalPages = 1, onPageChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const dropdownRef = useRef(null);
    const dropdownMenuRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // Find the selected option label
    useEffect(() => {
        const selectedOption = options.find(option => option.id == value);
        setSelectedLabel(selectedOption ? selectedOption.label : '');
    }, [value, options]);

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const calculatePosition = () => {
                const triggerRect = dropdownRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const dropdownHeight = 160;
                const spaceBelow = viewportHeight - triggerRect.bottom;
                const spaceAbove = triggerRect.top;

                // If there's not enough space below but enough above, open upward
                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                    setOpenUpward(true);
                } else {
                    setOpenUpward(false);
                }
            };

            // Calculate immediately
            calculatePosition();

            // Recalculate on window resize or scroll
            window.addEventListener('resize', calculatePosition);
            window.addEventListener('scroll', calculatePosition);

            return () => {
                window.removeEventListener('resize', calculatePosition);
                window.removeEventListener('scroll', calculatePosition);
            };
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option) => {
        onChange({ target: { name, value: option.id } });
        setIsOpen(false);
    };

    const handleScroll = (e) => {
        if (!onScroll || loading || !hasMore) return;

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Debounce the scroll event
        scrollTimeoutRef.current = setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            
            // Check if we're near the bottom (within 5px)
            if (scrollHeight - scrollTop - clientHeight < 5) {
                onScroll(e);
            }
        }, 150); // 150ms debounce
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC] transition-all duration-300 ease-in-out cursor-pointer min-h-[60px] flex items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`${value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {value ? selectedLabel : `Select ${label}`}
                </span>
                <svg
                    className={`absolute right-4 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            
            {isOpen && (
                <div 
                    ref={dropdownMenuRef}
                    className={`absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[160px] overflow-y-auto ${
                        openUpward 
                            ? 'bottom-full mb-1 mt-0' 
                            : 'top-full mt-1'
                    }`}
                    onScroll={handleScroll}
                >
                    <div className="py-1">
                        {options && options.length > 0 ? (
                            options.map((option, index) => (
                                option.isSeparator ? (
                                    <div
                                        key={index}
                                        className="px-4 py-2 text-gray-500 text-sm font-medium border-t border-gray-300 my-1 text-center cursor-default"
                                    >
                                        {option.label}
                                    </div>
                                ) : (
                                    <div
                                        key={index}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                                        onClick={() => handleSelect(option)}
                                    >
                                        {option.label}
                                    </div>
                                )
                            ))
                        ) : (
                            <div className="px-4 py-2 text-gray-500 text-center">
                                {loading ? 'Loading...' : 'No items available'}
                            </div>
                        )}
                        {loading && options && options.length > 0 && (
                            <div className="px-4 py-2 text-gray-500 text-center">
                                Loading...
                            </div>
                        )}
                        
                        {/* Pagination Controls */}
                        {showPagination && totalPages > 1 && (
                            <div className="border-t border-gray-200 px-2 py-2">
                                <div className="flex justify-between items-center text-sm">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (currentPage > 1 && onPageChange) {
                                                onPageChange(currentPage - 1);
                                            }
                                        }}
                                        disabled={currentPage <= 1}
                                        className={`px-2 py-1 rounded text-xs ${
                                            currentPage <= 1
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-blue-600 hover:text-blue-800"
                                        }`}
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-600">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (currentPage < totalPages && onPageChange) {
                                                onPageChange(currentPage + 1);
                                            }
                                        }}
                                        disabled={currentPage >= totalPages}
                                        className={`px-2 py-1 rounded text-xs ${
                                            currentPage >= totalPages
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-blue-600 hover:text-blue-800"
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <label
                className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all
                peer-focus:top-0 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-2
                -translate-y-1/2 ${
                    value
                        ? "top-0 text-base text-[#009FDC] px-2"
                        : "top-1/2 text-base text-gray-400"
                }`}
            >
                {value ? label : `Select ${label}`}
            </label>
        </div>
    );
};

export default SelectFloating;
