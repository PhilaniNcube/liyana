"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { WhoYouIdVerificationDetail } from "@/lib/schemas";

interface IdVerificationDisplayProps {
  verificationData: WhoYouIdVerificationDetail;
  onRunNewVerification?: () => void;
  showNewVerificationButton?: boolean;
}

export function IdVerificationDisplay({
  verificationData,
  onRunNewVerification,
  showNewVerificationButton = true,
}: IdVerificationDisplayProps) {
  const formatIdDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === "Active";
    return (
      <Badge variant={isActive ? "default" : "destructive"}>{status}</Badge>
    );
  };

  const getBooleanIcon = (value: boolean) => {
    return value ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-800 font-medium">ID Verification Complete</p>
        </div>
        <p className="text-green-600 text-sm">
          ID verification has been processed successfully
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">ID Number</span>
              <span className="text-xs">{verificationData.idNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">First Names</span>
              <span className="text-xs">{verificationData.firstNames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Surname</span>
              <span className="text-xs">{verificationData.surname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Gender</span>
              <span className="text-xs capitalize">
                {verificationData.gender}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Date of Birth
              </span>
              <span className="text-xs">
                {formatIdDate(verificationData.dateOfBirth)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              {getStatusBadge(verificationData.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Deceased</span>
              {verificationData.deadIndicator !== null ? (
                getBooleanIcon(!verificationData.deadIndicator)
              ) : (
                <span className="text-xs text-gray-500">Unknown</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Marital Status
              </span>
              <span className="text-xs capitalize">
                {verificationData.maritalStatus}
              </span>
            </div>
            {verificationData.dateOfMarriage && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  Marriage Date
                </span>
                <span className="text-xs">
                  {verificationData.dateOfMarriage}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Display Card */}
        {verificationData.photo && verificationData.hasPhoto && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">ID Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="flex flex-col items-center">
                <img
                  src={`data:image/jpeg;base64,${verificationData.photo}`}
                  alt="ID Photo"
                  className="w-32 h-40 object-cover rounded border-2 border-gray-300 shadow-md"
                  onError={(e) => {
                    console.error("Error loading photo");
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-xs text-muted-foreground mt-2">
                  Official ID Photo
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Registration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">On HANIS</span>
              {getBooleanIcon(verificationData.onHANIS)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">On NPR</span>
              {getBooleanIcon(verificationData.onNPR)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Smart Card Issued
              </span>
              {getBooleanIcon(verificationData.smartCardIssued)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ID Number Blocked
              </span>
              {getBooleanIcon(!verificationData.idNumberBlocked)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Birth Place</span>
              <span className="text-xs">
                {verificationData.birthPlaceCountryCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                ID Issue Date
              </span>
              <span className="text-xs">{verificationData.idIssueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Data Source</span>
              <Badge variant="outline" className="text-xs">
                {verificationData.dataSource}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Has Photo</span>
              {getBooleanIcon(verificationData.hasPhoto)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Verification ID
              </span>
              <span className="text-xs">{verificationData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Date Performed
              </span>
              <span className="text-xs">
                {formatIdDate(verificationData.datePerformed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Sequence Number
              </span>
              <span className="text-xs">
                {verificationData.idSequenceNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                DHA Live Access
              </span>
              {getBooleanIcon(verificationData.canAccessDhaLive)}
            </div>
          </CardContent>
        </Card>
      </div>

      {showNewVerificationButton && onRunNewVerification && (
        <div className="flex justify-center pt-4">
          <Button onClick={onRunNewVerification} variant="outline">
            Run New Verification
          </Button>
        </div>
      )}
    </div>
  );
}
