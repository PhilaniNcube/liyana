import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "date-fns";
import { PolicyWithAllData } from "@/lib/queries/policy-details";

import VerifyIdDialog from "./verify-id";
import SendOtvDialog from "./send-otv";
import { Button } from "@/components/ui/button";
import { CheckCheckIcon, ShieldCheck, Mail } from "lucide-react";
import { CellphoneVerificationDialog } from "./cellphone-verification-dialog";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";

interface PersonalInfoTabProps {
  policy: PolicyWithAllData;
}

export default function PersonalInfoTab({ policy }: PersonalInfoTabProps) {
  const holder = policy.policy_holder;
  const holderName =
    holder?.organization_name ||
    [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");

  if (!holder) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No policy holder information available.
          </div>
        </CardContent>
      </Card>
    );
  }

  const email = (holder?.contact_details as any)?.email;

  return (
    <Card>
      <CardHeader className="">
        <div className="flex items-center justify-between bg-yellow-200 p-4 rounded-md">
          <CardTitle className="text-2xl">Personal Information</CardTitle>
          <div className="flex items-center gap-2">
            {holder.id_number && <VerifyIdDialog idNumber={holder.id_number} />}
            {(() => {
              const decryptedIdNumber = holder.decrypted_id_number || "";
              let cellNumber = "";
              if (
                holder.contact_details &&
                typeof holder.contact_details === "object" &&
                !Array.isArray(holder.contact_details)
              ) {
                cellNumber = (holder.contact_details as any).phone || "";
              }
              if (decryptedIdNumber && cellNumber) {
                return (
                  <div className="flex items-center gap-2">
                    <SendOtvDialog
                      policyId={policy.id}
                      decryptedIdNumber={decryptedIdNumber}
                      cellNumber={cellNumber}
                    />
                    <Button className="bg-white text-black" size="sm">
                      <ShieldCheck className="h-4 w-4" />
                      Check OTV Results
                    </Button>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Basic Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Full Name</div>
              <div className="font-medium">{holderName || "—"}</div>
            </div>
            {holder.date_of_birth && (
              <div>
                <div className="text-xs text-muted-foreground">
                  Date of Birth
                </div>
                <div>{formatDate(holder.date_of_birth, "PP")}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Party Type</div>
              <div className="capitalize">{holder.party_type || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ID Number</div>
              <div className="">{holder.decrypted_id_number || "—"}</div>
            </div>
          </div>

          {/* Contact Information */}
          {holder.contact_details && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Contact Information
                </h4>
                {(holder.contact_details as any)?.email && (
                  <div className="my-3">
                    <div className="flex items-center justify-between bg-yellow-200 p-2 rounded-md">
                      <div className="text-muted-foreground">
                        <p className="font-medium">Email</p>
                        <span className="font-medium">
                          {(holder.contact_details as any).email}
                        </span>
                      </div>

                      <EmailVerificationDialog
                        email={(holder.contact_details as any).email}
                        idNumber={holder.decrypted_id_number || ""}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-4 w-4" /> Verify Email
                        </Button>
                      </EmailVerificationDialog>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1  gap-4">
                  {(holder.contact_details as any)?.phone && (
                    <div>
                      <div className="flex items-center justify-between bg-yellow-200 p-2 rounded-md">
                        <div>
                          <p className="font-medium text-lg text-muted-foreground">
                            Phone
                          </p>
                          <span>{(holder.contact_details as any).phone}</span>
                        </div>
                        <CellphoneVerificationDialog
                          policyId={policy.id}
                          phone={(holder.contact_details as any).phone}
                          idNumber={holder.decrypted_id_number || ""}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Address Information */}
          {holder.address_details && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(holder.address_details as any)?.physical && (
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Physical Address
                      </div>
                      <div>{(holder.address_details as any).physical}</div>
                    </div>
                  )}
                  {(holder.address_details as any)?.city && (
                    <div>
                      <div className="text-xs text-muted-foreground">City</div>
                      <div>{(holder.address_details as any).city}</div>
                    </div>
                  )}
                  {(holder.address_details as any)?.postal_code && (
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Postal Code
                      </div>
                      <div>{(holder.address_details as any).postal_code}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
