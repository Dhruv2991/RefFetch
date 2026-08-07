"""
Builds a polished PDF report from structured content. Takes plain sections
(title + markdown-lite text) and renders them into a real, downloadable
PDF — used for full library reports, comparisons, memory answers, and
literature reviews.
"""

import io
import re

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

GOLD = HexColor("#B8862F")
INK = HexColor("#1A1A1A")
MUTED = HexColor("#5C5C5C")


def _md_inline_to_html(text: str) -> str:
    """Very small markdown-to-reportlab-html converter: bold, italics.
    Reportlab's Paragraph accepts a tiny HTML subset directly."""
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", text)
    return text


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ReportTitle", fontSize=22, leading=26, textColor=INK, spaceAfter=4, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle(name="ReportSubtitle", fontSize=10, textColor=MUTED, spaceAfter=18, fontName="Helvetica-Oblique"))
    styles.add(ParagraphStyle(name="SectionHeading", fontSize=14, leading=18, textColor=GOLD, spaceBefore=16, spaceAfter=8, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle(name="SubHeading", fontSize=11, leading=14, textColor=INK, spaceBefore=10, spaceAfter=4, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle(name="BodyText2", fontSize=10, leading=15, textColor=INK, spaceAfter=8, fontName="Helvetica"))
    styles.add(ParagraphStyle(name="BulletText", fontSize=10, leading=15, textColor=INK, spaceAfter=4, leftIndent=14, fontName="Helvetica"))
    return styles


def _render_markdown_lite(body: str, styles, story: list):
    """Handles the subset of markdown our AI outputs actually use:
    ## headings, **bold**, - bullets, and plain paragraphs."""
    for raw_line in body.split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("## "):
            story.append(Paragraph(_md_inline_to_html(line[3:]), styles["SubHeading"]))
        elif line.startswith("# "):
            story.append(Paragraph(_md_inline_to_html(line[2:]), styles["SectionHeading"]))
        elif line.startswith("- ") or line.startswith("* "):
            story.append(Paragraph(f"—  {_md_inline_to_html(line[2:])}", styles["BulletText"]))
        elif line.startswith("---"):
            story.append(Spacer(1, 6))
            story.append(HRFlowable(width="100%", color=HexColor("#DDDDDD"), thickness=0.5))
            story.append(Spacer(1, 6))
        else:
            story.append(Paragraph(_md_inline_to_html(line), styles["BodyText2"]))


def build_pdf_report(title: str, subtitle: str, sections: list[dict]) -> bytes:
    """
    sections: list of {"heading": str, "body": str (markdown-lite)}
    Returns raw PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=0.9 * inch,
        bottomMargin=0.9 * inch,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        title=title,
    )
    styles = _build_styles()
    story = []

    story.append(Paragraph(title, styles["ReportTitle"]))
    if subtitle:
        story.append(Paragraph(subtitle, styles["ReportSubtitle"]))
    story.append(HRFlowable(width="100%", color=GOLD, thickness=1.2))
    story.append(Spacer(1, 12))

    for section in sections:
        if section.get("heading"):
            story.append(Paragraph(section["heading"], styles["SectionHeading"]))
        _render_markdown_lite(section.get("body", ""), styles, story)

    doc.build(story)
    return buffer.getvalue()
