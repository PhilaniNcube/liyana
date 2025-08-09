"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IdCard, User2, CalendarClock, ShieldCheck } from "lucide-react";

type WhoYouIdDetail = {
  id: string;
  onNPR: boolean;
  photo?: string; // base64 JPEG
  gender?: string;
  status?: string;
  isCache?: boolean;
  onHANIS?: boolean;
  surname?: string;
  hasPhoto?: boolean;
  idNumber: string;
  dataSource?: string;
  firstNames?: string;
  dateOfBirth?: string; // ISO string
  dateOfDeath?: string;
  idIssueDate?: string;
  datePerformed?: string; // ISO string
  deadIndicator?: boolean;
  maritalStatus?: string;
  dateOfMarriage?: string;
  idNumberBlocked?: boolean;
  smartCardIssued?: boolean;
  canAccessDhaLive?: boolean;
  idSequenceNumber?: string;
  birthPlaceCountryCode?: string;
};

export interface WhoYouIdVerificationResultsProps {
  data: { code: number; detail?: WhoYouIdDetail } | null | undefined;
}

function formatDate(value?: string) {
  if (!value) return "—";
  // Handle YYYYMMDD (idIssueDate) or ISO
  if (/^\d{8}$/.test(value)) {
    const y = value.slice(0, 4);
    const m = value.slice(4, 6);
    const d = value.slice(6, 8);
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

export function WhoYouIdVerificationResults({
  data,
}: WhoYouIdVerificationResultsProps) {
  if (!data?.detail) return null;
  const d = data.detail;

  const fullName = [d.firstNames, d.surname].filter(Boolean).join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          WHOYou ID Verification
          {typeof data.code === "number" && (
            <Badge
              variant={data.code === 0 ? "default" : "destructive"}
              className="ml-2"
            >
              Code: {data.code}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Photo */}
          <div className="md:col-span-1 flex flex-col items-center gap-3">
            {d.photo ? (
              <img
                src={`data:image/jpeg;base64,${d.photo}`}
                alt="ID Photo"
                className="w-full max-w-[260px] rounded border"
              />
            ) : (
              <div className="w-full max-w-[260px] aspect-[3/4] rounded border flex items-center justify-center text-muted-foreground">
                No Photo
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {d.status && <Badge>{d.status}</Badge>}
              {d.gender && <Badge variant="outline">{d.gender}</Badge>}
              {d.onNPR && <Badge variant="secondary">On NPR</Badge>}
              {d.onHANIS && <Badge variant="secondary">On HANIS</Badge>}
              {d.smartCardIssued && (
                <Badge variant="secondary">Smart Card</Badge>
              )}
              {d.deadIndicator && <Badge variant="destructive">Deceased</Badge>}
              {d.idNumberBlocked && (
                <Badge variant="destructive">ID Blocked</Badge>
              )}
              {d.isCache && <Badge variant="outline">Cache</Badge>}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <User2 className="h-4 w-4" />
                {fullName || "Unknown Person"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">ID Number</div>
                  <div className="font-medium">{d.idNumber}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Data Source</div>
                  <div className="font-medium">{d.dataSource || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date of Birth</div>
                  <div className="font-medium">{formatDate(d.dateOfBirth)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date Performed</div>
                  <div className="font-medium">
                    {formatDate(d.datePerformed)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">ID Issue Date</div>
                  <div className="font-medium">{formatDate(d.idIssueDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Marital Status</div>
                  <div className="font-medium">{d.maritalStatus || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ID Seq #</div>
                  <div className="font-medium">{d.idSequenceNumber || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Birth Country</div>
                  <div className="font-medium">
                    {d.birthPlaceCountryCode || "—"}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                DHA Live Access:{" "}
                <span className="font-medium ml-1">
                  {d.canAccessDhaLive ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Date of Death:{" "}
                <span className="font-medium ml-1">
                  {d.dateOfDeath ? formatDate(d.dateOfDeath) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WhoYouIdVerificationResults;
