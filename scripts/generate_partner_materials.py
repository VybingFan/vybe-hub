from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "partner-materials"
OUTPUT.mkdir(parents=True, exist_ok=True)

PURPLE = colors.HexColor("#8B3DFF")
CYAN = colors.HexColor("#15D9FF")
INK = colors.HexColor("#171321")
MUTED = colors.HexColor("#625A70")
PALE = colors.HexColor("#F5F0FF")
LINE = colors.HexColor("#DED5EB")

styles = getSampleStyleSheet()
TITLE = ParagraphStyle(
    "Title",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=24,
    leading=29,
    textColor=INK,
    spaceAfter=10,
)
SUBTITLE = ParagraphStyle(
    "Subtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=11,
    leading=16,
    textColor=MUTED,
    spaceAfter=16,
)
H2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=PURPLE,
    spaceBefore=10,
    spaceAfter=6,
)
BODY = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=14,
    textColor=INK,
    spaceAfter=6,
)
SMALL = ParagraphStyle(
    "Small",
    parent=BODY,
    fontSize=8,
    leading=11,
    textColor=MUTED,
)
CALLOUT = ParagraphStyle(
    "Callout",
    parent=BODY,
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=16,
    textColor=INK,
    alignment=TA_CENTER,
)


def page(canvas, doc):
    canvas.saveState()
    width, height = LETTER
    canvas.setFillColor(INK)
    canvas.rect(0, height - 0.36 * inch, width, 0.36 * inch, fill=1, stroke=0)
    canvas.setFillColor(PURPLE)
    canvas.rect(0, height - 0.36 * inch, 2.5 * inch, 0.06 * inch, fill=1, stroke=0)
    canvas.setFillColor(CYAN)
    canvas.rect(2.5 * inch, height - 0.36 * inch, 1.3 * inch, 0.06 * inch, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(colors.white)
    canvas.drawString(0.55 * inch, height - 0.24 * inch, "VYBE | PARTNER MATERIALS")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.55 * inch, 0.35 * inch, "Where Music Becomes Community.")
    canvas.drawRightString(width - 0.55 * inch, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def field_table(rows):
    data = [[Paragraph(f"<b>{label}</b>", BODY), Paragraph(value, BODY)] for label, value in rows]
    table = Table(data, colWidths=[1.65 * inch, 5.1 * inch], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def build(filename, title, subtitle, sections, notice=None):
    path = OUTPUT / filename
    doc = BaseDocTemplate(
        str(path),
        pagesize=LETTER,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.58 * inch,
        title=title,
        author="VYBE",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates(PageTemplate(id="vybe", frames=[frame], onPage=page))
    story = [
        Spacer(1, 0.08 * inch),
        Paragraph(title, TITLE),
        Paragraph(subtitle, SUBTITLE),
    ]
    if notice:
        callout = Table([[Paragraph(notice, CALLOUT)]], colWidths=[doc.width])
        callout.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), PALE),
                    ("BOX", (0, 0), (-1, -1), 1, PURPLE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        story.extend([callout, Spacer(1, 8)])
    for heading, body in sections:
        story.append(Paragraph(heading, H2))
        if isinstance(body, list):
            for item in body:
                story.append(Paragraph(f"[ ] {item}", BODY))
        elif isinstance(body, tuple):
            story.append(field_table(body))
        else:
            story.append(Paragraph(body, BODY))
    doc.build(story)
    return path


documents = [
    (
        "01-vybe-founding-partner-one-sheet.pdf",
        "VYBE Founding Business Partner",
        "Partner early with a community-first creator platform.",
        [
            (
                "Why VYBE",
                "VYBE is building the place where relationships continue after discovery. "
                "Creators build communities, supporters participate, and businesses become visible partners.",
            ),
            (
                "Founding Business Preview",
                "A curated 60-day pilot with one active campaign, one spotlight opportunity, "
                "campaign planning support, and a verified activity report. The preview is currently free.",
            ),
            (
                "Founding Business Partner",
                "$499 for one year. Includes up to two active campaigns, two spotlight opportunities, "
                "one sponsored experience, partner profile visibility, and campaign reporting.",
            ),
            (
                "What early partners gain",
                [
                    "Early positioning before the VYBE business network becomes crowded.",
                    "Direct input into practical business and creator collaboration tools.",
                    "Clear sponsored disclosure, controlled approvals, and verified reporting.",
                    "Founding recognition while eligibility and partner standing remain active.",
                ],
            ),
            (
                "Important",
                "VYBE does not guarantee impressions, clicks, sales, creator acceptance, or audience size. "
                "Early campaigns are curated and supported manually while delivery automation expands.",
            ),
            ("Next step", "Complete the partner application and qualification review with VYBE."),
        ],
    ),
    (
        "02-partner-application-and-qualification.pdf",
        "Business Partner Application",
        "Information needed to qualify a VYBE business relationship.",
        [
            (
                "Business information",
                (
                    ("Legal / public name", "________________________________________________"),
                    ("Website / category", "________________________________________________"),
                    ("Primary contact", "________________________________________________"),
                    ("Email / phone / area", "________________________________________________"),
                ),
            ),
            (
                "Partnership goals",
                (
                    ("Objective / timing", "________________________________________________"),
                    ("Target community", "________________________________________________"),
                    ("Creator interests", "________________________________________________"),
                    ("Offer / budget", "________________________________________________"),
                ),
            ),
            (
                "Qualification review",
                [
                    "Business identity and contact information verified.",
                    "Offer is relevant, lawful, and appropriate for the VYBE community.",
                    "Campaign objective can be measured using currently available events.",
                    "Required assets, links, terms, creator choice, disclosure, and VYBE review accepted.",
                ],
            ),
            (
                "Decision",
                (
                    ("Status", "[ ] Approved  [ ] Needs information  [ ] Declined"),
                    ("Package", "[ ] Preview  [ ] Annual  [ ] Custom"),
                    ("Reviewed by / date", "________________________________________________"),
                    ("Internal notes", "________________________________________________"),
                ),
            ),
        ],
    ),
    (
        "03-founding-preview-terms-template.pdf",
        "Founding Business Preview Terms",
        "Working template for the free 60-day pilot.",
        [
            ("Preview period", "The preview begins on the approved start date and continues for 60 calendar days."),
            (
                "Included scope",
                "One active campaign, one spotlight opportunity, planning support, required sponsored disclosure, "
                "and a report using valid events recorded by VYBE.",
            ),
            (
                "Business responsibilities",
                [
                    "Provide accurate business, offer, audience, asset, and destination information.",
                    "Confirm rights to all submitted names, marks, copy, images, and other materials.",
                    "Maintain valid offer terms and promptly report changes.",
                    "Approve final campaign materials before delivery.",
                ],
            ),
            (
                "No performance guarantee",
                "The preview does not guarantee reach, impressions, clicks, conversions, sales, creator participation, "
                "or continued placement. VYBE may pause content for safety, accuracy, rights, or operational reasons.",
            ),
            (
                "Approval",
                (
                    ("Business", "________________________________________________"),
                    ("Authorized signer", "________________________________________________"),
                    ("Signature / date", "________________________________________________"),
                    ("VYBE representative", "________________________________________________"),
                ),
            ),
        ],
        "BUSINESS TEMPLATE - Final terms should be reviewed by qualified legal counsel before external use.",
    ),
    (
        "04-founding-annual-agreement-template.pdf",
        "Founding Business Partner Agreement",
        "Working template for the $499 annual partner package.",
        [
            (
                "Term and fee",
                "The package term is 365 days from the approved start date. The annual package fee is $499, "
                "subject to the final invoice and payment terms accepted by both parties.",
            ),
            (
                "Included scope",
                "Up to two active campaigns, two spotlight opportunities, one sponsored experience, partner profile "
                "visibility, planning support, approval controls, and verified campaign reporting.",
            ),
            (
                "Operating principles",
                [
                    "Creators retain the right to accept or decline collaboration opportunities.",
                    "Sponsored content must be clearly disclosed.",
                    "Only approved creative and active placements may be delivered.",
                    "Reported performance is limited to valid events recorded by VYBE.",
                    "Features under construction are identified in the current roadmap/status sheet.",
                ],
            ),
            (
                "No guaranteed performance",
                "VYBE does not guarantee audience size, placement volume, creator participation, impressions, clicks, "
                "conversions, sales, or other business outcomes.",
            ),
            (
                "Authorization",
                (
                    ("Business legal name", "________________________________________________"),
                    ("Authorized signer", "________________________________________________"),
                    ("Signature / date", "________________________________________________"),
                    ("VYBE representative", "________________________________________________"),
                ),
            ),
        ],
        "BUSINESS TEMPLATE - Final agreement, payment, cancellation, liability, privacy, and dispute terms require legal review.",
    ),
    (
        "05-campaign-brief-template.pdf",
        "VYBE Campaign Brief",
        "Define the purpose and boundaries before creative work begins.",
        [
            (
                "Campaign record",
                (
                    ("Business / campaign", "________________________________________________"),
                    ("Objective", "________________________________________________"),
                    ("Target audience", "________________________________________________"),
                    ("Genres / regions", "________________________________________________"),
                    ("Start / end", "________________________________________________"),
                    ("Offer / destination", "________________________________________________"),
                ),
            ),
            (
                "Message",
                (
                    ("Primary promise", "________________________________________________"),
                    ("Audience benefit", "________________________________________________"),
                    ("Call to action", "________________________________________________"),
                    ("Required disclosure", "Sponsored by a VYBE business partner."),
                ),
            ),
            (
                "Approval gates",
                [
                    "Business profile verified and package active.",
                    "Offer terms and destination tested.",
                    "Creative assets received and rights confirmed.",
                    "Targeting uses available, non-sensitive criteria.",
                    "Business and VYBE approve final creative.",
                    "Placement and tracking plan approved before launch.",
                ],
            ),
        ],
    ),
    (
        "06-campaign-asset-checklist.pdf",
        "Campaign Asset Checklist",
        "Collect complete, usable, and authorized campaign materials.",
        [
            (
                "Business assets",
                [
                    "Approved public business name and short description.",
                    "Logo with transparent background plus light/dark variants where available.",
                    "Campaign image or approved visual direction.",
                    "Destination URL, contact information, and service area.",
                    "Offer title, description, code, instructions, dates, limits, and terms.",
                ],
            ),
            (
                "Creative details",
                [
                    "Headline, supporting body, and call to action.",
                    "Selected format and intended VYBE surface.",
                    "Required legal, eligibility, or geographic restrictions.",
                    "Accessibility text or meaningful image description.",
                    "Written confirmation that the business controls submitted materials.",
                ],
            ),
            (
                "Final check",
                (
                    ("Assets received by", "________________________________________________"),
                    ("Missing items", "________________________________________________"),
                    ("Approved version", "________________________________________________"),
                    ("Approval date", "________________________________________________"),
                ),
            ),
        ],
    ),
    (
        "07-campaign-tracking-plan.pdf",
        "Campaign Tracking Plan",
        "Define what VYBE can verify before delivery begins.",
        [
            (
                "Campaign",
                (
                    ("Campaign ID / name", "________________________________________________"),
                    ("Placement surfaces", "________________________________________________"),
                    ("Reporting window", "________________________________________________"),
                    ("Destination URL", "________________________________________________"),
                    ("Offer code", "________________________________________________"),
                ),
            ),
            (
                "Valid measures",
                [
                    "Impression: an eligible placement render recorded by VYBE.",
                    "Click: an eligible call-to-action interaction recorded by VYBE.",
                    "Conversion: an approved business outcome sent through a connected, validated event source.",
                    "Offer claim: a VYBE member or session claims the recorded offer.",
                    "Verified redemption: the business or VYBE confirms an eligible claim.",
                ],
            ),
            (
                "Reconciliation rules",
                [
                    "Exclude internal tests, bots, invalid sessions, duplicates, and malformed events.",
                    "Do not report conversions until a validated source is connected.",
                    "Document time zone, attribution window, filters, and known limitations.",
                    "Admin totals and partner-facing totals must reconcile to valid event records.",
                ],
            ),
        ],
    ),
    (
        "08-campaign-report-template.pdf",
        "VYBE Campaign Report",
        "Verified activity, context, and recommended next actions.",
        [
            (
                "Campaign summary",
                (
                    ("Business / campaign", "________________________________________________"),
                    ("Reporting period", "________________________________________________"),
                    ("Objective", "________________________________________________"),
                    ("Placements delivered", "________________________________________________"),
                ),
            ),
            (
                "Verified totals",
                (
                    ("Valid impressions", "________________"),
                    ("Valid clicks", "________________"),
                    ("Click-through rate", "________________"),
                    ("Offer claims", "________________"),
                    ("Verified redemptions", "________________"),
                    ("Validated conversions", "________________ / Not connected"),
                ),
            ),
            (
                "Context and learning",
                (
                    ("What performed", "________________________________________________"),
                    ("What changed", "________________________________________________"),
                    ("Known limitations", "________________________________________________"),
                    ("Recommended next action", "________________________________________________"),
                ),
            ),
            ("Certification", "Prepared from valid VYBE event records. Unsupported predictions are not included."),
        ],
    ),
    (
        "09-case-study-approval.pdf",
        "Case Study Approval",
        "Permission to describe a completed VYBE partnership.",
        [
            (
                "Proposed use",
                [
                    "VYBE may identify the participating business by approved public name and logo.",
                    "Only approved campaign facts and verified activity totals may be published.",
                    "Confidential information, private contacts, and unsupported claims remain excluded.",
                    "The business may approve the final case-study draft before publication.",
                ],
            ),
            (
                "Permission",
                (
                    ("Business / campaign", "________________________________________________"),
                    ("Approved name", "________________________________________________"),
                    ("Approved logo use", "[ ] Yes  [ ] No"),
                    ("Approved quote", "________________________________________________"),
                    ("Approved metrics", "________________________________________________"),
                    ("Channels", "[ ] Website  [ ] Social  [ ] Sales materials  [ ] Press"),
                    ("Authorized signer / date", "________________________________________________"),
                ),
            ),
        ],
    ),
    (
        "10-partner-roadmap-and-feature-status.pdf",
        "Partner Roadmap and Feature Status",
        "A plain-language view of what is live, assisted, and under construction.",
        [
            (
                "Available now",
                [
                    "Business application, profile record, verification, and package assignment.",
                    "Business campaign, offer, creative, placement, and partner-document records.",
                    "Admin review, Work Queue notifications, audit records, and event-based totals.",
                    "Controlled Partner Center with document status, visibility, and expiration tracking.",
                ],
            ),
            (
                "Available with VYBE assistance",
                [
                    "Campaign planning, creative preparation, placement scheduling, and partner reporting.",
                    "Curated creator or community partnership exploration.",
                    "Controlled external document links while native file storage is being connected.",
                ],
            ),
            (
                "Under construction",
                [
                    "Business AI assistant for campaign concepts, creative drafting, and asset preparation.",
                    "Self-service business creative builder and submission workflow.",
                    "Automated delivery across approved VYBE surfaces.",
                    "Partner-facing analytics exports and AI explanations.",
                    "Validated external conversion integrations and broader creator matching.",
                ],
            ),
            (
                "Promise policy",
                "VYBE markets only the features and service levels currently deliverable. Planned capabilities are "
                "identified as under construction and receive no guaranteed release date until approved.",
            ),
        ],
    ),
    (
        "11-vybe-partner-brand-use-guide.pdf",
        "VYBE Partner Brand Use Guide",
        "Quick rules for respectful, consistent co-branded materials.",
        [
            (
                "Approved positioning",
                "Use community-first language such as Where Music Becomes Community, Own Your VYBE, "
                "and Platforms rent attention. VYBE builds relationships.",
            ),
            (
                "Visual direction",
                [
                    "Primary palette: near black, electric purple, neon blue, vibrant cyan, white, and supporting gray.",
                    "Use premium, minimal layouts with large typography, soft glows, waveforms, and chrome accents.",
                    "Preserve clear space around the VYBE mark and use only approved logo files.",
                    "Keep sponsored disclosures visible and readable.",
                ],
            ),
            (
                "Do not",
                [
                    "Alter, stretch, recolor, rotate, or rebuild the VYBE logo.",
                    "Imply endorsement beyond the approved partnership.",
                    "Use fear-based, negative, or competitor-attacking language.",
                    "Publish co-branded material before approval.",
                ],
            ),
            ("Approval contact", "Submit proposed co-branded materials through the VYBE Partner Center."),
        ],
    ),
]


for document in documents:
    build(*document)

print(f"Generated {len(documents)} partner PDFs in {OUTPUT}")
