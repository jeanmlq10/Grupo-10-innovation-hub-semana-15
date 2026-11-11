#!/usr/bin/env python3
"""
Genera roble/demo/2026-11_seed_demo.sql: los datos de demostración de Proyéctate.

- Todos los registros llevan "demoSeed" = 'demo-2026-11' (se borran con
  roble/demo/2026-11_limpiar_demo.sql sin tocar datos reales).
- Los usuarios NO se inventan: cada id sale de auth.users por correo, así que
  las 4 cuentas deben existir antes de ejecutar el SQL.
- Los ids de las filas son UUID deterministas (uuid5), así el script es
  reproducible y todas las relaciones (projectId, taskId, requestId,
  parentId) apuntan a filas reales del mismo seed.
- La Consola SQL de Roble solo acepta SELECT, CREATE TABLE, INSERT,
  DELETE con WHERE y ALTER TABLE ADD COLUMN: por eso solo hay INSERT.

Uso:  python3 scripts/demo/generar_seed_sql.py
"""
import json
import pathlib
import uuid

SEED = "demo-2026-11"
NS = uuid.UUID("6d1f5a3e-2b7c-4f0a-9e1d-3c5b7a9e0f11")
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "roble" / "demo" / "2026-11_seed_demo.sql"


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


EMAILS = {
    "P": "prueba@uninorte.edu.co",
    "C": "prueba.creador@uninorte.edu.co",
    "M": "prueba.integrante@uninorte.edu.co",
    "S": "prueba.externo@uninorte.edu.co",
}
NAMES = {"P": "Usuario Prueba", "C": "Camila Rojas", "M": "Mateo Díaz", "S": "Sofía Herrera"}


def U(who: str) -> str:
    return f"(SELECT id FROM auth.users WHERE email='{EMAILS[who]}')"


def lit(v):
    """Valor SQL literal."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, RawSQL):
        return v.sql
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


class RawSQL:
    def __init__(self, sql: str):
        self.sql = sql


def user(who: str) -> RawSQL:
    return RawSQL(U(who))


statements: list[str] = []


def insert(table: str, row: dict):
    row = {"demoSeed": SEED, **row}
    cols = ", ".join(f'"{c}"' if c not in ("_id", "_owner") else c for c in row)
    vals = ", ".join(lit(v) for v in row.values())
    statements.append(f"INSERT INTO public.{table} ({cols}) VALUES ({vals});")


def ts(day: str, hhmm: str = "10:00") -> str:
    """Fecha ISO en UTC a partir de una hora local de Barranquilla (UTC-5)."""
    h, m = map(int, hhmm.split(":"))
    h += 5
    d = day
    if h >= 24:
        h -= 24
        y, mo, dd = map(int, day.split("-"))
        import datetime

        d = (datetime.date(y, mo, dd) + datetime.timedelta(days=1)).isoformat()
    return f"{d}T{h:02d}:{m:02d}:00.000Z"


# ─────────────────────────── Perfiles ───────────────────────────
PROFILES = {
    "P": ("usuario.prueba", "Diseño de interfaces y contenido visual. Me gusta sumar a proyectos con impacto en el campus.", "Ingeniería de Sistemas"),
    "C": ("camirojas", "Creo y lidero proyectos de innovación universitaria. Emprendimiento, cultura y tecnología.", "Ingeniería Industrial"),
    "M": ("mateo.dev", "Desarrollo móvil y backend. Siempre buscando con quién construir la próxima idea.", "Ingeniería de Sistemas"),
    "S": ("sofi.herrera", "Música y gestión cultural. Exploro proyectos para participar.", "Música"),
}
for who, (username, bio, career) in PROFILES.items():
    insert("user_profiles", {
        "_id": uid(f"profile-{who}"), "_owner": user(who), "userId": user(who), "name": NAMES[who],
        "username": username, "bio": bio, "career": career, "profileVisibility": "public",
        "contactPermission": "everyone", "activityVisibility": "everyone", "notificationsEnabled": True,
        "mutedNotifications": "[]", "updatedAt": ts("2026-11-09", "18:00"), "avatarIcon": "",
    })

# ─────────────────────────── Proyectos ──────────────────────────
PROJECTS = {
    "INSTAGRAM": dict(
        description=(
            "INSTAGRAM es una red social universitaria para compartir fotografía y contenido del campus. "
            "Cada estudiante publica fotos de sus proyectos, eventos y clases; las agrupaciones crean "
            "historias temporales de sus actividades y la comunidad se comunica por comentarios y mensajes "
            "directos. Busca que lo que pasa en la universidad se vea y se comparta en un solo lugar, "
            "con moderación pensada para un entorno académico."
        ),
        categories=["Tecnología"], stage="Desarrollo · MVP en pruebas internas", duration="Meses",
        teamRoles={"Desarrollador/a": 2, "Diseñador/a": 1, "Comunicador/a": 1},
        accepted={"Desarrollador/a": 1, "Diseñador/a": 1}, teamDeadline="2026-12-05", created=ts("2026-09-08", "09:15"),
        objectives=[
            "Publicar fotos y carruseles con descripción, etiquetas de lugar y mención de agrupaciones.",
            "Historias de 24 horas para eventos en vivo del campus.",
            "Mensajes directos y comentarios con herramientas de moderación y reporte.",
            "Lanzar un piloto con 200 estudiantes antes de terminar el semestre.",
        ],
    ),
    "CHISPA": dict(
        description=(
            "CHISPA conecta las agrupaciones culturales del Caribe colombiano con su público. Reúne en una "
            "agenda los eventos de cumbia, bullerengue, millo y danza; muestra en un mapa dónde se presentan "
            "las agrupaciones y les da un perfil con su historia, repertorio y próximas fechas. El objetivo es "
            "visibilizar el folclor de la región y facilitar que más personas lleguen a sus presentaciones, "
            "especialmente en temporada de Carnaval."
        ),
        categories=["Arte y cultura"], stage="Convocatoria abierta · diseño de la agenda", duration="Meses",
        teamRoles={"Desarrollador/a": 1, "Investigador/a": 1, "Comunicador/a": 2},
        accepted={"Comunicador/a": 1}, teamDeadline="2026-12-15", created=ts("2026-09-22", "16:40"),
        objectives=[
            "Agenda cultural con filtros por municipio, género musical y fecha.",
            "Perfiles de agrupaciones con historia, integrantes y repertorio.",
            "Mapa de presentaciones en Barranquilla, Soledad, Puerto Colombia y Malambo.",
            "Registrar al menos 30 agrupaciones antes del Carnaval 2027.",
        ],
    ),
    "POLAR CRAVING": dict(
        description=(
            "POLAR CRAVING es una marca de postres fríos con sabores del Caribe: paletas de frutas como corozo, "
            "mango biche y tamarindo, y helados artesanales servidos en la universidad. El proyecto desarrolla "
            "la identidad visual, el empaque, el catálogo digital y un sistema de pedidos para un punto de venta "
            "en el campus, con un piloto de ventas para validar precios y sabores."
        ),
        categories=["Emprendimiento"], stage="Prototipo de marca · piloto de ventas", duration="Semanas",
        teamRoles={"Diseñador/a": 1, "Comunicador/a": 1, "Líder de proyecto": 1},
        accepted={"Diseñador/a": 1, "Comunicador/a": 1}, teamDeadline="2026-11-28", created=ts("2026-10-01", "11:05"),
        objectives=[
            "Definir la identidad visual: logo, paleta fría y empaques reciclables.",
            "Catálogo digital con 8 sabores y precios por presentación.",
            "Pedidos anticipados desde la app con recogida en el punto del campus.",
            "Vender 300 unidades en el piloto de dos semanas.",
        ],
    ),
    "ARTFEST": dict(
        description=(
            "ARTFEST organiza y promociona festivales artísticos universitarios. Abre la convocatoria de artistas "
            "(música, danza, teatro y artes visuales), arma el cronograma de escenarios, coordina voluntarios y "
            "gestiona la entrada al evento. La primera edición se planea para el cierre del semestre en la plaza "
            "central de la universidad."
        ),
        categories=["Arte y cultura"], stage="Planeación · convocatoria de artistas", duration="Meses",
        teamRoles={"Comunicador/a": 1, "Diseñador/a": 1, "Productor/a de eventos": 1},
        accepted={}, teamDeadline="2026-12-10", created=ts("2026-10-20", "14:30"),
        objectives=[
            "Recibir y seleccionar propuestas de al menos 25 artistas.",
            "Publicar el cronograma por escenarios y franjas horarias.",
            "Coordinar 40 voluntarios con turnos y funciones claras.",
            "Gestionar inscripciones gratuitas con cupos por actividad.",
        ],
    ),
    "DUO": dict(
        description=(
            "DUO conecta a dos personas con habilidades complementarias para desarrollar una idea en pareja: "
            "quien tiene la idea encuentra a quien sabe construirla. Cada persona describe sus habilidades e "
            "intereses, DUO sugiere compañeros compatibles y la pareja trabaja con un tablero compartido de "
            "tareas y acuerdos. El MVP ya se entregó y se probó con estudiantes de dos facultades."
        ),
        categories=["Educación"], stage="Completado · MVP entregado", duration="Semanas",
        teamRoles={"Desarrollador/a": 1}, accepted={"Desarrollador/a": 1}, teamDeadline="2026-09-30",
        created=ts("2026-08-25", "08:50"),
        objectives=[
            "Emparejar estudiantes por habilidades complementarias e intereses.",
            "Tablero compartido de tareas y acuerdos para cada pareja.",
            "Probar el MVP con 20 parejas de dos facultades.",
        ],
    ),
}
PID = {name: uid(f"project-{name}") for name in PROJECTS}

for name, p in PROJECTS.items():
    insert("projects", {
        "_id": PID[name], "_owner": user("C"), "name": name, "description": p["description"],
        "categories": p["categories"], "canApply": name != "DUO", "teamRoles": p["teamRoles"],
        "acceptedRoleCounts": p["accepted"], "duration": p["duration"], "audience": "Toda la comunidad",
        "isDraft": False, "acceptedMembersCount": sum(p["accepted"].values()), "createdBy": user("C"),
        "createdByName": NAMES["C"], "createdAt": p["created"], "teamDeadline": p["teamDeadline"],
        "objectives": p["objectives"], "stage": p["stage"],
    })

# ─────────────────────────── Tareas ─────────────────────────────
# (proyecto, clave, título, descripción, requeridas, aceptadas, deadline, status, visibilidad)
TASKS = [
    ("INSTAGRAM", "ig-feed", "Diseñar el feed de publicaciones", "Pantallas del feed, detalle de foto y perfil siguiendo el sistema visual.", 1, 1, "2026-11-20", "in_progress", "public"),
    ("INSTAGRAM", "ig-upload", "Carga de fotos con compresión", "Subir imágenes comprimidas y generar miniaturas en el almacenamiento.", 1, 1, "2026-10-30", "completed", "public"),
    ("INSTAGRAM", "ig-moderation", "Moderación de comentarios reportados", "Flujo para revisar reportes y ocultar comentarios ofensivos.", 2, 0, "2026-12-01", "available", "public"),
    ("INSTAGRAM", "ig-metrics", "Definir métricas internas de retención", "Qué medir en el piloto: usuarios activos, publicaciones por semana y reportes.", 1, 0, "2026-11-25", "available", "team"),
    ("INSTAGRAM", "ig-demo", "Preparar demo para el comité de innovación", "Guion, datos de ejemplo y video corto del MVP.", 1, 0, "2026-11-27", "in_progress", "team"),
    ("CHISPA", "ch-map", "Mapa de presentaciones", "Ubicar las presentaciones confirmadas en el mapa del área metropolitana.", 1, 0, "2026-12-05", "available", "public"),
    ("CHISPA", "ch-agenda", "Agenda de Carnaval 2027", "Recopilar fechas de precarnaval y Carnaval con las agrupaciones registradas.", 2, 1, "2026-12-12", "in_progress", "public"),
    ("CHISPA", "ch-interviews", "Entrevistas con directores de agrupaciones", "Guion y agenda de entrevistas para los perfiles de las agrupaciones.", 1, 0, "2026-11-30", "available", "team"),
    ("CHISPA", "ch-photos", "Sesión de fotos del grupo de millo", "Fotografías para el perfil de la primera agrupación registrada.", 1, 1, "2026-10-25", "completed", "public"),
    ("POLAR CRAVING", "pc-pack", "Diseño de empaque de paletas", "Empaque reciclable con la paleta fría de la marca y la información nutricional.", 1, 1, "2026-11-05", "completed", "public"),
    ("POLAR CRAVING", "pc-catalog", "Catálogo digital de sabores", "Fichas de los 8 sabores con foto, precio y alérgenos.", 1, 0, "2026-11-18", "in_progress", "public"),
    ("POLAR CRAVING", "pc-costs", "Costeo y precios del piloto", "Costos por unidad y margen esperado para el piloto de dos semanas.", 1, 0, "2026-11-15", "in_progress", "team"),
    ("POLAR CRAVING", "pc-tasting", "Cata de sabores con estudiantes", "Organizar una cata con 40 estudiantes y registrar resultados.", 2, 0, "2026-11-22", "available", "public"),
    ("ARTFEST", "af-call", "Publicar convocatoria de artistas", "Formulario, bases y piezas gráficas de la convocatoria.", 1, 0, "2026-11-25", "available", "public"),
    ("ARTFEST", "af-volunteers", "Plan de voluntarios", "Turnos, funciones y capacitación de los voluntarios del festival.", 2, 0, "2026-12-01", "available", "public"),
    ("ARTFEST", "af-budget", "Presupuesto y patrocinios", "Presupuesto detallado y lista de posibles patrocinadores.", 1, 0, "2026-11-28", "available", "team"),
    ("DUO", "duo-match", "Algoritmo de emparejamiento", "Puntaje de compatibilidad por habilidades e intereses.", 1, 1, "2026-09-20", "completed", "public"),
    ("DUO", "duo-board", "Tablero compartido de la pareja", "Tablero de tareas y acuerdos para cada pareja.", 1, 0, "2026-09-25", "completed", "public"),
    ("DUO", "duo-test", "Prueba piloto con 20 parejas", "Sesiones de prueba y encuesta de satisfacción.", 1, 0, "2026-09-30", "completed", "team"),
]
TID = {}
for proj, key, title, desc, req, acc, deadline, status, vis in TASKS:
    TID[key] = uid(f"task-{key}")
    insert("project_tasks", {
        "_id": TID[key], "_owner": user("C"), "projectId": PID[proj],
        "title": "" if vis == "team" else title, "description": "" if vis == "team" else desc,
        "requiredCount": req, "acceptedCount": acc, "deadline": deadline, "status": status, "visibility": vis,
    })
    if vis == "team":
        insert("project_task_private", {
            "_id": uid(f"taskpriv-{key}"), "_owner": user("C"), "taskId": TID[key], "projectId": PID[proj],
            "title": title, "description": desc,
        })
TASK_TITLE = {key: title for _, key, title, *_ in TASKS}

# ──────────────── Solicitudes, decisiones e integrantes ────────────────
# (clave, quién, proyecto, tipo, rol o tarea, mensaje, creada, decisión, decidida)
REQUESTS = [
    ("r-ig-p-team", "P", "INSTAGRAM", "team", "Diseñador/a", "Tengo experiencia en Figma y sistemas de diseño. Me encantaría diseñar las pantallas del feed.", ts("2026-09-12", "10:20"), "accepted", ts("2026-09-13", "09:00")),
    ("r-ig-p-task", "P", "INSTAGRAM", "task", "ig-feed", "Puedo encargarme del feed y entregar los prototipos en dos semanas.", ts("2026-10-28", "15:10"), "accepted", ts("2026-10-29", "08:40")),
    ("r-ig-m-team", "M", "INSTAGRAM", "team", "Desarrollador/a", "Trabajo con React Native y Roble. Puedo apoyar la carga de imágenes.", ts("2026-09-10", "19:00"), "accepted", ts("2026-09-11", "07:30")),
    ("r-ig-m-task", "M", "INSTAGRAM", "task", "ig-upload", "Ya tengo una prueba de compresión de imágenes funcionando.", ts("2026-10-05", "12:00"), "accepted", ts("2026-10-05", "17:45")),
    ("r-ch-p-team", "P", "CHISPA", "team", "Comunicador/a", "Me gustaría manejar las redes y la cobertura fotográfica de las presentaciones.", ts("2026-10-02", "18:30"), "accepted", ts("2026-10-03", "10:15")),
    ("r-ch-p-task", "P", "CHISPA", "task", "ch-agenda", "Conozco a varias agrupaciones de Soledad y puedo recopilar sus fechas.", ts("2026-10-18", "09:40"), "accepted", ts("2026-10-18", "14:00")),
    ("r-ch-s-team", "S", "CHISPA", "team", "Investigador/a", "Estudio música y he investigado el bullerengue; puedo documentar la historia de las agrupaciones.", ts("2026-11-08", "20:15"), None, None),
    ("r-pc-p-team", "P", "POLAR CRAVING", "team", "Diseñador/a", "Puedo diseñar el logo y el empaque con una paleta fría.", ts("2026-10-04", "13:00"), "accepted", ts("2026-10-04", "18:20")),
    ("r-pc-p-task", "P", "POLAR CRAVING", "task", "pc-pack", "Ya tengo bocetos del empaque reciclable.", ts("2026-10-15", "11:30"), "accepted", ts("2026-10-15", "16:00")),
    ("r-pc-m-team", "M", "POLAR CRAVING", "team", "Comunicador/a", "Puedo manejar el catálogo y las publicaciones del piloto.", ts("2026-10-06", "08:10"), "accepted", ts("2026-10-06", "12:30")),
    ("r-pc-s-team", "S", "POLAR CRAVING", "team", "Líder de proyecto", "Me interesa liderar el piloto de ventas.", ts("2026-10-25", "17:00"), "rejected", ts("2026-10-27", "09:10")),
    ("r-af-p-team", "P", "ARTFEST", "team", "Diseñador/a", "Quiero diseñar la identidad del festival y las piezas de la convocatoria.", ts("2026-11-07", "16:45"), None, None),
    ("r-af-m-task", "M", "ARTFEST", "task", "af-volunteers", "Puedo armar el sistema de turnos para voluntarios.", ts("2026-11-09", "10:05"), None, None),
    ("r-duo-m-team", "M", "DUO", "team", "Desarrollador/a", "Quiero construir el algoritmo de emparejamiento.", ts("2026-08-28", "14:00"), "accepted", ts("2026-08-29", "09:00")),
    ("r-duo-m-task", "M", "DUO", "task", "duo-match", "Propongo un puntaje por habilidades e intereses comunes.", ts("2026-09-02", "11:00"), "accepted", ts("2026-09-02", "15:30")),
]
RID = {}
for key, who, proj, typ, target, msg, created, decision, decided in REQUESTS:
    RID[key] = uid(f"request-{key}")
    is_task = typ == "task"
    role = TASK_TITLE[target] if is_task else target
    insert("project_requests", {
        "_id": RID[key], "_owner": user(who), "projectId": PID[proj], "type": typ,
        "taskId": TID[target] if is_task else None, "teamRoleId": None if is_task else target, "role": role,
        "message": msg, "applicantUserId": user(who), "applicantName": NAMES[who], "applicantEmail": EMAILS[who],
        "status": "pending", "createdAt": created, "updatedAt": created,
    })
    if decision:
        insert("request_decisions", {
            "_id": uid(f"decision-{key}"), "_owner": user("C"), "requestId": RID[key], "status": decision,
            "decidedAt": decided,
        })
        if decision == "accepted":
            insert("project_members", {
                "_id": uid(f"member-{key}"), "_owner": user("C"), "projectId": PID[proj], "userId": user(who),
                "name": NAMES[who], "email": EMAILS[who], "role": role, "joinedAt": decided,
                "sourceType": "task" if is_task else "team", "sourceId": TID[target] if is_task else target,
            })

# ─────────────────────────── Comentarios ────────────────────────
# (clave, proyecto, autor, texto, fecha, responde_a)
COMMENTS = [
    ("c-ig-1", "INSTAGRAM", "M", "Subí la primera versión de la compresión: las fotos bajan de 4 MB a unos 350 KB sin perder calidad visible.", ts("2026-10-30", "18:20"), None),
    ("c-ig-2", "INSTAGRAM", "P", "¡Se ve muy bien! Ajusté el feed para mostrar las miniaturas mientras carga la foto completa.", ts("2026-10-31", "09:05"), "c-ig-1"),
    ("c-ig-3", "INSTAGRAM", "C", "Excelente avance. El viernes lo mostramos al comité de innovación.", ts("2026-10-31", "12:40"), "c-ig-1"),
    ("c-ch-1", "CHISPA", "S", "¿Habrá presentaciones en Barranquilla durante el precarnaval? Me gustaría proponer un conversatorio sobre bullerengue.", ts("2026-11-08", "20:30"), None),
    ("c-ch-2", "CHISPA", "C", "¡Sí! Estamos armando la agenda del precarnaval. Envíame tu propuesta por la solicitud de Investigador/a.", ts("2026-11-09", "08:15"), "c-ch-1"),
    ("c-ch-3", "CHISPA", "P", "Puedo cubrir con fotos las presentaciones del grupo de millo de Soledad este sábado.", ts("2026-11-06", "17:50"), None),
    ("c-ch-4", "CHISPA", "C", "Perfecto, te paso el contacto del director. Las fotos del primer ensayo quedaron increíbles.", ts("2026-11-07", "10:30"), "c-ch-3"),
    ("c-pc-1", "POLAR CRAVING", "M", "Probé la paleta de corozo con leche condensada: es la favorita de la oficina de bienestar.", ts("2026-11-04", "15:00"), None),
    ("c-pc-2", "POLAR CRAVING", "C", "La agregamos al catálogo como sabor destacado del piloto.", ts("2026-11-04", "19:10"), "c-pc-1"),
    ("c-pc-3", "POLAR CRAVING", "P", "Ya quedó el empaque final en la carpeta del equipo. ¿Lo imprimimos en cartón kraft?", ts("2026-11-05", "11:00"), None),
    ("c-af-1", "ARTFEST", "S", "¿Pueden participar grupos de música que no sean de la universidad?", ts("2026-11-09", "13:20"), None),
    ("c-af-2", "ARTFEST", "C", "La primera edición es para estudiantes, pero cada grupo puede invitar a un artista externo.", ts("2026-11-09", "16:45"), "c-af-1"),
    ("c-duo-1", "DUO", "M", "Cerramos el piloto: 17 de 20 parejas terminaron su idea y el puntaje de satisfacción fue 4,6 sobre 5.", ts("2026-10-02", "10:00"), None),
    ("c-duo-2", "DUO", "C", "Gran cierre. Gracias por construir el emparejamiento, Mateo.", ts("2026-10-02", "14:30"), "c-duo-1"),
]
CID = {}
for key, proj, who, text, created, parent in COMMENTS:
    CID[key] = uid(f"comment-{key}")
    row = {
        "_id": CID[key], "_owner": user(who), "projectId": PID[proj], "authorUserId": user(who),
        "authorName": NAMES[who], "text": text, "createdAt": created,
    }
    if parent:
        row["parentId"] = CID[parent]
    insert("project_comments", row)

# ─────────────────────────── Seguidores ─────────────────────────
for key, who, proj, created in [
    ("f-s-ch", "S", "CHISPA", ts("2026-11-08", "20:10")),
    ("f-s-af", "S", "ARTFEST", ts("2026-11-09", "13:00")),
    ("f-p-af", "P", "ARTFEST", ts("2026-11-07", "16:30")),
    ("f-m-ch", "M", "CHISPA", ts("2026-10-12", "09:00")),
]:
    insert("project_follows", {"_id": uid(key), "_owner": user(who), "projectId": PID[proj], "userId": user(who), "createdAt": created})

# ────────────────────────── Notificaciones ──────────────────────
# Cada una corresponde a una acción del seed (solicitud, decisión, comentario,
# respuesta, tarea, mensaje). (clave, para, de, tipo, título, mensaje, proyecto, solicitud, detalle, fecha, leída)
NOTIFS = [
    # → Camila (creadora)
    ("n-c-1", "C", "S", "new_request", "Nueva solicitud", "Sofía Herrera quiere unirse a tu proyecto CHISPA (Investigador/a).", "CHISPA", "r-ch-s-team", None, ts("2026-11-08", "20:15"), False),
    ("n-c-2", "C", "M", "task_application", "Nueva postulación a tarea", "Mateo Díaz se postuló a la tarea Plan de voluntarios.", "ARTFEST", "r-af-m-task", None, ts("2026-11-09", "10:05"), False),
    ("n-c-3", "C", "P", "new_request", "Nueva solicitud", "Usuario Prueba quiere unirse a tu proyecto ARTFEST (Diseñador/a).", "ARTFEST", "r-af-p-team", None, ts("2026-11-07", "16:45"), False),
    ("n-c-4", "C", "S", "new_comment", "Comentario en tu proyecto", "Sofía Herrera comentó en CHISPA.", "CHISPA", None, "¿Habrá presentaciones en Barranquilla durante el precarnaval? Me gustaría proponer un conversatorio sobre bullerengue.", ts("2026-11-08", "20:30"), True),
    ("n-c-5", "C", "S", "new_comment", "Comentario en tu proyecto", "Sofía Herrera comentó en ARTFEST.", "ARTFEST", None, "¿Pueden participar grupos de música que no sean de la universidad?", ts("2026-11-09", "13:20"), False),
    ("n-c-6", "C", "P", "new_comment", "Comentario en tu proyecto", "Usuario Prueba comentó en POLAR CRAVING.", "POLAR CRAVING", None, "Ya quedó el empaque final en la carpeta del equipo. ¿Lo imprimimos en cartón kraft?", ts("2026-11-05", "11:00"), True),
    ("n-c-7", "C", "S", "new_request", "Nueva solicitud", "Sofía Herrera quiere unirse a tu proyecto POLAR CRAVING (Líder de proyecto).", "POLAR CRAVING", "r-pc-s-team", None, ts("2026-10-25", "17:00"), True),
    # → Usuario Prueba (integrante activa)
    ("n-p-1", "P", "C", "request_accepted", "Solicitud aceptada", "Camila Rojas aceptó tu solicitud para INSTAGRAM (Diseñador/a).", "INSTAGRAM", "r-ig-p-team", None, ts("2026-09-13", "09:00"), True),
    ("n-p-2", "P", "C", "task_application_accepted", "Postulación aceptada", "Camila Rojas te asignó la tarea Diseñar el feed de publicaciones.", "INSTAGRAM", "r-ig-p-task", None, ts("2026-10-29", "08:40"), True),
    ("n-p-3", "P", "C", "request_accepted", "Solicitud aceptada", "Camila Rojas aceptó tu solicitud para CHISPA (Comunicador/a).", "CHISPA", "r-ch-p-team", None, ts("2026-10-03", "10:15"), True),
    ("n-p-4", "P", "C", "task_assigned", "Nueva tarea asignada", "Camila Rojas te asignó la tarea Agenda de Carnaval 2027 en CHISPA.", "CHISPA", "r-ch-p-task", "Agenda de Carnaval 2027", ts("2026-10-18", "14:00"), False),
    ("n-p-5", "P", "C", "task_completed", "Tarea completada", "Camila Rojas marcó como completada la tarea Diseño de empaque de paletas.", "POLAR CRAVING", None, "Diseño de empaque de paletas", ts("2026-11-05", "18:00"), False),
    ("n-p-6", "P", "C", "comment_reply", "Respuesta a tu comentario", "Camila Rojas respondió tu comentario en CHISPA.", "CHISPA", None, "Perfecto, te paso el contacto del director. Las fotos del primer ensayo quedaron increíbles.", ts("2026-11-07", "10:30"), False),
    ("n-p-7", "P", "C", "task_reminder", "Recordatorio de tarea", "La tarea Diseñar el feed de publicaciones de INSTAGRAM vence el 20 nov 2026.", "INSTAGRAM", None, "Diseñar el feed de publicaciones", ts("2026-11-10", "07:00"), False),
    ("n-p-8", "P", "C", "project_update", "Actualización del proyecto", "ARTFEST abrió la convocatoria de artistas para su primera edición.", "ARTFEST", None, None, ts("2026-11-09", "17:00"), False),
    ("n-p-9", "P", "M", "new_message", "Nuevo mensaje", "Mateo Díaz te envió un mensaje.", "", None, "¿Me compartes los colores del feed para la demo?", ts("2026-11-09", "21:10"), False),
    ("n-p-10", "P", "C", "request_accepted", "Solicitud aceptada", "Camila Rojas aceptó tu solicitud para POLAR CRAVING (Diseñador/a).", "POLAR CRAVING", "r-pc-p-team", None, ts("2026-10-04", "18:20"), True),
    # → Mateo (integrante)
    ("n-m-1", "M", "C", "request_accepted", "Solicitud aceptada", "Camila Rojas aceptó tu solicitud para DUO (Desarrollador/a).", "DUO", "r-duo-m-team", None, ts("2026-08-29", "09:00"), True),
    ("n-m-2", "M", "C", "task_completed", "Tarea completada", "Camila Rojas marcó como completada la tarea Algoritmo de emparejamiento.", "DUO", None, "Algoritmo de emparejamiento", ts("2026-09-21", "10:00"), True),
    ("n-m-3", "M", "C", "comment_reply", "Respuesta a tu comentario", "Camila Rojas respondió tu comentario en POLAR CRAVING.", "POLAR CRAVING", None, "La agregamos al catálogo como sabor destacado del piloto.", ts("2026-11-04", "19:10"), False),
    ("n-m-4", "M", "P", "comment_reply", "Respuesta a tu comentario", "Usuario Prueba respondió tu comentario en INSTAGRAM.", "INSTAGRAM", None, "¡Se ve muy bien! Ajusté el feed para mostrar las miniaturas mientras carga la foto completa.", ts("2026-10-31", "09:05"), True),
    ("n-m-5", "M", "P", "new_message", "Nuevo mensaje", "Usuario Prueba te envió un mensaje.", "", None, "Claro, te los envío en un rato.", ts("2026-11-09", "21:30"), False),
    # → Sofía (externa)
    ("n-s-1", "S", "C", "request_rejected", "Solicitud no aceptada", "Camila Rojas no aceptó tu solicitud para POLAR CRAVING (Líder de proyecto).", "POLAR CRAVING", "r-pc-s-team", None, ts("2026-10-27", "09:10"), False),
    ("n-s-2", "S", "C", "comment_reply", "Respuesta a tu comentario", "Camila Rojas respondió tu comentario en CHISPA.", "CHISPA", None, "¡Sí! Estamos armando la agenda del precarnaval. Envíame tu propuesta por la solicitud de Investigador/a.", ts("2026-11-09", "08:15"), False),
]
for key, to, frm, typ, title, msg, proj, req, detail, created, read in NOTIFS:
    insert("app_notifications", {
        "_id": uid(key), "_owner": user(frm), "recipientUserId": user(to), "projectId": PID.get(proj, ""),
        "requestId": RID[req] if req else None, "type": typ, "title": title, "message": msg, "read": read,
        "createdAt": created, "actorUserId": user(frm), "actorName": NAMES[frm], "detail": detail,
    })

# ─────────────────────────── Mensajes ───────────────────────────
MESSAGES = [
    ("dm-1", "C", "P", "Hola, ¿cómo vas con el feed de INSTAGRAM? El viernes es la demo.", ts("2026-11-08", "09:00"), True),
    ("dm-2", "P", "C", "Bien, ya tengo el feed y el detalle de foto. Hoy termino el perfil.", ts("2026-11-08", "09:20"), True),
    ("dm-3", "C", "P", "Perfecto. Recuerda dejar las pantallas en la carpeta del equipo.", ts("2026-11-08", "09:25"), True),
    ("dm-4", "M", "P", "¿Me compartes los colores del feed para la demo?", ts("2026-11-09", "21:10"), False),
    ("dm-5", "P", "M", "Claro, te los envío en un rato.", ts("2026-11-09", "21:30"), False),
    ("dm-6", "S", "C", "Hola Camila, envié la solicitud para CHISPA. ¿Puedo compartirte mi investigación sobre bullerengue?", ts("2026-11-08", "20:40"), True),
]
for key, frm, to, text, created, read in MESSAGES:
    insert("direct_messages", {
        "_id": uid(key), "_owner": user(frm), "fromUserId": user(frm), "fromName": NAMES[frm],
        "toUserId": user(to), "toName": NAMES[to], "text": text, "read": read, "createdAt": created,
    })

# ─────────────────────────── Salida ─────────────────────────────
header = f"""-- Datos de demostración de Proyéctate ({SEED}). GENERADO por scripts/demo/generar_seed_sql.py
-- Requisitos: existir las 4 cuentas ({', '.join(EMAILS.values())})
-- y haber aplicado roble/2026-11-10_correcciones.sql y roble/2026-11-10_demo_esquema.sql.
-- Ejecutar en Roble → Consola SQL. Para deshacer: roble/demo/2026-11_limpiar_demo.sql
-- Verificación previa (debe dar 4):
--   SELECT count(*) FROM auth.users WHERE email IN ({', '.join(repr(e) for e in EMAILS.values())});
"""
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(header + "\n".join(statements) + "\n", encoding="utf-8")

CLEAN = ROOT / "roble" / "demo" / "2026-11_limpiar_demo.sql"
tables = ["app_notifications", "direct_messages", "project_comments", "project_follows", "request_decisions",
          "project_members", "project_requests", "project_task_private", "project_tasks", "project_attachments",
          "projects", "user_profiles"]
CLEAN.write_text(
    f"-- Borra SOLO los datos de demostración ({SEED}). No toca usuarios ni datos reales.\n"
    "-- Los archivos de R2 (portadas y documentos demo) se borran con scripts/demo/subir_portadas.mjs --borrar\n"
    + "\n".join(f"DELETE FROM public.{t} WHERE \"demoSeed\" = '{SEED}';" for t in tables) + "\n",
    encoding="utf-8",
)

IDS = ROOT / "scripts" / "demo" / "demo_ids.json"
IDS.write_text(json.dumps({"projects": PID}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{len(statements)} sentencias → {OUT.relative_to(ROOT)}")
