import { createFileRoute } from "@tanstack/react-router";
import { LogisticsPage } from "apps/owner/src/routes/_app.logistics";

export const Route = createFileRoute("/_app/logistics")({
  head: () => ({
    meta: [
      { title: "Logistics & Dispatches — OmniMind AI" },
      { name: "description", content: "Outgoing customer delivery dispatch tracking operations." },
    ],
  }),
  component: LogisticsPage,
});
