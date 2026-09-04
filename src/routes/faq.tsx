import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "VYBE FAQ | Supporters, Creators & Businesses" },
      { name: "description", content: "Answers about VYBE for supporters, creators and businesses, including discovery, My VYBE, Find It Again, creator accounts, rights and more." },
    ],
    links: [{ rel: "canonical", href: "https://vybewithvybe.com/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <InformationPage
      eyebrow="Frequently Asked Questions"
      title="Questions about discovering, following, creating, and connecting on VYBE."
      description="Start here for straightforward answers about the VYBE experience. Features continue to grow, so some experiences described below are available now while others are being expanded as VYBE develops."
      sections={[
        {
          title: "What is VYBE?",
          body: "VYBE is a creator-centered entertainment discovery and connection platform. It gives supporters a place to discover creators, keep up with what they are doing, enjoy their work, and reach the other places they create and share. For creators, VYBE can serve as a home base that brings more of their world together.",
        },
        {
          title: "Who is VYBE for?",
          body: "VYBE is for supporters who want a more intentional way to discover and keep up with creators, and for creators at every stage—from emerging talent to established creators with audiences spread across multiple platforms. VYBE is expanding across music, film and video, acting and performance, writing and poetry, comedy, and other entertainment-focused creative work.",
        },
        {
          title: "Is VYBE another social media platform?",
          body: "VYBE has social and community features, but it is not designed simply to recreate a fast-moving social feed. Its purpose is to help supporters intentionally return to creators, understand more of what they do, and move between their VYBE content and the other destinations that make up their creative world.",
        },
        {
          title: "Does VYBE replace a creator's social media, website, streaming pages, or store?",
          body: "No. Creators can keep using the platforms and services that already work for them. VYBE is designed to help connect those pieces so supporters have a central place to understand what a creator is doing and then go directly to their social media, website, music, videos, tickets, store, and other destinations.",
        },
        {
          title: "Why would an established creator use VYBE?",
          body: "An established creator may already have supporters across social networks, streaming services, video platforms, ticketing sites, stores, and a personal website. VYBE can provide a central entertainment home where those supporters can keep up with the bigger picture instead of depending on one platform or one feed to surface every important update.",
        },
        {
          title: "Can I explore VYBE without creating an account?",
          body: "Yes. Public creator pages, discovery areas, shared public content, and other public experiences can be explored without registering where they have been made publicly available. An account becomes more important when you want a personal VYBE experience such as following, saving, participating, and returning to activity connected to you.",
        },
        {
          title: "What do I get by joining as a supporter?",
          body: "A supporter account is designed to turn discovery into an ongoing connection. You can follow creators, build your own My VYBE experience, interact where participation is available, save supported content and experiences, and more easily return to creators and activity that matter to you.",
        },
        {
          title: "How do I discover creators?",
          body: "Use VYBE's discovery experiences to explore creators and entertainment, including music and other creator focuses as they grow. Public creator pages are designed to help you move from discovering someone to exploring more of that creator's work, updates, links, and world.",
        },
        {
          title: "What is My VYBE?",
          body: "My VYBE is the personal supporter experience. It is intended to give members a place to return to creators they follow, updates and activity from those creators, saved experiences, communities, and other things they want to keep within reach.",
        },
        {
          title: "What is Find It Again?",
          body: "Find It Again is a developing VYBE capability intended to help supporters rediscover something they remember a creator sharing. As creator posts and organized links grow on VYBE, creators can give supporters another path back to important announcements, releases, appearances, stories, moments, and original posts around the web.",
        },
        {
          title: "Can creators use VYBE if they already post somewhere else?",
          body: "Yes. That is an important part of the idea. A creator does not have to stop posting elsewhere. VYBE can help organize the larger creator experience and point supporters back to the creator's existing destinations while also supporting VYBE-native content and experiences.",
        },
        {
          title: "Who can become a creator on VYBE?",
          body: "VYBE is being built for entertainment creators at different stages and across multiple creative focuses. Music is currently the most developed creator experience, with film and video, performance, writing and poetry, comedy, and additional entertainment creator experiences continuing to develop.",
        },
        {
          title: "Can a supporter become a creator?",
          body: "Yes. A supporter can begin the creator setup process and add a creator experience to their VYBE account. VYBE is designed around identities so someone who creates can still participate in the supporter experience rather than needing an entirely unrelated account for every way they use VYBE.",
        },
        {
          title: "What can creators share on VYBE?",
          body: "What a creator can publish depends on their creative focus, membership, and the features currently available. VYBE is designed to bring together work such as music, video, writing, creator updates and stories, playlists or collections, events and appearances, merchandise, communities, and links to important destinations around the web.",
        },
        {
          title: "How does VYBE handle creator rights and uploaded work?",
          body: "Creators are expected to upload or share work they have the rights or permissions to use. VYBE includes creator rights acknowledgements and upload declarations, and eligible audio may enter VYBE's rights-processing and fingerprinting workflow. A potential audio match is a signal for review and does not by itself prove ownership or infringement.",
        },
        {
          title: "Can businesses participate in VYBE?",
          body: "Yes. Businesses and advertising partners have a separate VYBE path so business participation can develop without turning the supporter experience into a business directory. Business and advertising information is provided through VYBE's dedicated business experience.",
        },
        {
          title: "Where can I learn more or get help?",
          body: "Visit About VYBE for the bigger picture of what VYBE is and why it exists. Use the Help Center for product guidance, and visit Trust, Copyright, Community Guidelines, Privacy, or Terms when you need policy or safety information.",
        },
      ]}
    />
  );
}
