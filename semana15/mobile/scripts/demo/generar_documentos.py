#!/usr/bin/env python3
"""Genera los documentos de contexto FICTICIOS de la demo (sin datos personales)."""
import pathlib

from docx import Document
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

OUT = pathlib.Path(__file__).resolve().parent / "documentos"
OUT.mkdir(exist_ok=True)
PURPLE = HexColor("#2A0057")
styles = getSampleStyleSheet()
H = ParagraphStyle("h", parent=styles["Title"], textColor=PURPLE)
H2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=PURPLE)
B = styles["BodyText"]
NOTE = ParagraphStyle("n", parent=B, textColor=HexColor("#625B78"), fontSize=8)


def pdf(name: str, title: str, sections: list[tuple[str, list[str]]]):
    story = [Paragraph(title, H), Paragraph("Documento ficticio de demostración · Proyéctate", NOTE), Spacer(1, 12)]
    for heading, paragraphs in sections:
        story.append(Paragraph(heading, H2))
        for p in paragraphs:
            story.append(Paragraph(p, B))
            story.append(Spacer(1, 6))
    SimpleDocTemplate(str(OUT / name), pagesize=letter, title=title).build(story)


pdf("Propuesta comercial POLAR CRAVING.pdf", "POLAR CRAVING · Propuesta comercial", [
    ("Concepto", ["Marca de postres fríos con sabores del Caribe: paletas de corozo, mango biche y tamarindo, y helados artesanales."]),
    ("Piloto de ventas", ["Dos semanas en el punto del campus, con pedidos anticipados desde la app.", "Meta: 300 unidades vendidas y 8 sabores evaluados."]),
    ("Precios de referencia", ["Paleta de fruta: $4.000 · Paleta cremosa: $5.000 · Vaso de helado: $6.500 (valores de ejemplo)."]),
])
pdf("Investigación agrupaciones CHISPA.pdf", "CHISPA · Investigación de agrupaciones", [
    ("Alcance", ["Agrupaciones de cumbia, bullerengue, millo y danza del área metropolitana de Barranquilla."]),
    ("Metodología", ["Entrevistas a directores, registro de repertorio y fechas de presentación para la agenda."]),
    ("Resultados esperados", ["Perfiles de 30 agrupaciones antes del Carnaval 2027 y un mapa de presentaciones."]),
])
pdf("Bases convocatoria ARTFEST.pdf", "ARTFEST · Bases de la convocatoria", [
    ("Quiénes participan", ["Estudiantes de la universidad en música, danza, teatro y artes visuales."]),
    ("Fechas", ["Recepción de propuestas hasta el 25 de noviembre; publicación del cronograma en diciembre (fechas de ejemplo)."]),
])

doc = Document()
doc.add_heading("INSTAGRAM · Plan del piloto", 0)
doc.add_paragraph("Documento ficticio de demostración · Proyéctate")
doc.add_heading("Objetivo", level=1)
doc.add_paragraph("Probar el MVP con 200 estudiantes durante cuatro semanas.")
doc.add_heading("Métricas", level=1)
for m in ["Usuarios activos por semana", "Publicaciones por usuario", "Reportes de contenido resueltos en menos de 24 h"]:
    doc.add_paragraph(m, style="List Bullet")
doc.save(OUT / "Plan del piloto INSTAGRAM.docx")
print("\n".join(sorted(p.name for p in OUT.iterdir())))
