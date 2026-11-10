#!/usr/bin/env python3
"""Genera el PDF de evidencias web a partir de las 14 capturas entregadas.

Uso: python3 tools/build_evidence_pdf.py --input-dir /ruta/a/capturas \
    --output docs/EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf

Requiere fpdf2 (`python3 -m pip install fpdf2`). No modifica las capturas.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from fpdf import FPDF


PURPLE = (42, 0, 87)
VIOLET = (138, 63, 252)
PALE = (244, 238, 255)
INK = (46, 34, 64)
MUTED = (103, 94, 122)
LIME = (217, 255, 77)
PAGE_W = 297
PAGE_H = 210
TOTAL_PAGES = 16


EVIDENCE = [
    ("E01", "Acceso", "Bienvenida", "/", "9.10.31", "La portada ofrece iniciar sesión, registrarse o explorar como visitante.", "Interfaz visible; esta captura no acredita una sesión real."),
    ("E02", "Acceso", "Registro institucional", "/registro", "9.10.23", "El formulario solicita datos institucionales y anuncia la verificación por correo.", "No se muestra el envío del formulario ni la recepción del código."),
    ("E03", "Acceso", "Inicio de sesión", "/login", "9.10.38", "El formulario permite ingresar con la cuenta usada en la aplicación móvil.", "La captura muestra el formulario vacío, no un inicio de sesión completado."),
    ("E04", "Descubrimiento", "Explorar proyectos", "/explorar", "9.11.07", "Se observan búsqueda, pestañas Todos/Seguidos y tarjetas de proyectos.", "Los proyectos visibles son datos de demostración guardados en el navegador."),
    ("E05", "Gestión de proyectos", "Mis proyectos", "/mis-proyectos", "9.13.03", "La cuenta de prueba A ve EcoCampus, sus métricas y acciones de gestión.", "El listado mostrado pertenece a la demostración local."),
    ("E06", "Gestión de proyectos", "Editar EcoCampus", "/proyectos/eco-campus/editar", "9.12.50", "El asistente de edición recupera nombre, descripción y categorías del proyecto.", "Los cambios de este recorrido se guardan solo en el navegador."),
    ("E07", "Crear proyecto", "1/6 · Comencemos", "/proyectos/nuevo", "9.13.14", "Se inicia una idea con su nombre y se muestra el avance del asistente.", "Demostración local; todavía no hay proyecto publicado."),
    ("E08", "Crear proyecto", "2/6 · Información básica", "/proyectos/nuevo", "9.13.28", "Se completan nombre, descripción y categorías del proyecto de prueba.", "La información se prepara en el asistente local."),
    ("E09", "Crear proyecto", "3/6 · Equipo y tareas", "/proyectos/nuevo", "9.13.43", "Se configuran cupos, fecha límite de postulación y tareas opcionales.", "En esta captura hay un cupo de diseño y uno de desarrollo."),
    ("E10", "Crear proyecto", "4/6 · Tiempo estimado", "/proyectos/nuevo", "9.13.49", "Se selecciona la duración aproximada del proyecto.", "La opción elegida en la captura es Meses."),
    ("E11", "Crear proyecto", "5/6 · Audiencia", "/proyectos/nuevo", "9.14.07", "Se elige entre visibilidad privada y toda la comunidad.", "La opción seleccionada en la captura es Toda la comunidad."),
    ("E12", "Crear proyecto", "6/6 · Revisar y publicar", "/proyectos/nuevo", "9.14.14", "El resumen permite revisar los datos, guardar borrador o publicar la demo.", "Se ve la acción Publicar demo; la captura no muestra el clic."),
    ("E13", "Detalle", "Proyecto y miembros", "/proyectos/[id]", "9.14.22", "El detalle de PROYECTOPRUEBA muestra roles, cupos y solicitudes pendientes.", "Los miembros y solicitudes son datos locales; no provienen de Roble."),
    ("E14", "Perfil", "Perfil y trayectoria", "/perfil", "9.14.33", "La cuenta de prueba A ve proyectos creados, tareas y participación.", "Las cifras se calculan con acciones de esta demostración local."),
]


def set_color(pdf: FPDF, color: tuple[int, int, int]) -> None:
    pdf.set_text_color(*color)


def font(pdf: FPDF, size: int, bold: bool = False) -> None:
    pdf.set_font("Arial", "B" if bold else "", size)


def line(pdf: FPDF, x: float, y: float, w: float, h: float, text: str, size: int = 11, bold: bool = False, color=INK) -> None:
    pdf.set_xy(x, y)
    font(pdf, size, bold)
    set_color(pdf, color)
    pdf.cell(w, h, text=text)


def wrap(pdf: FPDF, x: float, y: float, w: float, text: str, size: int = 10, color=INK, height: float = 5.5) -> float:
    pdf.set_xy(x, y)
    font(pdf, size)
    set_color(pdf, color)
    pdf.multi_cell(w, height, text=text)
    return pdf.get_y()


def base(pdf: FPDF, page_number: int, section: str) -> None:
    pdf.set_fill_color(255, 255, 255)
    pdf.rect(0, 0, PAGE_W, PAGE_H, style="F")
    pdf.set_fill_color(*PURPLE)
    pdf.rect(0, 0, PAGE_W, 5, style="F")
    line(pdf, 13, 5.5, 200, 7, "PROYÉCTATE  /  EVIDENCIAS WEB", 9, True, PURPLE)
    line(pdf, 221, 5.5, 63, 7, section.upper(), 8, True, VIOLET)
    pdf.set_draw_color(228, 219, 241)
    pdf.line(13, 198, 284, 198)
    line(pdf, 13, 200, 200, 5, "9 de noviembre de 2026  ·  Entorno local: localhost:3000", 8, False, MUTED)
    line(pdf, 271, 200, 13, 5, f"{page_number}/{TOTAL_PAGES}", 8, False, MUTED)


def box(pdf: FPDF, x: float, y: float, w: float, h: float, title: str, detail: str) -> None:
    pdf.set_fill_color(*PALE)
    pdf.rect(x, y, w, h, style="F", round_corners=True, corner_radius=3)
    line(pdf, x + 6, y + 4, w - 12, 7, title, 11, True, PURPLE)
    wrap(pdf, x + 6, y + 12, w - 12, detail, 9, INK, 4.8)


def cover(pdf: FPDF) -> None:
    pdf.add_page()
    base(pdf, 1, "Presentación")
    pdf.set_fill_color(*PALE)
    pdf.rect(13, 18, 271, 56, style="F", round_corners=True, corner_radius=5)
    pdf.set_fill_color(*LIME)
    pdf.ellipse(251, 28, 18, 18, style="F")
    line(pdf, 22, 23, 220, 12, "Flujos de la aplicación web", 25, True, PURPLE)
    line(pdf, 22, 42, 218, 9, "Documento visual de evidencias · Grupo 10", 14, False, PURPLE)
    line(pdf, 22, 58, 220, 7, "14 capturas  ·  7 recorridos  ·  1 entorno de demostración", 10, True, VIOLET)

    line(pdf, 13, 79, 271, 8, "Recorridos documentados", 14, True, PURPLE)
    items = [
        ("01–03", "Acceso", "Bienvenida, registro e inicio de sesión"),
        ("04", "Descubrimiento", "Exploración de proyectos"),
        ("05", "Mis proyectos", "Listado y acciones disponibles"),
        ("06", "Edición", "Datos existentes de EcoCampus"),
        ("07–12", "Creación", "Seis pasos hasta revisión y publicación demo"),
        ("13", "Detalle", "Roles y solicitudes de PROYECTOPRUEBA"),
        ("14", "Perfil", "Cuenta de prueba y trayectoria"),
    ]
    y = 91
    for number, title, desc in items:
        line(pdf, 17, y, 26, 7, number, 10, True, VIOLET)
        line(pdf, 45, y, 50, 7, title, 10, True, PURPLE)
        line(pdf, 99, y, 177, 7, desc, 10, False, INK)
        y += 12

    box(pdf, 13, 174, 271, 22, "Alcance de esta evidencia", "Las capturas de proyectos, detalle y perfil muestran una demostración local. Los formularios de acceso muestran interfaz; por sí solos no prueban una autenticación completada.")


def evidence_page(pdf: FPDF, index: int, item: tuple[str, ...], path: Path) -> None:
    code, section, title, route, time, description, scope = item
    pdf.add_page()
    base(pdf, index + 2, section)
    line(pdf, 13, 14, 26, 11, code, 19, True, VIOLET)
    line(pdf, 42, 14, 224, 11, title, 18, True, PURPLE)
    line(pdf, 13, 28, 210, 7, description, 10, False, INK)
    line(pdf, 236, 28, 48, 7, route, 8, False, MUTED)

    # Mantiene la captura completa, incluida la barra del navegador.
    line(pdf, 13, 34, 220, 6, scope, 8, False, MUTED)
    line(pdf, 242, 34, 42, 6, f"{time} p. m.", 8, False, MUTED)
    image_width = 233
    image_height = image_width * 1912 / 2940
    image_x = (PAGE_W - image_width) / 2
    image_y = 42
    pdf.image(str(path), x=image_x, y=image_y, w=image_width, h=image_height)
    pdf.set_draw_color(228, 219, 241)
    pdf.rect(image_x, image_y, image_width, image_height)


def closing(pdf: FPDF) -> None:
    pdf.add_page()
    base(pdf, TOTAL_PAGES, "Lectura de resultados")
    line(pdf, 13, 17, 271, 12, "Qué acreditan estas capturas", 21, True, PURPLE)
    bullets = [
        "La identidad visual de Proyéctate está aplicada a la web de escritorio.",
        "Se muestran pantallas navegables de acceso, exploración, gestión, detalle y perfil.",
        "El asistente de creación está representado en sus seis pasos completos.",
        "La edición de EcoCampus y el detalle de PROYECTOPRUEBA son recorridos distintos.",
    ]
    y = 38
    for item in bullets:
        pdf.set_fill_color(*VIOLET)
        pdf.ellipse(16, y + 2, 2.5, 2.5, style="F")
        y = wrap(pdf, 24, y, 257, item, 12, INK, 7) + 6

    line(pdf, 13, 106, 271, 10, "Qué falta demostrar", 17, True, PURPLE)
    missing = [
        "Estas imágenes no muestran el registro verificado, el ingreso completado ni la pantalla de identidad de Roble.",
        "Los proyectos, miembros y métricas mostrados son locales: aún no prueban sincronización entre móvil y web.",
        "Faltan evidencias de dos cuentas reales, permisos corregidos en Roble y una comparación de los mismos datos en ambos clientes.",
    ]
    y = 121
    for item in missing:
        pdf.set_fill_color(*LIME)
        pdf.ellipse(16, y + 2, 2.5, 2.5, style="F")
        y = wrap(pdf, 24, y, 257, item, 11, INK, 6.3) + 5

    pdf.set_fill_color(*PALE)
    pdf.rect(13, 175, 271, 18, style="F", round_corners=True, corner_radius=3)
    wrap(pdf, 19, 179, 259, "Estado de integración: la identidad web usa Roble en desarrollo. La publicación de datos reales sigue pendiente de permisos seguros en el servicio compartido.", 10, PURPLE, 5.5)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    captures = {}
    for file in args.input_dir.glob("Captura de pantalla 2026-11-09 a la(s) 9.*.png"):
        captures[file.name.split(" a la(s) ", 1)[1].split(" p.m.", 1)[0]] = file
    missing = [item[4] for item in EVIDENCE if item[4] not in captures]
    if missing:
        raise SystemExit(f"Faltan capturas: {', '.join(missing)}")

    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)
    font_dir = Path("/System/Library/Fonts/Supplemental")
    pdf.add_font("Arial", style="", fname=str(font_dir / "Arial.ttf"))
    pdf.add_font("Arial", style="B", fname=str(font_dir / "Arial Bold.ttf"))
    pdf.set_title("Proyéctate - Evidencias de flujos web")
    pdf.set_author("Grupo 10")
    pdf.set_subject("Evidencias visuales de los recorridos web; demostración local y alcance Roble")

    cover(pdf)
    for index, item in enumerate(EVIDENCE):
        evidence_page(pdf, index, item, captures[item[4]])
    closing(pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(args.output))
    print(f"Generado: {args.output} ({pdf.page_no()} páginas)")


if __name__ == "__main__":
    main()
