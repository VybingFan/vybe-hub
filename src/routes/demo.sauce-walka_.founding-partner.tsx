import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/demo/sauce-walka_/founding-partner")({
  beforeLoad: () => {
    throw redirect({ to: "/demo/founding-partner" });
  },
  component: () => null,
});