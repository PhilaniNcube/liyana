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
import { User, Phone, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { WhoYouCellphoneVerificationDetail } from "@/lib/schemas";

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

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
              <p className="text-sm font-medium text-blue-900">
                Applicant Name
              </p>
              <p className="text-lg font-semibold text-blue-800">
                {application.profile.full_name || "Name not provided"}
              </p>
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
                                    Number
                                  </span>
                                  <span className="text-xs font-mono">
                                    {verificationResult.phoneNumber}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Type
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {verificationResult.numberType}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Carrier
                                  </span>
                                  <span className="text-xs">
                                    {verificationResult.carrier}
                                  </span>
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
                                    Valid
                                  </span>
                                  {getStatusIcon(verificationResult.isValid)}
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Status
                                  </span>
                                  <Badge
                                    variant={
                                      verificationResult.status === "Completed"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {verificationResult.status}
                                  </Badge>
                                </div>
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
                              </CardContent>
                            </Card>
                          </div>

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
                                  {verificationResult.id}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Company ID
                                </span>
                                <span className="text-xs font-mono">
                                  {verificationResult.companyId}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Date
                                </span>
                                <span className="text-xs">
                                  {new Date(
                                    verificationResult.datestamp
                                  ).toLocaleDateString("en-ZA", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

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
