"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  UserCheck,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";

type WhoYouCellphoneVerificationDetail = {
  idNumberProvided: string;
  phoneNumberProvided: string;
  isMatch: boolean;
  score: number | null;
  phoneNumberType: string;
};

export interface WhoYouCellphoneVerificationResultsProps {
  data:
    | { code: number; detail?: WhoYouCellphoneVerificationDetail }
    | null
    | undefined;
}

export default function WhoYouCellphoneVerificationResults({
  data,
}: WhoYouCellphoneVerificationResultsProps) {
  if (!data?.detail) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            Cellphone Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No cellphone verification data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { detail } = data;
  const isValid = data.code === 0;
  const isMatchResult = detail.isMatch;

  const getMatchIcon = () => {
    if (isMatchResult) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getMatchBadge = () => {
    if (isMatchResult) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Match
        </Badge>
      );
    } else {
      return <Badge variant="destructive">No Match</Badge>;
    }
  };

  const getScoreColor = () => {
    if (!detail.score) return "text-gray-500";
    if (detail.score >= 80) return "text-green-600";
    if (detail.score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = () => {
    if (!detail.score) return <Badge variant="secondary">N/A</Badge>;
    if (detail.score >= 80)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          High
        </Badge>
      );
    if (detail.score >= 60)
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Medium
        </Badge>
      );
    return <Badge variant="destructive">Low</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Cellphone Verification</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "SUCCESS" : "FAILED"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Status */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getMatchIcon()}
              <span className="text-sm font-medium">Match Status</span>
            </div>
            {getMatchBadge()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Phone number verification against ID number
          </p>
        </div>

        {/* Verification Score */}
        {detail.score !== null && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Verification Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor()}`}>
                  {detail.score}
                </span>
                {getScoreBadge()}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  detail.score >= 80
                    ? "bg-green-600"
                    : detail.score >= 60
                      ? "bg-yellow-600"
                      : "bg-red-600"
                }`}
                style={{
                  width: `${Math.min(detail.score, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        <Separator />

        {/* Verification Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                ID Number Provided
              </p>
              <p className="text-sm">{detail.idNumberProvided}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phone Number Provided
              </p>
              <p className="text-sm">{detail.phoneNumberProvided}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phone Number Type
              </p>
              <Badge variant="outline" className="">
                {detail.phoneNumberType}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Response Code
              </p>
              <Badge
                variant={data.code === 0 ? "default" : "destructive"}
                className=""
              >
                {data.code}
              </Badge>
            </div>
          </div>
        </div>

        {/* Summary Information */}
        <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">
              Verification Summary
            </p>
          </div>
          <p className="text-sm text-blue-700">
            {isMatchResult
              ? `The phone number ${detail.phoneNumberProvided} successfully matches the provided ID number with a confidence score of ${detail.score || "N/A"}.`
              : `The phone number ${detail.phoneNumberProvided} does not match the provided ID number.`}
          </p>
          {detail.phoneNumberType && (
            <p className="text-xs text-blue-600 mt-1">
              Phone type: {detail.phoneNumberType}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
