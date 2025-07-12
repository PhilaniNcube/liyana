import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

/**
 * Get the appropriate icon for an API check status
 */
export const getApiCheckStatusIcon = (status: string) => {
  switch (status) {
    case "passed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-700" />;
    case "pending":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

/**
 * Get the appropriate color classes for an API check status badge
 */
export const getApiCheckStatusColor = (status: string) => {
  switch (status) {
    case "passed":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
