import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav } from "@/components/layout/MarketingNav";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <>
      <MarketingNav />
      <Outlet />
    </>
  );
}
