import type { PlayGameType, PlayPackItemDraft } from "@/services/play/playGamePackService";

type StarterItem = Omit<PlayPackItemDraft, "id" | "game_pack_id" | "position">;

export interface PlayStarterPack {
  pack_key: string;
  game_type: PlayGameType;
  title: string;
  description: string;
  genre: string;
  items: StarterItem[];
}

const foundationsSource = "AI OVERVIEW OF HIP HOP 2.pdf - uploaded VYBE research";
const genresSource = "22 Rap Genres That Defined the 50 Year Evolution of Rhyme and Beat - LANDR";
const genresUrl = "https://blog.landr.com/rap-styles/";
const verification =
  "Prepared from the uploaded VYBE research set; complete final editorial fact-check before approval.";

function choice(
  key: string,
  title: string,
  prompt: string,
  choices: string[],
  answer: string,
  explanation: string,
  sourceTitle = foundationsSource,
  sourceUrl: string | null = null,
): StarterItem {
  return {
    content_key: key,
    title,
    prompt,
    payload: { choices, answer },
    explanation,
    difficulty: "easy",
    rights_status: "not_required",
    source_title: sourceTitle,
    source_url: sourceUrl,
    verification_notes: verification,
    discovery_url: null,
  };
}

export const HIP_HOP_STARTER_PACKS: PlayStarterPack[] = [
  {
    pack_key: "hip-hop-foundations-beat-blitz-01",
    game_type: "beat_blitz",
    title: "Hip-Hop Foundations: Beat Blitz",
    description:
      "An eight-question starter round covering the culture's origins, tools, pillars, and early milestones.",
    genre: "Hip-Hop & Rap",
    items: [
      choice(
        "hh-foundations-01",
        "Birthplace",
        "Which New York City borough is widely recognized as hip-hop's birthplace?",
        ["The Bronx", "Queens", "Brooklyn", "Manhattan"],
        "The Bronx",
        "Hip-hop developed through Bronx block-party culture in the early 1970s.",
      ),
      choice(
        "hh-foundations-02",
        "The break",
        "What part of a record did early DJs extend for dancers?",
        ["The instrumental break", "The final chorus", "The spoken intro", "The fade-out"],
        "The instrumental break",
        "DJs used two turntables to extend the percussion-heavy break.",
      ),
      choice(
        "hh-foundations-03",
        "Four pillars",
        "Which activity is one of hip-hop culture's four commonly cited pillars?",
        ["Breaking", "Opera", "Ballet", "Orchestral conducting"],
        "Breaking",
        "Breaking joins DJing, MCing, and graffiti among the four commonly cited pillars.",
      ),
      choice(
        "hh-foundations-04",
        "Early mainstream record",
        "Which 1979 recording helped introduce rap to a broad commercial audience?",
        ["Rapper's Delight", "The Message", "Walk This Way", "Planet Rock"],
        "Rapper's Delight",
        "The Sugarhill Gang's 1979 recording became an early commercial breakthrough.",
      ),
      choice(
        "hh-foundations-05",
        "DJ technique",
        "Why did early hip-hop DJs use two copies of the same record?",
        ["To extend a break", "To raise the pitch", "To add vocals", "To shorten the song"],
        "To extend a break",
        "Alternating between matching records let DJs keep a favored break going.",
      ),
      choice(
        "hh-foundations-06",
        "MC role",
        "What did MCing develop into as hip-hop evolved?",
        ["Rapping", "Lighting design", "Ticketing", "Album mastering"],
        "Rapping",
        "The MC's rhythmic spoken performance developed into rap.",
      ),
      choice(
        "hh-foundations-07",
        "Foundational machine",
        "Which drum machine became especially influential in hip-hop production?",
        ["Roland TR-808", "Fender Rhodes", "Mellotron", "Theremin"],
        "Roland TR-808",
        "The TR-808's distinctive programmed drums and low end became foundational across hip-hop styles.",
      ),
      choice(
        "hh-foundations-08",
        "First rap Grammy",
        "Who received the first Grammy for Best Rap Performance in 1989?",
        ["DJ Jazzy Jeff & The Fresh Prince", "Run-D.M.C.", "Public Enemy", "Salt-N-Pepa"],
        "DJ Jazzy Jeff & The Fresh Prince",
        "The duo received the first award in that Grammy category.",
      ),
    ],
  },
  {
    pack_key: "hip-hop-subgenres-hidden-gems-01",
    game_type: "hidden_gems",
    title: "Hidden Gems: Name That Rap Style",
    description: "Use production and regional clues to identify influential rap styles.",
    genre: "Hip-Hop & Rap",
    items: [
      choice(
        "hh-genres-01",
        "Old school clue",
        "This early style is associated with turntablism, simple rhyme schemes, and early sampling. What is it?",
        ["Old school", "Drill", "Cloud rap", "Trap"],
        "Old school",
        "Old-school hip-hop commonly refers to foundational late-1970s through 1980s approaches.",
        genresSource,
        genresUrl,
      ),
      choice(
        "hh-genres-02",
        "Boom-bap clue",
        "Strong kick-and-snare patterns and sample-centered beat making point to which style?",
        ["Boom-bap", "Crunk", "Emo rap", "Grime"],
        "Boom-bap",
        "The style's name echoes its prominent kick and snare sound.",
        genresSource,
        genresUrl,
      ),
      choice(
        "hh-genres-03",
        "Jazz rap clue",
        "Which style pairs rap with jazz-influenced samples, harmony, or instrumentation?",
        ["Jazz rap", "Drill", "Bounce", "Horrorcore"],
        "Jazz rap",
        "Jazz rap draws musical language and source material from jazz.",
        genresSource,
        genresUrl,
      ),
      choice(
        "hh-genres-04",
        "Trap clue",
        "Rapid hi-hats, heavy low end, and programmed drums are strongly associated with which style?",
        ["Trap", "Old school", "Conscious rap", "Rap rock"],
        "Trap",
        "Trap production is widely recognized for rolling hi-hats, 808 bass, and programmed percussion.",
        genresSource,
        genresUrl,
      ),
      choice(
        "hh-genres-05",
        "Rap rock clue",
        "Which hybrid style puts rap delivery together with prominent rock instrumentation?",
        ["Rap rock", "Cloud rap", "G-funk", "Bounce"],
        "Rap rock",
        "Rap rock combines hip-hop vocals or rhythms with rock's instrumental language.",
        genresSource,
        genresUrl,
      ),
      choice(
        "hh-genres-06",
        "Drill clue",
        "A dark, tense production style that developed in Chicago and later took distinct forms elsewhere is called what?",
        ["Drill", "Boom-bap", "Jazz rap", "Old school"],
        "Drill",
        "Drill originated in Chicago before developing major regional variants.",
        genresSource,
        genresUrl,
      ),
    ],
  },
  {
    pack_key: "hip-hop-foundations-vybe-match-01",
    game_type: "vybe_match",
    title: "VYBE Match: Hip-Hop Foundations",
    description:
      "Match foundational people, tools, places, and practices with their roles in the culture.",
    genre: "Hip-Hop & Rap",
    items: [
      {
        content_key: "hh-match-foundations-01",
        title: "Foundation matches",
        prompt: "Match each hip-hop foundation with the correct description.",
        payload: {
          matches: [
            { left: "DJ Kool Herc", right: "Extended instrumental breaks at Bronx parties" },
            { left: "MCing", right: "Rhythmic spoken performance" },
            { left: "Breaking", right: "Dance expression built around the beat" },
            { left: "Graffiti", right: "Visual expression in public space" },
            { left: "Two turntables", right: "Tool for extending and mixing breaks" },
            { left: "Roland TR-808", right: "Influential programmable drum machine" },
          ],
        },
        explanation:
          "These people, practices, and tools are central to common accounts of hip-hop's foundations.",
        difficulty: "easy",
        rights_status: "not_required",
        source_title: foundationsSource,
        source_url: null,
        verification_notes: verification,
        discovery_url: null,
      },
    ],
  },
];
