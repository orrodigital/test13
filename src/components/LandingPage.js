import React, { useEffect, useRef, useState } from 'react';
import FallbackLanding from './FallbackLanding';
import MobileLanding from './MobileLanding';

const LandingPage = ({ onEnterApp, onZipSubmit }) => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    // Load Three.js and Vanta.js with error handling for SSR
    const loadScripts = async () => {
      // Skip script loading during SSR or on mobile devices
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // Skip 3D loading on mobile devices entirely
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth <= 768 ||
                      'ontouchstart' in window;
      
      if (isMobile) {
        setIsLoading(false);
        return;
      }

      try {
        // Load Three.js
        if (!window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        }
        
        // Load Vanta Clouds
        if (!window.VANTA) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.clouds.min.js');
        }

        // Initialize Vanta effect with error handling
        if (vantaRef.current && window.VANTA && window.VANTA.CLOUDS) {
          try {
            const effect = window.VANTA.CLOUDS({
              el: vantaRef.current,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              speed: 0.8, // Reduced for performance
              cloudShadows: false, // Disabled for performance
              backgroundColor: 0x0d0d1a,
              skyColor: 0x2d3748,
              cloudColor: 0x4a5568,
              sunColor: 0xff9919,
              sunGlareColor: 0xff6633,
              // Performance optimizations
              scale: 0.8,
              scaleMobile: 0.5, // Much lower for mobile performance
              mouseSensitivity: 1.2,
              touchSensitivity: 1.2,
              // Reduce quality on mobile
              quality: window.innerWidth < 768 ? 'low' : 'medium'
            });
            setVantaEffect(effect);
          } catch (vantaError) {
            console.warn('Vanta effect failed to initialize:', vantaError);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Vanta.js:', error);
        setIsLoading(false);
      }
    };

    loadScripts();

    // Cleanup
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Aggressive mobile detection to prevent crashes
  const isMobileDevice = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
  
  // Force fallback on ANY mobile device - no 3D at all
  if (isMobileDevice) {
    return <FallbackLanding onEnterApp={onEnterApp} onZipSubmit={onZipSubmit} />;
  }
  
  // Desktop fallback if Vanta fails to load
  if (isLoading === false && (!vantaEffect || typeof window === 'undefined')) {
    return <FallbackLanding onEnterApp={onEnterApp} onZipSubmit={onZipSubmit} />;
  }

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleEnterApp = async (zipCodeValue = null) => {
    // Handle ZIP code submission BEFORE transition
    if (zipCodeValue && onZipSubmit) {
      console.log('Submitting ZIP code:', zipCodeValue);
      await onZipSubmit(zipCodeValue);
    }
    
    // Add smooth transition effect
    const landing = document.getElementById('landing-page');
    if (landing) {
      landing.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
      landing.style.opacity = '0';
      landing.style.transform = 'scale(1.1)';
      setTimeout(() => {
        onEnterApp();
      }, 1000);
    } else {
      onEnterApp();
    }
  };

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (zipCode.trim()) {
      // Validate ZIP code
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (zipRegex.test(zipCode.trim())) {
        handleEnterApp(zipCode.trim());
      } else {
        // Show error animation
        const input = document.getElementById('landing-zip-input');
        if (input) {
          input.classList.add('animate-pulse');
          input.style.borderColor = '#ef4444';
          setTimeout(() => {
            input.classList.remove('animate-pulse');
            input.style.borderColor = '';
          }, 2000);
        }
      }
    } else {
      handleEnterApp();
    }
  };

  const handleGeolocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Pass coordinates to parent BEFORE transition
          if (onZipSubmit) {
            console.log('Submitting geolocation:', latitude, longitude);
            await onZipSubmit(null, latitude, longitude);
          }
          
          // Add smooth transition
          const landing = document.getElementById('landing-page');
          if (landing) {
            landing.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            landing.style.opacity = '0';
            landing.style.transform = 'scale(1.1)';
            setTimeout(() => {
              onEnterApp();
            }, 1000);
          } else {
            onEnterApp();
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          handleEnterApp();
        }
      );
    } else {
      handleEnterApp();
    }
  };

  return (
    <div 
      id="landing-page"
      ref={vantaRef} 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-12 h-12 border-3 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
            <div className="text-xl font-medium">Loading immersive experience...</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          {/* Main Tagline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 md:mb-6 text-white animate-fade-in leading-tight">
            Weather Like
          </h1>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-8 text-white animate-fade-in leading-tight" style={{animationDelay: '0.3s'}}>
            No Other
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3 md:mb-4 font-light animate-fade-in px-4" style={{animationDelay: '0.6s'}}>
            Immersive • Interactive • Intelligent
          </p>
          <p className="text-base sm:text-lg md:text-xl text-white/70 mb-8 md:mb-12 font-light animate-fade-in px-4 leading-relaxed" style={{animationDelay: '0.9s'}}>
            Experience weather through satellite imagery, AI presentation, and cinematic design
          </p>
        </div>


        {/* ZIP Code Input */}
        <div className="animate-fade-in mb-6 md:mb-8 px-4" style={{animationDelay: '1.2s'}}>
          <form onSubmit={handleZipSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex-1 relative">
                <input
                  id="landing-zip-input"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter ZIP code"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 text-center text-base sm:text-lg"
                />
              </div>
              <button
                type="button"
                onClick={handleGeolocation}
                className="px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 w-full sm:w-auto"
                title="Use current location"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                </svg>
                <span className="sm:hidden">Use Current Location</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none"></div>


      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .border-3 {
          border-width: 3px;
        }
        
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;