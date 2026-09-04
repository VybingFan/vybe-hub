import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav } from "@/components/layout/MarketingNav";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "The VYBE Blog | Creators, Entertainment & VYBE News" },
      { name: "description", content: "Read creator stories, entertainment features, VYBE updates and editorial from The VYBE Blog." },
    ],
    links: [{ rel: "canonical", href: "https://vybewithvybe.com/blog" }],
  }),
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
