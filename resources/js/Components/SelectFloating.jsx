import React, { useState, useRef, useEffect } from 'react';

const SelectFloating = ({ label, name, value, onChange, options, onScroll, loading, hasMore = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const dropdownRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // Find the selected option label
    useEffect(() => {
        const selectedOption = options.find(option => option.id == value);
        setSelectedLabel(selectedOption ? selectedOption.label : '');
    }, [value, options]);

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
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[120px] overflow-y-auto"
                    onScroll={handleScroll}
                >
                    <div className="py-1">
                        {options && options.length > 0 ? (
                            options.map((option, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                                    onClick={() => handleSelect(option)}
                                >
                        {option.label}
                                </div>
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
