import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // ALWAYS force user to login page first on bizora-admin
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
