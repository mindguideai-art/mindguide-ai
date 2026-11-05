import { LegalDoc } from "@/components/legal-doc";

export const metadata = { title: "Terms of Use" };

export default function Terms() {
  return <LegalDoc file="terms.html" title="Terms of Use" summary="Rules governing access to and use of the MindGuide AI Platform." />;
}
