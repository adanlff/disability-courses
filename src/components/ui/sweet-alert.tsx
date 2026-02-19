import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export type AlertType = "success" | "error" | "warning" | "info";

interface SweetAlertProps {
  type: AlertType;
  title: string;
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  showCloseButton?: boolean;
  children?: React.ReactNode;
}

const SweetAlert: React.FC<SweetAlertProps> = ({
  type,
  title,
  message,
  show,
  onClose,
  duration = 3000,
  showCloseButton = false,
  children,
}) => {
  React.useEffect(() => {
    if (show && duration > 0 && !children) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose, children]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-[#008A00] dark:border-[#008A00]";
      case "error":
        return "border-[#D93025] dark:border-[#D93025]";
      case "warning":
        return "border-[#F4B400] dark:border-[#F4B400]";
      case "info":
        return "border-[#005EB8] dark:border-[#005EB8]";
      default:
        return "border-[#005EB8] dark:border-[#005EB8]";
    }
  };

  const getTextColors = () => {
    switch (type) {
      case "success":
        return "text-[#008A00] dark:text-[#FFFFFF]";
      case "error":
        return "text-[#D93025] dark:text-[#FFFFFF]";
      case "warning":
        return "text-[#F4B400] dark:text-[#1A1A1A]";
      case "info":
        return "text-[#005EB8] dark:text-[#FFFFFF]";
      default:
        return "text-[#005EB8] dark:text-[#FFFFFF]";
    }
  };

  const getIconColors = () => {
    switch (type) {
      case "success":
        return "text-[#008A00] dark:text-[#FFFFFF]";
      case "error":
        return "text-[#D93025] dark:text-[#FFFFFF]";
      case "warning":
        return "text-[#F4B400] dark:text-[#1A1A1A]";
      case "info":
        return "text-[#005EB8] dark:text-[#FFFFFF]";
      default:
        return "text-[#005EB8] dark:text-[#FFFFFF]";
    }
  };

  const getCloseButtonColors = () => {
    switch (type) {
      case "success":
        return "bg-gray-100 dark:bg-gray-800 text-[#008A00] dark:text-[#FFFFFF] hover:bg-gray-200 dark:hover:bg-gray-700";
      case "error":
        return "bg-gray-100 dark:bg-gray-800 text-[#D93025] dark:text-[#FFFFFF] hover:bg-gray-200 dark:hover:bg-gray-700";
      case "warning":
        return "bg-gray-100 dark:bg-gray-800 text-[#F4B400] dark:text-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-gray-700";
      case "info":
        return "bg-gray-100 dark:bg-gray-800 text-[#005EB8] dark:text-[#FFFFFF] hover:bg-gray-200 dark:hover:bg-gray-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-[#005EB8] dark:text-[#FFFFFF] hover:bg-gray-200 dark:hover:bg-gray-700";
    }
  };

  const getProgressBarColors = () => {
    switch (type) {
      case "success":
        return "bg-[#008A00]";
      case "error":
        return "bg-[#D93025]";
      case "warning":
        return "bg-[#F4B400]";
      case "info":
        return "bg-[#005EB8]";
      default:
        return "bg-[#005EB8]";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <Card className={`relative max-w-md w-full mx-4 overflow-hidden transform transition-all animate-fade-in-up z-[10000] shadow-2xl rounded-xl ${getBorderColor()}`}>
        <CardContent className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 mt-1 ${getIconColors()}`}>
              {getIcon()}
            </div>
            <div className="ml-4 w-full">
              <h3 className={`text-lg font-semibold ${getTextColors()}`}>
                {title}
              </h3>
              <div className={`mt-2 text-sm ${getTextColors()}`}>
                <p>{message}</p>
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`ml-4 flex-shrink-0 rounded-full ${getCloseButtonColors()} p-2 hover:opacity-80 transition-opacity`}
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          
          {children}
        </CardContent>
        
        {duration > 0 && !children && (
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div 
              className={`h-full ${getProgressBarColors()} animate-progress`}
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default SweetAlert;