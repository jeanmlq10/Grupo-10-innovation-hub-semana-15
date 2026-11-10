#!/usr/bin/env python3
"""Genera una guía visual de las cinco tareas usando las capturas existentes.

Uso: python3 tools/build_task_flow_pdf.py --input-dir /ruta/a/capturas \
    --output docs/WIREFRAMES_POR_TAREAS_2026-11-09.pdf

Requiere fpdf2. No modifica las capturas originales.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from fpdf import FPDF

from build_evidence_pdf import EVIDENCE


PURPLE = (42, 0, 87)
VIOLET = (138, 63, 252)
PALE = (244, 238, 255)
INK = (46, 34, 64)
MUTED = (103, 94, 122)
LIME = (217, 255, 77)
PAGE_W = 297
PAGE_H = 210
TOTAL_PAGES = 7

FLOWS = [
    {
        "title": "Iniciar sesión",
        "purpose": "Entrar a la web con la identidad compartida con la app móvil.",
        "steps": "Bienvenida → Login → Cuenta Roble; registro como ruta alternativa.",
        "codes": ["E01", "E03", "E02"],
        "status": "Las capturas muestran la bienvenida y los formularios de login y registro.",
        "missing": "Faltan la verificación del correo y una captura de /cuenta tras el ingreso real.",
    },
    {
        "title": "Crear proyecto",
        "purpose": "Convertir una idea en un proyecto publicado o borrador.",
        "steps": "Comencemos → Información → Equipo → Tiempo → Audiencia → Revisar → Publicado.",
        "codes": ["E07", "E08", "E09", "E10", "E11", "E12", "E17"],
        "status": "Las seis etapas y el resultado publicado se ven en la demostración local.",
        "missing": "Falta capturar el subflujo de borradores; estas acciones no escriben en Roble.",
    },
    {
        "title": "Unirse a proyecto",
        "purpose": "Solicitar un cupo y recibir la decisión de la persona creadora.",
        "steps": "Detalle → Solicitud de B → Notificación a A → Decisión disponible.",
        "codes": ["E13", "E15", "E16", "E18"],
        "status": "B envió la solicitud; A la ve pendiente y dispone de Aceptar/Rechazar.",
        "missing": "Faltan la decisión ejecutada, el resultado para B y el cambio de miembros.",
    },
    {
        "title": "Crear equipo",
        "purpose": "Definir vacantes y conformar el equipo al aprobar postulaciones.",
        "steps": "Definir cupos → Ver vacantes → Revisar solicitudes → Incorporar miembro.",
        "codes": ["E09", "E13", "E18"],
        "status": "Equipo se configura dentro de Crear proyecto; no es una pantalla original aparte.",
        "missing": "Falta el equipo conformado. Si exigen una pantalla propia, hay que diseñarla.",
    },
    {
        "title": "Explorar",
        "purpose": "Descubrir proyectos y abrir uno para conocerlo o participar.",
        "steps": "Catálogo → Búsqueda o filtros → Detalle → Seguir o solicitar cupo.",
        "codes": ["E04", "E13"],
        "status": "Se documentan el catálogo y una pantalla de detalle.",
        "missing": "Faltan capturas con búsqueda, filtros y pestaña Seguidos aplicados.",
    },
]

EVIDENCE_BY_CODE = {item[0]: item for item in EVIDENCE}


def write(pdf: FPDF, x: float, y: float, text: str, size: int = 11, bold: bool = False, color=INK, width: float = 260, height: float = 6) -> float:
    pdf.set_xy(x, y)
    pdf.set_font("Arial", "B" if bold else "", size)
    pdf.set_text_color(*color)
    pdf.multi_cell(width, height, text=text)
    return pdf.get_y()


def base(pdf: FPDF, page: int, section: str) -> None:
    pdf.set_fill_color(255, 255, 255)
    pdf.rect(0, 0, PAGE_W, PAGE_H, style="F")
    pdf.set_fill_color(*PURPLE)
    pdf.rect(0, 0, PAGE_W, 5, style="F")
    write(pdf, 13, 7, "PROYÉCTATE / FLUJOS POR TAREAS", 9, True, PURPLE)
    write(pdf, 230, 7, section.upper(), 8, True, VIOLET, 55)
    pdf.set_draw_color(228, 219, 241)
    pdf.line(13, 198, 284, 198)
    write(pdf, 13, 200, "9 de noviembre de 2026 · Entorno de demostración local", 8, False, MUTED)
    write(pdf, 270, 200, f"{page}/{TOTAL_PAGES}", 8, False, MUTED, 14)


def cover(pdf: FPDF) -> None:
    pdf.add_page()
    base(pdf, 1, "Guía")
    pdf.set_fill_color(*PALE)
    pdf.rect(13, 20, 271, 47, style="F", round_corners=True, corner_radius=5)
    write(pdf, 22, 25, "Wireframes por tareas", 26, True, PURPLE)
    write(pdf, 22, 46, "Cinco recorridos para presentar la web de Proyéctate", 13, False, PURPLE)
    write(pdf, 13, 77, "Orden solicitado", 15, True, PURPLE)
    y = 93
    for index, flow in enumerate(FLOWS, start=1):
        pdf.set_fill_color(*PALE)
        pdf.ellipse(15, y, 9, 9, style="F")
        write(pdf, 17.5, y + 1.5, str(index), 10, True, VIOLET, 5)
        write(pdf, 30, y, flow["title"], 13, True, PURPLE)
        y += 16
    pdf.set_fill_color(*LIME)
    pdf.ellipse(254, 29, 17, 17, style="F")
    write(pdf, 13, 178, "Las miniaturas son capturas de la web implementada. El PDF de evidencias conserva las 18 imágenes completas.", 10, False, MUTED, 269, 5)


def screenshot_grid(pdf: FPDF, codes: list[str], captures: dict[str, Path]) -> float:
    count = len(codes)
    cols = min(4, count)
    rows = math.ceil(count / cols)
    if rows == 2:
        thumb_w, gap, first_y, row_gap = 58, 8, 66, 49
    elif cols == 4:
        thumb_w, gap, first_y, row_gap = 58, 8, 73, 0
    elif cols == 3:
        thumb_w, gap, first_y, row_gap = 76, 10, 73, 0
    else:
        thumb_w, gap, first_y, row_gap = 103, 12, 73, 0
    thumb_h = thumb_w * 1912 / 2940
    for row in range(rows):
        row_codes = codes[row * cols : (row + 1) * cols]
        total_width = len(row_codes) * thumb_w + (len(row_codes) - 1) * gap
        start_x = (PAGE_W - total_width) / 2
        y = first_y + row * row_gap
        for col, code in enumerate(row_codes):
            x = start_x + col * (thumb_w + gap)
            pdf.image(str(captures[code]), x=x, y=y, w=thumb_w, h=thumb_h)
            pdf.set_draw_color(228, 219, 241)
            pdf.rect(x, y, thumb_w, thumb_h)
            title = "Proyecto publicado" if code == "E17" else EVIDENCE_BY_CODE[code][2]
            write(pdf, x, y + thumb_h + 1.5, f"{code} · {title}", 8, True, PURPLE, thumb_w, 4)
    return first_y + (rows - 1) * row_gap + thumb_h + 11


def flow_page(pdf: FPDF, number: int, flow: dict[str, object], captures: dict[str, Path]) -> None:
    pdf.add_page()
    base(pdf, number + 1, f"Tarea {number}")
    write(pdf, 13, 18, f"{number}. {flow['title']}", 21, True, PURPLE)
    write(pdf, 13, 37, str(flow["purpose"]), 11, False, INK)
    pdf.set_fill_color(*PALE)
    pdf.rect(13, 47, 271, 13, style="F", round_corners=True, corner_radius=3)
    write(pdf, 19, 50.5, str(flow["steps"]), 10, True, PURPLE, 259, 5)
    bottom = screenshot_grid(pdf, list(flow["codes"]), captures)
    notes_y = max(bottom + 3, 147) if len(flow["codes"]) <= 4 else 172
    write(pdf, 13, notes_y, "EVIDENCIA", 9, True, VIOLET, 26, 5)
    write(pdf, 40, notes_y, str(flow["status"]), 9, False, INK, 244, 5)
    write(pdf, 13, notes_y + 12, "PENDIENTE", 9, True, VIOLET, 26, 5)
    write(pdf, 40, notes_y + 12, str(flow["missing"]), 9, False, INK, 244, 5)
    write(pdf, 13, 188, "Capturas completas: E01–E18 en EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf", 8, False, MUTED)


def closing(pdf: FPDF) -> None:
    pdf.add_page()
    base(pdf, TOTAL_PAGES, "Inventario")
    write(pdf, 13, 18, "Inventario de los diez wireframes originales", 19, True, PURPLE)
    screens = [
        ("Bienvenida", "E01"), ("Iniciar sesión", "E03"),
        ("Alta institucional", "E02"), ("Explorar", "E04"),
        ("Mis proyectos", "E05, E17"), ("Detalle de proyecto", "E13, E18"),
        ("Notificaciones", "E16"), ("Perfil", "E14"),
        ("Crear proyecto", "E07–E12"), ("Trayectoria", "Sin captura"),
    ]
    for index, (name, evidence) in enumerate(screens):
        col = index // 5
        row = index % 5
        x = 13 + col * 137
        y = 43 + row * 22
        pdf.set_fill_color(*PALE)
        pdf.rect(x, y, 130, 17, style="F", round_corners=True, corner_radius=2)
        write(pdf, x + 5, y + 2.5, name, 10, True, PURPLE, 76, 5)
        write(pdf, x + 83, y + 2.5, evidence, 9, False, VIOLET, 44, 5)
    write(pdf, 13, 160, "9 de 10 pantallas originales tienen al menos una captura. Falta Trayectoria.", 12, True, PURPLE)
    write(pdf, 13, 174, "Crear equipo se compone de roles, solicitudes y decisiones; no es una pantalla independiente del prototipo.", 10, False, INK)
    write(pdf, 13, 185, "Los datos de proyectos y equipos mostrados son locales. No prueban sincronización móvil/web ni permisos de Roble.", 9, False, MUTED)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    by_time = {}
    for file in args.input_dir.glob("Captura de pantalla 2026-11-09 a la(s) 9.*.png"):
        by_time[file.name.split(" a la(s) ", 1)[1].split(" p.m.", 1)[0]] = file
    captures = {}
    for code in {code for flow in FLOWS for code in flow["codes"]}:
        time = EVIDENCE_BY_CODE[code][4]
        if time not in by_time:
            raise SystemExit(f"Falta la captura {code} ({time})")
        captures[code] = by_time[time]

    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)
    font_dir = Path("/System/Library/Fonts/Supplemental")
    pdf.add_font("Arial", style="", fname=str(font_dir / "Arial.ttf"))
    pdf.add_font("Arial", style="B", fname=str(font_dir / "Arial Bold.ttf"))
    pdf.set_title("Proyéctate - Wireframes por tareas")
    pdf.set_author("Grupo 10")
    cover(pdf)
    for number, flow in enumerate(FLOWS, start=1):
        flow_page(pdf, number, flow, captures)
    closing(pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(args.output))
    print(f"Generado: {args.output} ({pdf.page_no()} páginas)")


if __name__ == "__main__":
    main()
