import React from "react";
import { notFound } from "next/navigation";
import { getPolicyBeneficiaries } from "../../../../../../lib/queries/policies";
import CopyableText from "./copyable-text";

type Beneficiary = {
  id: number;
  relation_type: string | null;
  allocation_percentage: number | null;
  beneficiary_party_id: string;
  party?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    contact_details: { phone?: string | null; email?: string | null } | null;
  } | null;
  id_number?: string | null; // decrypted in query layer
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatName(party: Beneficiary["party"]) {
  if (!party) return "Unknown";
  const parts = [party.first_name ?? "", party.last_name ?? ""].filter(Boolean);
  return parts.length ? parts.join(" ") : "Unknown";
}

function formatRelationship(rel: string | null | undefined) {
  if (!rel) return "—";
  return rel.charAt(0).toUpperCase() + rel.slice(1).replace(/_/g, " ");
}

export default async function PolicyBeneficiaries({
  policyId,
}: {
  policyId: number;
}) {
  const beneficiaries = (await getPolicyBeneficiaries(policyId)) as
    | Beneficiary[]
    | null;

  if (!beneficiaries) return notFound();
  if (beneficiaries.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        No beneficiaries found for this policy.
      </div>
    );
  }

  const totalAllocation = beneficiaries.reduce(
    (sum, b) =>
      sum +
      (Number.isFinite(b.allocation_percentage as number)
        ? (b.allocation_percentage as number)
        : 0),
    0
  );

  const hasPayoutAllocations = totalAllocation > 0;
  const allocationWarning = hasPayoutAllocations && totalAllocation !== 100;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Policy Beneficiaries</h2>
        <div className="text-sm text-muted-foreground">
          {beneficiaries.length}{" "}
          {beneficiaries.length === 1 ? "person" : "people"}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="text-sm">
            {hasPayoutAllocations ? (
              <span>
                Total payout allocation:{" "}
                <span className="font-medium">{totalAllocation}%</span>
              </span>
            ) : (
              <span>
                This policy lists covered people (no payout allocations).
              </span>
            )}
          </div>
          {allocationWarning && (
            <div className="text-xs text-amber-600">
              Warning: allocations should total 100%.
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">ID Number</th>
                <th className="px-4 py-2 font-medium">Relationship</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Allocation</th>
                <th className="px-4 py-2 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((b, idx) => {
                const name = formatName(b.party);
                const idNum = b.id_number ?? "—";
                const rel = formatRelationship(b.relation_type);
                const allocation = Number.isFinite(
                  b.allocation_percentage as number
                )
                  ? `${b.allocation_percentage}%`
                  : "—";
                const isCovered = (b.allocation_percentage ?? 0) === 0;
                const typeLabel = isCovered
                  ? "Covered person"
                  : "Payout beneficiary";
                const phone = b.party?.contact_details?.phone ?? null;
                const email = b.party?.contact_details?.email ?? null;
                const key = b.id ?? `${b.beneficiary_party_id}-${idx}`;

                return (
                  <tr key={key} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n.charAt(0).toUpperCase())
                            .join("") || "?"}
                        </div>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">
                            Party ID: {b.beneficiary_party_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {idNum !== "—" ? (
                        <CopyableText text={idNum} title="Copy ID number" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{rel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={classNames(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                          isCovered
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {typeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">{allocation}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {phone ? (
                          <a href={`tel:${phone}`} className="hover:underline">
                            {phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            No phone
                          </span>
                        )}
                        {email ? (
                          <a
                            href={`mailto:${email}`}
                            className="hover:underline"
                          >
                            {email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            No email
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
