"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consentGiven = localStorage.getItem("liyana-consent");
    if (!consentGiven) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("liyana-consent", "accepted");
    handleClose();
  };

  const handleDecline = () => {
    localStorage.setItem("liyana-consent", "declined");
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isClosing ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Icon and Content */}
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <Cookie className="h-5 w-5" style={{ color: '#f7e306' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                We value your privacy
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, 
                analyze usage, and provide personalized content. By continuing to use 
                our services, you consent to our use of cookies as described in our{" "}
                <a 
                  href="/privacy-policy" 
                  className="underline hover:no-underline"
                  style={{ color: '#f7e306' }}
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-black rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              style={{ backgroundColor: '#f7e306' }}
            >
              Accept All
            </button>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
              aria-label="Close banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}