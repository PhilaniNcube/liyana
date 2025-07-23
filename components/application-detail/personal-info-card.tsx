import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  IdCard,
} from "lucide-react";
import { useState } from "react";
import {
  WhoYouCellphoneVerificationDetail,
  WhoYouIdVerificationDetail,
} from "@/lib/schemas";

interface Application {
  id: number;
  id_number_decrypted: string;
  email?: string | null;
  date_of_birth: string | null;
  gender: string | null;
  gender_other: string | null;
  marital_status: string | null;
  nationality: string | null;
  language: string | null;
  dependants: number | null;
  home_address: string | null;
  city: string | null;
  postal_code: string | null;
  profile?: {
    full_name: string;
    email?: string | null;
    phone_number?: string | null;
  } | null;
}

interface PersonalInfoCardProps {
  application: Application;
}

export function PersonalInfoCard({ application }: PersonalInfoCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<WhoYouCellphoneVerificationDetail | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ID Verification state
  const [isIdVerifying, setIsIdVerifying] = useState(false);
  const [idVerificationResult, setIdVerificationResult] =
    useState<WhoYouIdVerificationDetail | null>(null);
  const [idVerificationError, setIdVerificationError] = useState<string | null>(
    null
  );
  const [isIdDialogOpen, setIsIdDialogOpen] = useState(false);

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCellphoneVerification = async () => {
    if (!application.id) {
      setVerificationError("Application ID is required for verification");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/kyc/cellphone-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: application.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify cellphone");
      }

      if (data.cellphoneVerificationInformation) {
        setVerificationResult(data.cellphoneVerificationInformation);
      } else {
        setVerificationError("No verification data received");
      }
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "An error occurred during verification"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (isMatch: boolean) => {
    return isMatch ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-600";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleIdVerification = async () => {
    if (!application.id) {
      setIdVerificationError("Application ID is required for verification");
      return;
    }

    setIsIdVerifying(true);
    setIdVerificationError(null);
    setIdVerificationResult(null);

    try {
      const response = await fetch("/api/kyc/id-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: application.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify ID");
      }

      if (data.success && data.data) {
        setIdVerificationResult(data.data);
      } else {
        setIdVerificationError("No verification data received");
      }
    } catch (error) {
      setIdVerificationError(
        error instanceof Error
          ? error.message
          : "An error occurred during verification"
      );
    } finally {
      setIsIdVerifying(false);
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {application.profile && (
          <>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Applicant Name
                  </p>
                  <p className="text-lg font-semibold text-blue-800">
                    {application.profile.full_name || "Name not provided"}
                  </p>
                </div>
                <Dialog open={isIdDialogOpen} onOpenChange={setIsIdDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <IdCard className="h-4 w-4 mr-2" />
                      Verify ID
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <IdCard className="h-5 w-5 mr-2" />
                        ID Verification
                      </DialogTitle>
                      <DialogDescription>
                        Verify the ID number against official government records
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {!idVerificationResult && !idVerificationError && (
                        <div className="text-center py-4">
                          <Button
                            onClick={handleIdVerification}
                            disabled={isIdVerifying}
                            className="w-full"
                          >
                            {isIdVerifying ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Start Verification
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {idVerificationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-red-800 font-medium">
                              Verification Failed
                            </p>
                          </div>
                          <p className="text-red-600 text-sm mt-1">
                            {idVerificationError}
                          </p>
                          <Button
                            onClick={handleIdVerification}
                            disabled={isIdVerifying}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            Retry Verification
                          </Button>
                        </div>
                      )}

                      {idVerificationResult && (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <p className="text-green-800 font-medium">
                                ID Verification Complete
                              </p>
                            </div>
                            <p className="text-green-600 text-sm">
                              ID verification has been processed successfully
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Personal Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    ID Number
                                  </span>
                                  <span className="text-xs font-mono">
                                    {idVerificationResult.idNumber}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    First Names
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.firstNames}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Surname
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.surname}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Gender
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.gender}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Date of Birth
                                  </span>
                                  <span className="text-xs">
                                    {formatIdDate(
                                      idVerificationResult.dateOfBirth
                                    )}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Status Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Status
                                  </span>
                                  {getStatusBadge(idVerificationResult.status)}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Deceased
                                  </span>
                                  {idVerificationResult.deadIndicator !==
                                  null ? (
                                    getBooleanIcon(
                                      !idVerificationResult.deadIndicator
                                    )
                                  ) : (
                                    <span className="text-xs text-gray-500">
                                      Unknown
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Marital Status
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.maritalStatus}
                                  </span>
                                </div>
                                {idVerificationResult.dateOfMarriage && (
                                  <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Marriage Date
                                    </span>
                                    <span className="text-xs">
                                      {idVerificationResult.dateOfMarriage}
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Registration Status
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    On HANIS
                                  </span>
                                  {getBooleanIcon(idVerificationResult.onHANIS)}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    On NPR
                                  </span>
                                  {getBooleanIcon(idVerificationResult.onNPR)}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Smart Card Issued
                                  </span>
                                  {getBooleanIcon(
                                    idVerificationResult.smartCardIssued
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    ID Number Blocked
                                  </span>
                                  {getBooleanIcon(
                                    !idVerificationResult.idNumberBlocked
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Additional Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Birth Place
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.birthPlaceCountryCode}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    ID Issue Date
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.idIssueDate}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Data Source
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {idVerificationResult.dataSource}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Has Photo
                                  </span>
                                  {getBooleanIcon(
                                    idVerificationResult.hasPhoto
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Verification Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Verification ID
                                  </span>
                                  <span className="text-xs font-mono">
                                    {idVerificationResult.id}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Date Performed
                                  </span>
                                  <span className="text-xs">
                                    {formatIdDate(
                                      idVerificationResult.datePerformed
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Sequence Number
                                  </span>
                                  <span className="text-xs">
                                    {idVerificationResult.idSequenceNumber}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    DHA Live Access
                                  </span>
                                  {getBooleanIcon(
                                    idVerificationResult.canAccessDhaLive
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="flex justify-center pt-4">
                            <Button
                              onClick={() => {
                                setIdVerificationResult(null);
                                setIdVerificationError(null);
                              }}
                              variant="outline"
                            >
                              Run New Verification
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Separator />
          </>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              ID Number
            </p>
            <p className="text-sm">
              {application.id_number_decrypted || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Email Address
            </p>
            <p className="text-sm">
              {application.profile?.email || application.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </p>
            <p className="text-sm">{formatDate(application.date_of_birth)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <p className="text-sm">
              {application.gender || application.gender_other || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Marital Status
            </p>
            <p className="text-sm">{application.marital_status || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nationality
            </p>
            <p className="text-sm">{application.nationality || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Language
            </p>
            <p className="text-sm">{application.language || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Dependants
            </p>
            <p className="text-sm">{application.dependants || "N/A"}</p>
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Home Address
          </p>
          <p className="text-sm">{application.home_address || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">City</p>
          <p className="text-sm">{application.city || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Postal Code
          </p>
          <p className="text-sm">{application.postal_code || "N/A"}</p>
        </div>

        {/* Cellphone Information and Verification */}
        {application.profile?.phone_number && (
          <>
            <Separator />
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Phone Number
                  </p>
                  <p className="text-lg font-semibold text-blue-800">
                    {application.profile.phone_number}
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Verify Cellphone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <Phone className="h-5 w-5 mr-2" />
                        Cellphone Verification
                      </DialogTitle>
                      <DialogDescription>
                        Verify the cellphone number against identity records
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {!verificationResult && !verificationError && (
                        <div className="text-center py-4">
                          <Button
                            onClick={handleCellphoneVerification}
                            disabled={isVerifying}
                            className="w-full"
                          >
                            {isVerifying ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Start Verification
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {verificationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-red-800 font-medium">
                              Verification Failed
                            </p>
                          </div>
                          <p className="text-red-600 text-sm mt-1">
                            {verificationError}
                          </p>
                          <Button
                            onClick={handleCellphoneVerification}
                            disabled={isVerifying}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            Retry Verification
                          </Button>
                        </div>
                      )}

                      {verificationResult && (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <p className="text-green-800 font-medium">
                                Verification Complete
                              </p>
                            </div>
                            <p className="text-green-600 text-sm">
                              Cellphone verification has been processed
                              successfully
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Phone Number Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    ID Number
                                  </span>
                                  <span className="text-xs font-mono">
                                    {verificationResult.idNumberProvided}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Phone Number
                                  </span>
                                  <span className="text-xs font-mono">
                                    {verificationResult.phoneNumberProvided}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Type
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {verificationResult.phoneNumberType}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                  Verification Status
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Match Status
                                  </span>
                                  {getStatusIcon(verificationResult.isMatch)}
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Match Result
                                  </span>
                                  <Badge
                                    variant={
                                      verificationResult.isMatch
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {verificationResult.isMatch
                                      ? "Match"
                                      : "No Match"}
                                  </Badge>
                                </div>
                                {verificationResult.score !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Score
                                    </span>
                                    <span
                                      className={`text-xs font-bold ${getScoreColor(
                                        verificationResult.score
                                      )}`}
                                    >
                                      {verificationResult.score}%
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          <div className="flex justify-center pt-4">
                            <Button
                              onClick={() => {
                                setVerificationResult(null);
                                setVerificationError(null);
                              }}
                              variant="outline"
                            >
                              Run New Verification
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
