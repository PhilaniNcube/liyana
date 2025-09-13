import { getClaimsByUserId } from "@/lib/queries/claims";
import React from "react";

// Define the contact details interface based on the API schema
interface ContactDetails {
  name: string;
  email: string;
  phone: string;
  relationship?: string;
  is_policy_holder: "yes" | "no";
}

// Define the claim interface based on the database structure
interface Claim {
  id: number;
  created_at: string;
  policy_id: number;
  claimant_party_id: string;
  claim_number: string;
  date_of_incident: string;
  date_filed: string;
  status: string;
  contact_details: ContactDetails | null;
}

const PolicyClaims = async () => {
  const claims = (await getClaimsByUserId()) as Claim[] | null;

  console.log("Fetched claims:", claims);

  if (!claims || claims.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Your Policy Claims
          </h1>
          <p className="text-gray-600 mt-2">
            View and track all your insurance claims
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Claims Found
          </h3>
          <p className="text-gray-500 mb-6">
            You haven't filed any insurance claims yet. When you do, they'll
            appear here.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Learn About Claims Process
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-purple-100 text-purple-800",
      under_review: "bg-orange-100 text-orange-800",
      denied: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
      >
        {status.replace("_", " ").charAt(0).toUpperCase() +
          status.replace("_", " ").slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6 container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Policy Claims</h1>
        <p className="text-gray-600 mt-2">
          View and track all your insurance claims
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claim Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Incident
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Filed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claimant Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policy
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {claim.claim_number}
                  </div>
                  <div className="text-xs text-gray-500">ID: {claim.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(claim.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(claim.date_of_incident)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{formatDate(claim.date_filed)}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(claim.date_filed).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {claim.contact_details ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        {claim.contact_details.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        📧 {claim.contact_details.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        📞 {claim.contact_details.phone}
                      </div>
                      {claim.contact_details.relationship && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Relationship:</span>{" "}
                          {claim.contact_details.relationship}
                        </div>
                      )}
                      <div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            claim.contact_details.is_policy_holder === "yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {claim.contact_details.is_policy_holder === "yes"
                            ? "👤 Policy Holder"
                            : "👥 Covered Person"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-sm">
                      No contact details available
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Policy #{claim.policy_id}
                  </div>
                  <div className="text-xs text-gray-500">
                    Party: {claim.claimant_party_id.slice(0, 8)}...
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {claim.claim_number}
                </h3>
                <p className="text-sm text-gray-500">Claim ID: {claim.id}</p>
              </div>
              <div>{getStatusBadge(claim.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Incident
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(claim.date_of_incident)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Filed
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(claim.date_filed)}
                </p>
              </div>
            </div>

            {claim.contact_details && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Claimant Details
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {claim.contact_details.name}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        claim.contact_details.is_policy_holder === "yes"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {claim.contact_details.is_policy_holder === "yes"
                        ? "Policy Holder"
                        : "Covered Person"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    📧 {claim.contact_details.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    📞 {claim.contact_details.phone}
                  </div>
                  {claim.contact_details.relationship && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Relationship:</span>{" "}
                      {claim.contact_details.relationship}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Policy #{claim.policy_id}</span>
                <span className="text-gray-400">
                  Party: {claim.claimant_party_id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
        <span>Total Claims: {claims.length}</span>
        <span>
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default PolicyClaims;
