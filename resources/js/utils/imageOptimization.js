/**
 * Image optimization utilities for better performance
 */

// Cache for loaded images
const imageCache = new Map();

/**
 * Preload an image and cache it
 * @param {string} src - Image source URL
 * @returns {Promise} - Promise that resolves when image is loaded
 */
export const preloadImage = (src) => {
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src));
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * Preload multiple images
 * @param {string[]} srcs - Array of image source URLs
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
export const preloadImages = (srcs) => {
    return Promise.all(srcs.map(src => preloadImage(src)));
};

/**
 * Lazy load images with intersection observer
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image URL
 * @returns {Object} - React props for lazy loading
 */
export const useLazyImage = (src, placeholder = '/images/placeholder.png') => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isInView && !isLoaded) {
            preloadImage(src)
                .then(() => {
                    setImageSrc(src);
                    setIsLoaded(true);
                })
                .catch(() => {
                    setImageSrc(placeholder);
                    setIsLoaded(true);
                });
        }
    }, [isInView, src, placeholder, isLoaded]);

    return {
        ref: imgRef,
        src: imageSrc,
        isLoaded,
        style: { opacity: isLoaded ? 1 : 0.5, transition: 'opacity 0.3s ease' }
    };
};

/**
 * Optimize image loading with error handling
 * @param {string} src - Image source URL
 * @param {string} fallback - Fallback image URL
 * @returns {Object} - Image props with optimization
 */
export const getOptimizedImageProps = (src, fallback = '/images/placeholder.png') => {
    return {
        src,
        loading: 'lazy',
        decoding: 'async',
        onError: (e) => {
            if (e.target.src !== fallback) {
                e.target.src = fallback;
            }
        },
        onLoad: () => {
            // Add loaded class for smooth transitions
            e.target.style.opacity = '1';
        },
        style: { 
            opacity: 0,
            transition: 'opacity 0.3s ease'
        }
    };
};

/**
 * Preload critical dashboard images
 */
export const preloadDashboardImages = () => {
    const criticalImages = [
        '/images/banner.png',
        '/images/dashboard.png',
        '/images/pdf-file.png',
        '/images/placeholder.png'
    ];
    
    return preloadImages(criticalImages);
};

/**
 * Clear image cache (useful for memory management)
 */
export const clearImageCache = () => {
    imageCache.clear();
};
