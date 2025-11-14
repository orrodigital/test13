import React, { useState } from 'react';

// Ultra-lightweight mobile landing page to prevent crashes
const MobileLanding = ({ onEnterApp, onZipSubmit }) => {
  const [zipCode, setZipCode] = useState('');

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (zipCode.trim()) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (zipRegex.test(zipCode.trim())) {
        handleEnterApp(zipCode.trim());
      } else {
        alert('Please enter a valid 5-digit ZIP code');
      }
    } else {
      handleEnterApp();
    }
  };

  const handleEnterApp = async (zipCodeValue = null) => {
    if (zipCodeValue && onZipSubmit) {
      await onZipSubmit(zipCodeValue);
    }
    onEnterApp();
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (onZipSubmit) {
            await onZipSubmit(null, latitude, longitude);
          }
          onEnterApp();
        },
        () => handleEnterApp()
      );
    } else {
      handleEnterApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* Simple animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-sm mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-white leading-tight">
            Weather Like
          </h1>
          <h1 className="text-3xl font-bold mb-6 text-white leading-tight">
            No Other
          </h1>
          <p className="text-base text-white/80 mb-2">
            Immersive • Interactive • Intelligent
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            Experience weather through satellite imagery and AI presentation
          </p>
        </div>

        {/* ZIP Code Input */}
        <div className="mb-6">
          <form onSubmit={handleZipSubmit} className="space-y-3">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter ZIP code"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-center"
            />
            
            <button
              type="button"
              onClick={handleGeolocation}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Use Current Location</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MobileLanding;