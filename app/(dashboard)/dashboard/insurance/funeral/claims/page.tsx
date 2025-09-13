import { getAllClaims } from "@/lib/queries/claims";
import { ClaimsPageClient } from "./_components/claims-page-client";

const ClaimsPage = async () => {
  const claims = await getAllClaims();
  return <ClaimsPageClient initialClaims={claims} />;
};

export default ClaimsPage;
