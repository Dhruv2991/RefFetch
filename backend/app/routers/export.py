from fastapi import APIRouter
from fastapi.responses import Response

from app.schemas import PdfExportRequest
from app.services.pdf_export import build_pdf_report

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/pdf")
def export_pdf(req: PdfExportRequest):
    pdf_bytes = build_pdf_report(
        req.title, req.subtitle, [s.model_dump() for s in req.sections]
    )
    filename = "".join(c if c.isalnum() or c in " -_" else "" for c in req.title)[:60].strip() or "report"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )
