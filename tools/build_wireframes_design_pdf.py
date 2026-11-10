#!/usr/bin/env python3
"""Dibuja wireframes vectoriales originales para cinco tareas de Proyéctate.

Uso: python3 tools/build_wireframes_design_pdf.py \
    docs/WIREFRAMES_DISENADOS_POR_TAREAS_2026-11-09.pdf

Requiere fpdf2. Este documento no usa capturas ni datos reales.
"""

from __future__ import annotations

import sys
from pathlib import Path

from fpdf import FPDF


PURPLE = (42, 0, 87)
VIOLET = (138, 63, 252)
PALE = (244, 238, 255)
SOFT = (249, 247, 252)
LINE = (221, 214, 232)
INK = (46, 34, 64)
MUTED = (104, 96, 119)
LIME = (217, 255, 77)
GREEN = (233, 249, 220)
ROSE = (255, 237, 241)
WHITE = (255, 255, 255)
PAGE_W = 297
PAGE_H = 210
WX, WY, WW, WH = 12, 40, 273, 153

FLOWS = [
    ("Iniciar sesión", "Identidad compartida con la app móvil", [
        ("Bienvenida", "/", "Referencia actual", "auth_welcome"),
        ("Formulario de acceso", "/login", "Referencia actual", "auth_login"),
        ("Credenciales incorrectas", "/login", "Estado diseñado", "auth_error"),
        ("Registro institucional", "/registro", "Referencia actual", "auth_register"),
        ("Verificar correo", "/verificar-correo", "Estado diseñado", "auth_verify"),
        ("Cuenta identificada", "/cuenta", "Estado diseñado", "auth_account"),
    ]),
    ("Crear proyecto", "De la idea al borrador o proyecto publicado", [
        ("Nombre de la idea", "/proyectos/nuevo", "Referencia actual", "wizard_idea"),
        ("Información básica", "/proyectos/nuevo", "Referencia actual", "wizard_basic"),
        ("Equipo necesario", "/proyectos/nuevo", "Referencia actual", "wizard_team"),
        ("Tiempo estimado", "/proyectos/nuevo", "Referencia actual", "wizard_time"),
        ("Audiencia", "/proyectos/nuevo", "Referencia actual", "wizard_audience"),
        ("Revisar y publicar", "/proyectos/nuevo", "Referencia actual", "wizard_review"),
        ("Borrador guardado", "/mis-proyectos", "Estado diseñado", "project_draft"),
        ("Proyecto publicado", "/mis-proyectos", "Estado diseñado", "project_published"),
    ]),
    ("Unirse a proyecto", "Solicitud, decisión y resultado para dos personas", [
        ("Vacante disponible", "/proyectos/[id]", "Referencia actual", "join_detail"),
        ("Enviar postulación", "/proyectos/[id]", "Estado diseñado", "join_apply"),
        ("Solicitud pendiente", "/proyectos/[id]", "Referencia actual", "join_pending"),
        ("Decisión de quien creó", "/proyectos/[id]", "Referencia actual", "join_decision"),
        ("Solicitud aceptada", "/notificaciones", "Estado diseñado", "join_accepted"),
        ("Solicitud rechazada", "/notificaciones", "Estado diseñado", "join_rejected"),
    ]),
    ("Crear equipo", "Cupos, solicitudes y miembros del proyecto", [
        ("Definir roles y cupos", "/proyectos/nuevo", "Referencia actual", "wizard_team"),
        ("Gestionar equipo", "/proyectos/[id]/equipo", "Propuesta nueva", "team_manage"),
        ("Confirmar incorporación", "/proyectos/[id]/equipo", "Propuesta nueva", "team_confirm"),
        ("Equipo conformado", "/proyectos/[id]/equipo", "Propuesta nueva", "team_ready"),
    ]),
    ("Explorar", "Encontrar, filtrar y seguir proyectos", [
        ("Catálogo", "/explorar", "Referencia actual", "explore_catalog"),
        ("Aplicar filtros", "/explorar", "Estado diseñado", "explore_filters"),
        ("Resultados de búsqueda", "/explorar", "Estado diseñado", "explore_results"),
        ("Abrir detalle", "/proyectos/[id]", "Referencia actual", "explore_detail"),
        ("Proyectos seguidos", "/explorar", "Estado diseñado", "explore_followed"),
        ("Sin resultados", "/explorar", "Estado diseñado", "explore_empty"),
    ]),
]

SUPPORT_SCREENS = [
    ("Perfil", "/perfil", "Referencia actual", "profile_main"),
    ("Trayectoria", "/perfil/trayectoria", "Referencia actual", "profile_trajectory"),
]

TOTAL_SCREENS = sum(len(flow[2]) for flow in FLOWS) + len(SUPPORT_SCREENS)
TOTAL_PAGES = TOTAL_SCREENS + 2


def color(pdf: FPDF, rgb: tuple[int, int, int]) -> None:
    pdf.set_text_color(*rgb)


def txt(pdf: FPDF, x: float, y: float, label: str, size: float = 10, bold: bool = False,
        rgb: tuple[int, int, int] = INK, max_w: float = 250) -> None:
    current = size
    while current > 5:
        pdf.set_font("Arial", "B" if bold else "", current)
        if pdf.get_string_width(label) <= max_w:
            break
        current -= 0.5
    color(pdf, rgb)
    pdf.set_xy(x, y)
    pdf.cell(max_w, max(current * 0.45, 3.5), text=label)


def rect(pdf: FPDF, x: float, y: float, w: float, h: float, fill=WHITE, stroke=LINE,
         radius: float = 1.8) -> None:
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*stroke)
    pdf.rect(x, y, w, h, style="DF", round_corners=radius > 0, corner_radius=radius)


def rule(pdf: FPDF, x: float, y: float, w: float, rgb=LINE) -> None:
    pdf.set_draw_color(*rgb)
    pdf.line(x, y, x + w, y)


def btn(pdf: FPDF, x: float, y: float, w: float, h: float, label: str, primary: bool = False,
        pale: bool = False) -> None:
    fill = PURPLE if primary else PALE if pale else WHITE
    stroke = PURPLE if primary or not pale else PALE
    rect(pdf, x, y, w, h, fill, stroke, 2)
    size = 8.5
    pdf.set_font("Arial", "B", size)
    text_w = pdf.get_string_width(label)
    txt(pdf, x + max((w - text_w) / 2, 2), y + (h - 4.4) / 2, label, size, True,
        WHITE if primary else PURPLE, w - 4)


def pill(pdf: FPDF, x: float, y: float, label: str, fill=PALE, rgb=PURPLE, w: float = 24) -> None:
    rect(pdf, x, y, w, 6.5, fill, fill, 3)
    txt(pdf, x + 3, y + 1.5, label, 7.5, True, rgb, w - 5)


def field(pdf: FPDF, x: float, y: float, w: float, label: str, placeholder: str, h: float = 12) -> None:
    txt(pdf, x, y, label, 7.8, True, PURPLE, w)
    rect(pdf, x, y + 5, w, h, SOFT, LINE, 2)
    txt(pdf, x + 4, y + 8.5, placeholder, 8.2, False, MUTED, w - 8)


def row(pdf: FPDF, x: float, y: float, w: float, title: str, detail: str = "", end: str = "") -> None:
    rect(pdf, x, y, w, 15, WHITE, LINE, 2)
    txt(pdf, x + 4, y + 3, title, 8.5, True, PURPLE, w * 0.55)
    if detail:
        txt(pdf, x + 4, y + 9, detail, 7.5, False, MUTED, w * 0.65)
    if end:
        txt(pdf, x + w - 24, y + 5, end, 8.2, True, PURPLE, 20)


def page_header(pdf: FPDF, page: int, task: int, task_name: str, index: int,
                count: int, title: str, route: str, status: str) -> None:
    pdf.add_page()
    pdf.set_fill_color(*WHITE)
    pdf.rect(0, 0, PAGE_W, PAGE_H, style="F")
    pdf.set_fill_color(*PURPLE)
    pdf.rect(0, 0, PAGE_W, 5, style="F")
    section = f"TAREA {task} / {task_name.upper()}" if task else f"ANEXO / {task_name.upper()}"
    txt(pdf, 12, 9, section, 9, True, VIOLET, 175)
    txt(pdf, 247, 9, f"{index}/{count}", 9, True, PURPLE, 38)
    txt(pdf, 12, 18, title, 19, True, PURPLE, 180)
    txt(pdf, 205, 20, route, 9, False, MUTED, 80)
    pill(pdf, 12, 30, status, PALE if status != "Propuesta nueva" else GREEN,
         PURPLE, 37 if status != "Propuesta nueva" else 34)
    txt(pdf, 194, 31, "WIREFRAME · WEB", 8, True, MUTED, 91)
    rule(pdf, 12, 197, 273)
    txt(pdf, 12, 200, "Diseño conceptual · datos y personas de ejemplo · no representa datos de Roble", 8, False, MUTED, 245)
    txt(pdf, 272, 200, f"{page}/{TOTAL_PAGES}", 8, False, MUTED, 13)


def viewport(pdf: FPDF) -> tuple[float, float, float, float]:
    rect(pdf, WX, WY, WW, WH, WHITE, LINE, 2)
    pdf.set_fill_color(244, 241, 249)
    pdf.rect(WX + 0.3, WY + 0.3, WW - 0.6, 8.5, style="F")
    for dx in (5, 9, 13):
        pdf.set_fill_color(196, 185, 211)
        pdf.ellipse(WX + dx, WY + 3.1, 2.3, 2.3, style="F")
    txt(pdf, WX + 24, WY + 2.5, "proyectate.web", 7.5, False, MUTED, 60)
    return WX, WY + 9, WW, WH - 9


def auth_shell(pdf: FPDF) -> tuple[float, float, float]:
    x, y, w, h = viewport(pdf)
    pdf.set_fill_color(*PALE)
    pdf.rect(x + 0.3, y, w * 0.49, h - 0.3, style="F")
    txt(pdf, x + 18, y + 23, "PROYÉCTATE", 16, True, PURPLE, 105)
    rect(pdf, x + 30, y + 47, 72, 52, SOFT, LINE, 4)
    txt(pdf, x + 38, y + 64, "[símbolo de marca]", 10, False, VIOLET, 62)
    txt(pdf, x + 17, y + 111, "Tu próxima gran idea empieza aquí.", 11, True, PURPLE, 115)
    return x + w * 0.55, y + 20, w * 0.39


def app_shell(pdf: FPDF, active: str, heading: str, subtitle: str = "") -> tuple[float, float, float]:
    x, y, w, h = viewport(pdf)
    rect(pdf, x + 0.4, y, 49, h - 0.5, SOFT, LINE, 0)
    txt(pdf, x + 6, y + 12, "PROYÉCTATE", 11, True, PURPLE, 38)
    nav = ["Explorar", "Mis proyectos", "Notificaciones", "Mensajes", "Perfil"]
    for i, name in enumerate(nav):
        ny = y + 35 + i * 17
        if name == active:
            rect(pdf, x + 4, ny - 2, 41, 13, PALE, PALE, 2)
        txt(pdf, x + 8, ny + 1, name, 8.2, name == active,
            PURPLE if name == active else MUTED, 34)
    pill(pdf, x + 5, y + h - 20, "Cuenta A/B", PALE, PURPLE, 35)
    cx, cw = x + 58, w - 68
    txt(pdf, cx, y + 9, heading, 17, True, PURPLE, cw)
    if subtitle:
        txt(pdf, cx, y + 19, subtitle, 9, False, MUTED, cw)
    return cx, y + 31, cw


def wizard_shell(pdf: FPDF, step: int, heading: str, subtitle: str) -> tuple[float, float, float]:
    x, y, w, h = viewport(pdf)
    rect(pdf, x + 0.4, y, 65, h - 0.5, PALE, PALE, 0)
    txt(pdf, x + 8, y + 12, "PROYÉCTATE", 11, True, PURPLE, 49)
    txt(pdf, x + 8, y + 30, "Crear proyecto", 12, True, PURPLE, 50)
    labels = ["Comencemos", "Información básica", "Equipo necesario", "Tiempo estimado", "Audiencia", "Revisar y publicar"]
    for i, label in enumerate(labels, 1):
        yy = y + 52 + (i - 1) * 13
        fill = PURPLE if i <= step else WHITE
        rect(pdf, x + 8, yy, 7, 7, fill, PURPLE if i <= step else LINE, 3)
        txt(pdf, x + 10.3, yy + 1.5, str(i), 7, True,
            WHITE if i <= step else MUTED, 3)
        txt(pdf, x + 20, yy + 1, label, 8, i == step, PURPLE if i <= step else MUTED, 40)
    cx, cw = x + 78, w - 91
    rect(pdf, cx, y + 9, cw, 2, PALE, PALE, 1)
    rect(pdf, cx, y + 9, cw * step / 6, 2, VIOLET, VIOLET, 1)
    txt(pdf, cx + cw - 10, y + 13, f"{step}/6", 7.5, False, MUTED, 12)
    txt(pdf, cx, y + 25, heading, 18, True, PURPLE, cw)
    txt(pdf, cx, y + 36, subtitle, 9, False, MUTED, cw)
    if step > 1:
        btn(pdf, cx + cw - 103, y + h - 17, 31, 11, "Anterior")
        btn(pdf, cx + cw - 69, y + h - 17, 33, 11, "Guardar borrador")
    btn(pdf, cx + cw - 33, y + h - 17, 32, 11, "Publicar" if step == 6 else "Continuar", True)
    return cx, y + 50, cw


def project_banner(pdf: FPDF, cx: float, cy: float, cw: float, title: str = "EcoCampus") -> None:
    rect(pdf, cx, cy, cw, 26, PALE, PALE, 3)
    txt(pdf, cx + 6, cy + 5, "[imagen o símbolo del proyecto]", 8.5, False, VIOLET, cw - 12)
    txt(pdf, cx + 5, cy + 29, title, 14, True, PURPLE, cw * 0.6)
    pill(pdf, cx + cw - 37, cy + 29, "0 miembros", PALE, PURPLE, 35)
    txt(pdf, cx + 5, cy + 42, "Descripción   Tareas   Miembros   Actividad", 8.5, True, MUTED, cw - 10)
    rule(pdf, cx, cy + 50, cw)


def simple_project_card(pdf: FPDF, x: float, y: float, w: float, title: str,
                        subtitle: str, status: str = "") -> None:
    rect(pdf, x, y, w, 42, WHITE, LINE, 2)
    rect(pdf, x + 5, y + 5, 11, 11, PALE, PALE, 2)
    txt(pdf, x + 20, y + 7, title, 10.5, True, PURPLE, w - 24)
    txt(pdf, x + 5, y + 21, subtitle, 8, False, MUTED, w - 10)
    if status:
        pill(pdf, x + 5, y + 31, status, GREEN if status == "Publicado" else PALE, PURPLE, 29)


def draw_auth(pdf: FPDF, kind: str) -> None:
    if kind == "auth_welcome":
        x, y, w, h = viewport(pdf)
        txt(pdf, x + 97, y + 16, "¡Bienvenido!", 20, True, PURPLE, 100)
        rect(pdf, x + 104, y + 44, 64, 38, PALE, PALE, 4)
        txt(pdf, x + 115, y + 59, "[logo y mascota]", 10, False, VIOLET, 45)
        txt(pdf, x + 74, y + 90, "Únete a proyectos que transforman ideas en impacto.", 10, False, MUTED, 145)
        btn(pdf, x + 91, y + 106, 91, 10, "Iniciar sesión", True)
        btn(pdf, x + 91, y + 119, 91, 10, "Regístrate")
        btn(pdf, x + 91, y + 132, 91, 10, "Continuar como visitante", pale=True)
        return
    cx, cy, cw = auth_shell(pdf)
    if kind in ("auth_login", "auth_error"):
        txt(pdf, cx, cy + 1, "Iniciar sesión", 17, True, PURPLE, cw)
        txt(pdf, cx, cy + 13, "Usa tu cuenta de Proyéctate móvil", 9, False, MUTED, cw)
        field(pdf, cx, cy + 27, cw, "Correo electrónico", "nombre@uninorte.edu.co")
        field(pdf, cx, cy + 52, cw, "Contraseña", "••••••••••••")
        txt(pdf, cx + cw - 44, cy + 76, "Olvidé mi contraseña", 7.5, False, VIOLET, 44)
        if kind == "auth_error":
            rect(pdf, cx, cy + 87, cw, 13, ROSE, ROSE, 2)
            txt(pdf, cx + 4, cy + 91, "Correo o contraseña incorrectos", 8, True, PURPLE, cw - 8)
            btn(pdf, cx, cy + 105, cw, 11, "Intentar de nuevo", True)
        else:
            btn(pdf, cx, cy + 92, cw, 11, "Ingresar", True)
            txt(pdf, cx + 20, cy + 112, "¿No tienes cuenta? Regístrate", 8, False, VIOLET, cw - 20)
    elif kind == "auth_register":
        txt(pdf, cx, cy - 3, "Crear cuenta institucional", 14, True, PURPLE, cw)
        for offset, label, placeholder in [
            (13, "Nombre completo", "Tu nombre"),
            (33, "Correo institucional", "nombre@uninorte.edu.co"),
            (53, "Programa (opcional)", "Carrera o programa"),
            (73, "Contraseña", "••••••••••••"),
            (93, "Confirmar contraseña", "••••••••••••"),
        ]:
            field(pdf, cx, cy + offset, cw, label, placeholder, 9)
        btn(pdf, cx, cy + 113, cw, 10, "Registrarme", True)
    elif kind == "auth_verify":
        txt(pdf, cx, cy + 1, "Verifica tu correo", 16, True, PURPLE, cw)
        txt(pdf, cx, cy + 17, "Enviamos un código a tu correo institucional", 8.5, False, MUTED, cw)
        for i in range(6):
            rect(pdf, cx + i * 17.5, cy + 40, 15, 20, SOFT, LINE, 2)
        txt(pdf, cx, cy + 69, "Código válido por tiempo limitado", 8, False, MUTED, cw)
        btn(pdf, cx, cy + 84, cw, 11, "Confirmar código", True)
        txt(pdf, cx + 21, cy + 106, "Reenviar código", 8.5, True, VIOLET, cw - 21)
    elif kind == "auth_account":
        txt(pdf, cx, cy + 1, "Mi cuenta", 17, True, PURPLE, cw)
        txt(pdf, cx, cy + 17, "Identidad compartida con la app móvil", 8.5, False, MUTED, cw)
        rect(pdf, cx, cy + 35, cw, 62, SOFT, LINE, 2)
        for i, (key, value) in enumerate([
            ("Nombre", "Usuario de ejemplo"),
            ("Correo", "nombre@uninorte.edu.co"),
            ("ID Roble", "Identificador de cuenta"),
        ]):
            yy = cy + 41 + i * 18
            txt(pdf, cx + 5, yy, key, 7.8, False, MUTED, cw - 10)
            txt(pdf, cx + 5, yy + 7, value, 9, True, PURPLE, cw - 10)
        btn(pdf, cx, cy + 106, cw, 11, "Ir a explorar", True)


def draw_wizard(pdf: FPDF, kind: str) -> None:
    variants = {
        "wizard_idea": (1, "Comencemos", "Tu idea puede generar un gran cambio."),
        "wizard_basic": (2, "Información básica", "Cuéntanos sobre tu proyecto."),
        "wizard_team": (3, "Equipo necesario", "¿Qué miembros necesitas?"),
        "wizard_time": (4, "Tiempo estimado", "¿Cuánto tiempo tomará?"),
        "wizard_audience": (5, "Audiencia", "¿Quién puede ver tu proyecto?"),
        "wizard_review": (6, "Revisar y publicar", "Confirma la información del proyecto."),
    }
    step, heading, subtitle = variants[kind]
    cx, cy, cw = wizard_shell(pdf, step, heading, subtitle)
    if kind == "wizard_idea":
        rect(pdf, cx + cw * 0.38, cy + 2, 43, 36, PALE, PALE, 3)
        txt(pdf, cx + cw * 0.38 + 6, cy + 16, "[mascota]", 9, False, VIOLET, 32)
        field(pdf, cx + 10, cy + 45, cw - 20, "Nombre de tu idea", "Ej. EcoCampus", 13)
    elif kind == "wizard_basic":
        field(pdf, cx + 8, cy + 1, cw - 16, "Nombre del proyecto", "EcoCampus", 10)
        field(pdf, cx + 8, cy + 23, cw - 16, "Descripción", "Diseñemos un campus más sostenible...", 22)
        field(pdf, cx + 8, cy + 60, cw - 16, "Categorías", "Medio ambiente, Impacto social", 10)
    elif kind == "wizard_team":
        for i, name in enumerate(["Diseñador/a", "Desarrollador/a", "Investigador/a", "Comunicador/a"]):
            xx = cx + 8 + (i % 2) * (cw / 2 - 3)
            yy = cy + 2 + (i // 2) * 17
            rect(pdf, xx, yy, cw / 2 - 8, 16, WHITE, LINE, 2)
            txt(pdf, xx + 4, yy + 5, name, 8.3, True, PURPLE, cw / 2 - 40)
            txt(pdf, xx + cw / 2 - 30, yy + 5, "−  1  +" if i < 2 else "−  0  +", 9, True, VIOLET, 24)
        field(pdf, cx + 8, cy + 38, cw - 16, "Límite de postulación", "19/11/2026", 9)
        row(pdf, cx + 8, cy + 56, cw - 16, "Tareas iniciales", "Agregar una tarea al proyecto", "+")
    elif kind == "wizard_time":
        for i, (title, desc) in enumerate([("Días", "1–30 días"), ("Semanas", "1–12 semanas"), ("Meses", "1–12 meses"), ("Años", "Más de un año")]):
            row(pdf, cx + 8, cy + i * 20, cw - 16, title, desc, "X" if title == "Meses" else "○")
    elif kind == "wizard_audience":
        row(pdf, cx + 8, cy + 7, cw - 16, "Solo yo", "El proyecto será privado", "○")
        row(pdf, cx + 8, cy + 31, cw - 16, "Toda la comunidad", "Visible para todos los usuarios", "X")
        rect(pdf, cx + 8, cy + 59, cw - 16, 22, PALE, PALE, 2)
        txt(pdf, cx + 13, cy + 66, "La audiencia puede cambiarse al editar el proyecto.", 8, False, MUTED, cw - 26)
    elif kind == "wizard_review":
        summary = [
            ("Nombre", "EcoCampus"), ("Descripción", "Campus más sostenible"),
            ("Equipo", "1 diseño · 1 desarrollo"), ("Duración", "Meses"),
            ("Audiencia", "Toda la comunidad"),
        ]
        for i, (label, value) in enumerate(summary):
            yy = cy + i * 15
            rect(pdf, cx + 8, yy, cw - 16, 14, WHITE, LINE, 0)
            txt(pdf, cx + 12, yy + 4, label, 8, False, MUTED, 43)
            txt(pdf, cx + 56, yy + 4, value, 8.5, True, PURPLE, cw - 72)


def draw_project_list(pdf: FPDF, draft: bool) -> None:
    cx, cy, cw = app_shell(pdf, "Mis proyectos", "Mis proyectos", "Proyectos que creas")
    btn(pdf, cx + cw - 50, cy - 22, 50, 11, "+ Nuevo proyecto", True)
    pill(pdf, cx, cy + 4, "Mis proyectos", PALE if draft else PURPLE,
         PURPLE if draft else WHITE, 48)
    pill(pdf, cx + 51, cy + 4, "Mis borradores", PURPLE if draft else PALE,
         WHITE if draft else PURPLE, 49)
    if draft:
        simple_project_card(pdf, cx, cy + 21, cw * 0.49,
                            "Proyecto de prueba", "Idea para colaborar.", "Borrador")
        btn(pdf, cx + 5, cy + 69, 36, 10, "Continuar edición", True)
        txt(pdf, cx, cy + 87, "Un borrador solo es visible para su creador.", 8.3, False, MUTED, cw)
    else:
        simple_project_card(pdf, cx, cy + 21, cw * 0.48,
                            "EcoCampus", "Diseñemos un campus sostenible.", "Publicado")
        simple_project_card(pdf, cx + cw * 0.51, cy + 21, cw * 0.49,
                            "Proyecto de prueba", "Idea para colaborar.", "Publicado")
        pill(pdf, cx + cw * 0.51 + 5, cy + 69, "Visible en Explorar", GREEN, PURPLE, 52)
        txt(pdf, cx, cy + 87, "El proyecto está listo para recibir solicitudes.", 8.3, False, MUTED, cw)


def detail_base(pdf: FPDF, variant: str) -> tuple[float, float, float]:
    cx, cy, cw = app_shell(pdf, "Explorar", "Detalle de proyecto", "Conoce la idea y su equipo")
    project_banner(pdf, cx, cy, cw, "EcoCampus")
    txt(pdf, cx, cy + 55, "Equipo necesario", 10.5, True, PURPLE, 80)
    rect(pdf, cx, cy + 67, cw * 0.57, 42, WHITE, LINE, 2)
    txt(pdf, cx + 5, cy + 72, "Diseñador/a", 9.5, True, PURPLE, cw * 0.48)
    txt(pdf, cx + 5, cy + 83, "1 de 1 cupos disponibles", 8, False, MUTED, cw * 0.48)
    if variant == "owner":
        pass
    elif variant == "pending":
        btn(pdf, cx + 5, cy + 94, cw * 0.57 - 10, 10, "Solicitud pendiente", pale=True)
    elif variant == "accepted":
        btn(pdf, cx + 5, cy + 94, cw * 0.57 - 10, 10, "Ya formas parte del equipo", pale=True)
    else:
        btn(pdf, cx + 5, cy + 94, cw * 0.57 - 10, 10, "Unirme al equipo", True)
    return cx, cy, cw


def draw_join(pdf: FPDF, kind: str) -> None:
    if kind in ("join_detail", "join_apply", "join_pending", "join_decision"):
        cx, cy, cw = detail_base(pdf, "owner" if kind == "join_decision" else "pending" if kind == "join_pending" else "normal")
        if kind == "join_detail":
            rect(pdf, cx + cw * 0.61, cy + 67, cw * 0.39, 42, SOFT, LINE, 2)
            txt(pdf, cx + cw * 0.64, cy + 72, "Información rápida", 9.5, True, PURPLE, cw * 0.32)
            txt(pdf, cx + cw * 0.64, cy + 86, "0 miembros · 0 solicitudes", 8, False, MUTED, cw * 0.32)
        elif kind == "join_apply":
            rect(pdf, cx + 30, cy + 5, cw - 60, 108, WHITE, PURPLE, 3)
            mx, mw = cx + 38, cw - 76
            txt(pdf, mx, cy + 13, "Solicitar un cupo", 13, True, PURPLE, mw)
            field(pdf, mx, cy + 31, mw, "Rol", "Diseñador/a", 10)
            field(pdf, mx, cy + 56, mw, "Mensaje al equipo", "Quiero aportar a este proyecto...", 22)
            btn(pdf, mx, cy + 94, mw, 10, "Enviar solicitud", True)
        elif kind == "join_pending":
            rect(pdf, cx + cw * 0.61, cy + 67, cw * 0.39, 42, PALE, LINE, 2)
            txt(pdf, cx + cw * 0.64, cy + 72, "Estado de mi solicitud", 9.5, True, PURPLE, cw * 0.32)
            pill(pdf, cx + cw * 0.64, cy + 87, "Pendiente", PALE, PURPLE, 32)
        else:
            rect(pdf, cx + cw * 0.61, cy + 65, cw * 0.39, 48, WHITE, LINE, 2)
            txt(pdf, cx + cw * 0.64, cy + 70, "Solicitud de Cuenta B", 9.5, True, PURPLE, cw * 0.33)
            txt(pdf, cx + cw * 0.64, cy + 82, "Rol: Diseñador/a", 8, False, MUTED, cw * 0.33)
            btn(pdf, cx + cw * 0.64, cy + 94, 35, 10, "Aceptar", True)
            btn(pdf, cx + cw * 0.64 + 39, cy + 94, 32, 10, "Rechazar")
    else:
        accepted = kind == "join_accepted"
        cx, cy, cw = app_shell(pdf, "Notificaciones", "Notificaciones", "Lo que ocurre en tus proyectos")
        rect(pdf, cx, cy + 6, cw, 32, GREEN if accepted else ROSE,
             GREEN if accepted else ROSE, 2)
        txt(pdf, cx + 6, cy + 12, "Solicitud aceptada" if accepted else "Solicitud no aceptada",
            12, True, PURPLE, cw - 12)
        txt(pdf, cx + 6, cy + 24,
            "Ya formas parte de EcoCampus como Diseñador/a." if accepted else
            "El cupo solicitado no fue asignado. Puedes explorar otras ideas.",
            8.5, False, INK, cw - 12)
        btn(pdf, cx, cy + 53, 60, 11,
            "Ver mi proyecto" if accepted else "Explorar proyectos", True)
        if accepted:
            row(pdf, cx, cy + 75, cw, "Equipo de EcoCampus", "1 miembro · Cupo de diseño ocupado", "Ver")


def draw_team(pdf: FPDF, kind: str) -> None:
    if kind == "team_roles":
        draw_wizard(pdf, "wizard_team")
        return
    cx, cy, cw = app_shell(pdf, "Mis proyectos", "Equipo de EcoCampus", "Gestiona roles y solicitudes")
    pill(pdf, cx, cy + 4, "Miembros", PALE, PURPLE, 32)
    pill(pdf, cx + 35, cy + 4, "Solicitudes", PALE, PURPLE, 35)
    row(pdf, cx, cy + 19, cw * 0.49, "Diseñador/a", "1 cupo requerido",
        "1/1" if kind == "team_ready" else "0/1")
    row(pdf, cx + cw * 0.51, cy + 19, cw * 0.49, "Desarrollador/a", "1 cupo requerido", "0/1")
    if kind == "team_manage":
        row(pdf, cx, cy + 46, cw, "Cuenta B solicita unirse", "Rol: Diseñador/a · Pendiente", "Ver")
        btn(pdf, cx, cy + 70, 41, 10, "Aceptar", True)
        btn(pdf, cx + 45, cy + 70, 40, 10, "Rechazar")
    elif kind == "team_confirm":
        row(pdf, cx, cy + 46, cw, "Cuenta B solicita unirse", "Rol: Diseñador/a · Pendiente", "Ver")
        rect(pdf, cx + 36, cy + 33, cw - 72, 82, WHITE, PURPLE, 3)
        mx, mw = cx + 44, cw - 88
        txt(pdf, mx, cy + 42, "¿Incorporar a Cuenta B?", 13, True, PURPLE, mw)
        txt(pdf, mx, cy + 57, "Ocupará 1 de 1 cupos de Diseñador/a.", 8.5, False, MUTED, mw)
        txt(pdf, mx, cy + 68, "Se notificará la decisión a la persona.", 8.5, False, MUTED, mw)
        btn(pdf, mx, cy + 89, 55, 11, "Cancelar")
        btn(pdf, mx + 59, cy + 89, mw - 59, 11, "Confirmar", True)
    elif kind == "team_ready":
        rect(pdf, cx, cy + 42, cw, 15, GREEN, GREEN, 2)
        txt(pdf, cx + 5, cy + 47, "Cuenta B se incorporó al equipo.", 9, True, PURPLE, cw - 10)
        row(pdf, cx, cy + 64, cw, "Cuenta B · Diseñador/a", "Miembro activo desde hoy", "1/1")
        txt(pdf, cx, cy + 88, "El cupo de diseño está completo; desarrollo sigue abierto.", 8.5, False, MUTED, cw)


def draw_explore(pdf: FPDF, kind: str) -> None:
    if kind == "explore_detail":
        cx, cy, cw = detail_base(pdf, "normal")
        txt(pdf, cx, cy + 114, "Categorías: Medio ambiente · Impacto social", 8, False, MUTED, cw)
        return
    cx, cy, cw = app_shell(pdf, "Explorar", "Explorar proyectos", "Descubre ideas y únete a las que te inspiran")
    query = "zzzzzz" if kind == "explore_empty" else "medio ambiente" if kind == "explore_results" else "nombre o categoría"
    rect(pdf, cx, cy + 2, cw * 0.72, 13, WHITE, LINE, 2)
    txt(pdf, cx + 5, cy + 6, "Buscar: " + query, 8.5, False, MUTED, cw * 0.66)
    btn(pdf, cx + cw * 0.75, cy + 2, cw * 0.25, 13, "Filtros")
    pill(pdf, cx, cy + 20, "Todos", PURPLE if kind != "explore_followed" else PALE,
         WHITE if kind != "explore_followed" else PURPLE, 30)
    pill(pdf, cx + 33, cy + 20, "Seguidos", PURPLE if kind == "explore_followed" else PALE,
         WHITE if kind == "explore_followed" else PURPLE, 36)
    if kind == "explore_empty":
        rect(pdf, cx, cy + 43, cw, 62, SOFT, LINE, 2)
        txt(pdf, cx + 68, cy + 59, "No encontramos proyectos", 13, True, PURPLE, 100)
        txt(pdf, cx + 61, cy + 74, "Prueba otra palabra o limpia los filtros.", 8.5, False, MUTED, 120)
        btn(pdf, cx + 75, cy + 90, 75, 10, "Limpiar búsqueda")
        return
    if kind == "explore_followed":
        simple_project_card(pdf, cx, cy + 42, cw * 0.48, "EcoCampus", "Proyecto que sigues", "Publicado")
        txt(pdf, cx, cy + 92, "Los proyectos seguidos aparecen aquí para volver fácilmente.", 8.2, False, MUTED, cw)
        return
    if kind == "explore_results":
        pill(pdf, cx + 78, cy + 21, "Medio ambiente ×", GREEN, PURPLE, 55)
        simple_project_card(pdf, cx, cy + 42, cw * 0.48, "EcoCampus", "Campus más sostenible", "Publicado")
        simple_project_card(pdf, cx + cw * 0.51, cy + 42, cw * 0.49, "GreenLab", "Soluciones ambientales", "Publicado")
        return
    simple_project_card(pdf, cx, cy + 42, cw * 0.31, "EcoCampus", "Campus más sostenible", "Publicado")
    simple_project_card(pdf, cx + cw * 0.345, cy + 42, cw * 0.31, "GreenLab", "Soluciones ambientales", "Publicado")
    simple_project_card(pdf, cx + cw * 0.69, cy + 42, cw * 0.31, "QuizPro", "Actividades de aprendizaje", "Publicado")
    if kind == "explore_filters":
        rect(pdf, cx + cw - 76, cy + 4, 76, 104, WHITE, PURPLE, 2)
        txt(pdf, cx + cw - 70, cy + 10, "Filtros", 12, True, PURPLE, 62)
        for i, (label, value) in enumerate([
            ("Categoría", "Medio ambiente"),
            ("Con cupos", "Sí"),
            ("Duración", "Cualquiera"),
        ]):
            field(pdf, cx + cw - 70, cy + 25 + i * 22, 64, label, value, 9)
        btn(pdf, cx + cw - 70, cy + 92, 64, 10, "Aplicar filtros", True)


def draw_profile(pdf: FPDF, kind: str) -> None:
    if kind == "profile_main":
        cx, cy, cw = app_shell(pdf, "Perfil", "Perfil", "Tu espacio en Proyéctate")
        rect(pdf, cx, cy + 5, cw * 0.39, 94, WHITE, LINE, 2)
        rect(pdf, cx + 25, cy + 15, 28, 28, PALE, PALE, 14)
        txt(pdf, cx + 30, cy + 26, "[foto]", 8, False, VIOLET, 20)
        txt(pdf, cx + 13, cy + 49, "Cuenta de ejemplo", 11, True, PURPLE, 60)
        txt(pdf, cx + 20, cy + 61, "@cuenta", 8.5, False, MUTED, 40)
        btn(pdf, cx + 18, cy + 74, 46, 11, "Editar perfil")
        right_x = cx + cw * 0.43
        txt(pdf, right_x, cy + 5, "Resumen de trayectoria", 11.5, True, PURPLE, cw * 0.54)
        stats = [("2", "Proyectos creados"), ("0", "Tareas completadas"),
                 ("0", "Participaciones"), ("Bajo", "Compromiso")]
        for i, (value, label) in enumerate(stats):
            xx = right_x + (i % 2) * (cw * 0.28)
            yy = cy + 23 + (i // 2) * 37
            rect(pdf, xx, yy, cw * 0.25, 32, WHITE, LINE, 2)
            txt(pdf, xx + 5, yy + 5, value, 13, True, PURPLE, cw * 0.2)
            txt(pdf, xx + 5, yy + 19, label, 7.4, False, MUTED, cw * 0.2)
        btn(pdf, right_x, cy + 100, 66, 10, "Ver trayectoria")
    else:
        cx, cy, cw = app_shell(pdf, "Perfil", "Resumen de trayectoria", "Tu progreso en proyectos y tareas")
        stats = [("2", "Proyectos creados"), ("0", "Tareas completadas"),
                 ("0", "Participaciones"), ("Bajo", "Compromiso")]
        for i, (value, label) in enumerate(stats):
            xx = cx + i * (cw / 4)
            rect(pdf, xx, cy + 4, cw / 4 - 5, 32, WHITE, LINE, 2)
            txt(pdf, xx + 5, cy + 10, value, 13, True, PURPLE, cw / 4 - 12)
            txt(pdf, xx + 5, cy + 24, label, 7.4, False, MUTED, cw / 4 - 12)
        txt(pdf, cx, cy + 48, "Tu desempeño", 11.5, True, PURPLE, cw)
        for i, (name, amount) in enumerate([("Colaboración", 0.42),
                                             ("Cumplimiento", 0.16),
                                             ("Calidad", 0.68)]):
            yy = cy + 64 + i * 18
            txt(pdf, cx, yy, name, 8.5, True, PURPLE, 55)
            rect(pdf, cx + 58, yy + 1, cw - 62, 5, PALE, PALE, 2)
            rect(pdf, cx + 58, yy + 1, (cw - 62) * amount, 5, VIOLET, VIOLET, 2)


def draw_screen(pdf: FPDF, kind: str) -> None:
    if kind.startswith("auth_"):
        draw_auth(pdf, kind)
    elif kind.startswith("wizard_"):
        draw_wizard(pdf, kind)
    elif kind in ("project_draft", "project_published"):
        draw_project_list(pdf, kind == "project_draft")
    elif kind.startswith("join_"):
        draw_join(pdf, kind)
    elif kind.startswith("team_"):
        draw_team(pdf, kind)
    elif kind.startswith("explore_"):
        draw_explore(pdf, kind)
    elif kind.startswith("profile_"):
        draw_profile(pdf, kind)
    else:
        raise ValueError(f"Pantalla desconocida: {kind}")


def cover(pdf: FPDF) -> None:
    pdf.add_page()
    pdf.set_fill_color(*WHITE)
    pdf.rect(0, 0, PAGE_W, PAGE_H, style="F")
    pdf.set_fill_color(*PURPLE)
    pdf.rect(0, 0, PAGE_W, 5, style="F")
    rect(pdf, 13, 18, 271, 47, PALE, PALE, 4)
    txt(pdf, 22, 26, "Wireframes diseñados por tareas", 24, True, PURPLE, 246)
    txt(pdf, 22, 48, "Proyéctate web · Grupo 10 · 9 de noviembre de 2026", 11, False, MUTED, 240)
    txt(pdf, 13, 75, f"5 tareas · {TOTAL_SCREENS} pantallas diseñadas · 2 vistas de apoyo", 13, True, PURPLE, 270)
    page = 2
    for index, (name, purpose, screens) in enumerate(FLOWS, 1):
        y = 87 + (index - 1) * 17
        rect(pdf, 13, y, 271, 15, SOFT, LINE, 2)
        txt(pdf, 18, y + 4, f"{index}. {name}", 11.5, True, PURPLE, 74)
        txt(pdf, 92, y + 4, purpose, 9.2, False, MUTED, 139)
        txt(pdf, 239, y + 4, f"p. {page}–{page + len(screens) - 1}", 8.5, True, VIOLET, 40)
        page += len(screens)
    rect(pdf, 13, 172, 271, 15, PALE, PALE, 2)
    txt(pdf, 18, 176, "Anexo: Perfil y Trayectoria", 10.5, True, PURPLE, 90)
    txt(pdf, 119, 176, "Pantallas transversales del prototipo original", 9, False, MUTED, 115)
    txt(pdf, 239, 176, f"p. {page}–{page + len(SUPPORT_SCREENS) - 1}", 8.5, True, VIOLET, 40)
    txt(pdf, 13, 194, "Los wireframes propuestos son diseños. Su presencia aquí no indica que el estado esté implementado ni conectado a Roble.", 8, False, MUTED, 270)
    txt(pdf, 272, 201, f"1/{TOTAL_PAGES}", 8, False, MUTED, 13)


def closing(pdf: FPDF) -> None:
    pdf.add_page()
    pdf.set_fill_color(*WHITE)
    pdf.rect(0, 0, PAGE_W, PAGE_H, style="F")
    pdf.set_fill_color(*PURPLE)
    pdf.rect(0, 0, PAGE_W, 5, style="F")
    txt(pdf, 13, 18, "Cómo usar estos wireframes", 22, True, PURPLE, 260)
    lines = [
        ("Referencia actual", "Distribución basada en la web o el prototipo existente; el dibujo es nuevo."),
        ("Estado diseñado", "Variante necesaria para entender el recorrido; verificarla contra la implementación."),
        ("Propuesta nueva", "Pantalla sugerida para completar la tarea; aún requiere decisión de producto e implementación."),
    ]
    for i, (name, desc) in enumerate(lines):
        y = 48 + i * 30
        pill(pdf, 15, y, name, PALE if i < 2 else GREEN, PURPLE, 43)
        txt(pdf, 65, y + 1, desc, 10, False, INK, 216)
    rule(pdf, 13, 145, 271)
    txt(pdf, 13, 154, "Siguientes validaciones", 15, True, PURPLE, 260)
    txt(pdf, 17, 170, "• Aceptar o rechazar una solicitud y comprobar miembros, cupos y aviso a B.", 10, False, INK, 260)
    txt(pdf, 17, 181, "• Corregir permisos de Roble antes de activar datos reales compartidos.", 10, False, INK, 260)
    txt(pdf, 272, 201, f"{TOTAL_PAGES}/{TOTAL_PAGES}", 8, False, MUTED, 20)


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("docs/WIREFRAMES_DISENADOS_POR_TAREAS_2026-11-09.pdf")
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)
    fonts = Path("/System/Library/Fonts/Supplemental")
    pdf.add_font("Arial", style="", fname=str(fonts / "Arial.ttf"))
    pdf.add_font("Arial", style="B", fname=str(fonts / "Arial Bold.ttf"))
    pdf.set_title("Proyéctate - Wireframes diseñados por tareas")
    pdf.set_author("Grupo 10")
    pdf.set_subject("Cinco tareas y vistas de apoyo diseñadas para la web")
    cover(pdf)
    page = 2
    for task_index, (task_name, _purpose, screens) in enumerate(FLOWS, 1):
        for screen_index, (title, route, status, kind) in enumerate(screens, 1):
            page_header(pdf, page, task_index, task_name, screen_index,
                        len(screens), title, route, status)
            draw_screen(pdf, kind)
            page += 1
    for screen_index, (title, route, status, kind) in enumerate(SUPPORT_SCREENS, 1):
        page_header(pdf, page, 0, "Perfil y trayectoria", screen_index,
                    len(SUPPORT_SCREENS), title, route, status)
        draw_screen(pdf, kind)
        page += 1
    closing(pdf)
    output.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output))
    print(f"Generado: {output} ({pdf.page_no()} páginas, {TOTAL_SCREENS} pantallas)")


if __name__ == "__main__":
    main()
