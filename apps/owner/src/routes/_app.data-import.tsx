import { createFileRoute } from "@tanstack/react-router";
import { ScaffoldPage } from "@/components/scaffold-page";
import { useBusinessData } from "@/lib/business-context";

export const Route = createFileRoute("/_app/data-import")({
  head: () => ({
    meta: [
      { title: "Data Import — Bizora AI" },
      { name: "description", content: "Connect data sources and upload historical records." },
    ],
  }),
  component: DataImportPage,
});

function DataImportPage() {
  const { transactions, products, customers } = useBusinessData();
  const totalIngested = transactions.length + products.length + customers.length;

  return (
    <ScaffoldPage
      title="Data Import"
      subtitle="Connect POS, ERP, HR, and utility providers or upload historical data."
      sections={[
        {
          title: "Connected Sources",
          desc: "Live Integrations",
          rows: [
            { label: "POS · GoFrugal", v: "Not Connected" },
            { label: "ERP · Tally Prime", v: "Not Connected" },
            { label: "HR · Zoho People", v: "Not Connected" },
            { label: "MSEDCL", v: "Not Connected" },
          ],
        },
        {
          title: "Upload Data",
          desc: "CSV / XLSX",
          rows: [
            { label: "Sales history", v: "Upload" },
            { label: "Product master", v: "Upload" },
            { label: "Customer list", v: "Upload" },
          ],
        },
        {
          title: "Sync Status",
          desc: "Database Ingestion Summary",
          rows: [
            { label: "Successful syncs", v: totalIngested > 0 ? "1" : "0" },
            { label: "Failed syncs", v: "0" },
            { label: "Records ingested", v: totalIngested.toLocaleString("en-IN") },
          ],
        },
      ]}
    />
  );
}
