"""PDF generation service for contract analysis reports."""

import io
from typing import List
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.units import cm


def generate_analysis_pdf(summary: str, red_flags: List[str], pushbacks: List[str]) -> bytes:
    """Generate a PDF report from analysis results."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        leftMargin=2*cm, 
        rightMargin=2*cm, 
        topMargin=2*cm, 
        bottomMargin=2*cm
    )
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph("<b>Lindle Contract Analysis</b>", styles['Title']))
    story.append(Spacer(1, 12))

    # Summary section
    story.append(Paragraph("<b>Summary</b>", styles['Heading2']))
    story.append(Paragraph(summary.replace('\n', '<br/>'), styles['BodyText']))
    story.append(Spacer(1, 10))

    # Red flags section
    story.append(Paragraph("<b>Top 5 Red Flags</b>", styles['Heading2']))
    story.append(ListFlowable([
        ListItem(Paragraph(x, styles['BodyText'])) for x in red_flags
    ], bulletType='bullet'))
    story.append(Spacer(1, 10))

    # Pushbacks section
    story.append(Paragraph("<b>Suggested Pushbacks</b>", styles['Heading2']))
    story.append(ListFlowable([
        ListItem(Paragraph(x, styles['BodyText'])) for x in pushbacks
    ], bulletType='bullet'))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data