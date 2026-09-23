import json
import os
import unicodedata
import boto3
from datetime import datetime, timezone


def strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
ses = boto3.client("ses", region_name="us-east-1")

USERS_TABLE = "buscatrabajito-users"
FROM_EMAIL = os.environ.get("FROM_EMAIL", "morenodrums96@gmail.com")


def get_all_profiles() -> list[dict]:
    table = dynamodb.Table(USERS_TABLE)
    result = table.scan(
        FilterExpression="begins_with(SK, :sk)",
        ExpressionAttributeValues={":sk": "PROFILE#"},
    )
    return result.get("Items", [])


def get_user_data(user_id: str) -> dict:
    """Lee CV y SEARCH_PROFILE para obtener email y nombre."""
    table = dynamodb.Table(USERS_TABLE)
    # Intentar CV primero
    cv = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "CV"}).get("Item", {})
    if cv.get("email"):
        return {"email": cv["email"], "nombre": cv.get("nombreCompleto", "")}
    # Fallback a SEARCH_PROFILE
    sp = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "SEARCH_PROFILE"}).get("Item", {})
    return {"email": sp.get("email", ""), "nombre": sp.get("nombreCompleto", "")}


IDIOMA_CODIGOS = {"Español": "es", "Inglés": "en"}

# Sin librerías de detección de idioma (para no inflar el paquete del
# Lambda): si el título trae conectores o palabras de puesto típicas del
# español, se asume español; si no, inglés (LinkedIn y la mayoría de
# fuentes devuelven títulos en inglés por default). Ya viene sin acentos
# porque se compara contra strip_accents(texto).
PALABRAS_CONECTORAS_ES = {"de", "del", "para", "con", "en", "y"}
PALABRAS_PUESTO_ES = {
    "gerente", "desarrollador", "desarrolladora", "ingeniero", "ingeniera",
    "analista", "director", "directora", "lider", "encargado", "encargada",
    "auxiliar", "ejecutivo", "ejecutiva", "vendedor", "vendedora", "contador",
    "contadora", "disenador", "disenadora", "atencion", "cliente", "ventas",
    "recursos", "humanos", "practicante", "asistente", "representante",
    "coordinador", "coordinadora", "supervisor", "supervisora",
    "especialista", "responsable", "jefe", "jefa",
}


def detectar_idioma(texto: str) -> str:
    palabras = set(strip_accents(texto.lower()).split())
    if palabras & PALABRAS_CONECTORAS_ES or palabras & PALABRAS_PUESTO_ES:
        return "es"
    return "en"


# Igual que el idioma: no tenemos un campo explícito de tipo de empleo en
# las fuentes que scrapeamos, así que se infiere del título con palabras
# clave. "Tiempo completo" es el default cuando no hay ninguna señal más
# específica, porque es lo más común y casi nunca se anuncia en el título.
def detectar_tipo_empleo(titulo: str) -> str:
    t = strip_accents(titulo.lower())
    if any(p in t for p in ["becario", "becaria", "practicante", "practicas", "intern", "trainee"]):
        return "Prácticas / Becario"
    if any(p in t for p in ["freelance", "por proyecto", "project-based", "temporal", "temporary"]):
        return "Freelance / Proyecto"
    if any(p in t for p in ["medio tiempo", "part time", "part-time", "parcial"]):
        return "Medio tiempo"
    return "Tiempo completo"


# Buscamos vacantes de "hoy a hace 15 días" — OCC y Computrabajo devuelven
# en sus resultados de búsqueda ofertas que llevan abiertas semanas, y sin
# este corte se cuelan junto con las recién publicadas.
MAX_DIAS_ANTIGUEDAD = 15


def vacante_es_reciente(job: dict) -> bool:
    """Sin posted_date (fuentes que no lo reportan, ej. Freelancer/Remotive)
    no hay forma de saber la antigüedad real, así que se deja pasar en vez
    de descartarla a ciegas."""
    posted_date = job.get("posted_date") or ""
    if not posted_date:
        return True
    try:
        fecha = datetime.strptime(posted_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return True
    dias = (datetime.now(timezone.utc) - fecha).days
    return dias <= MAX_DIAS_ANTIGUEDAD


def job_matches_profile(job: dict, profile: dict) -> bool:
    if not vacante_es_reciente(job):
        print(f"  NO MATCH (vacante muy antigua, posted_date={job.get('posted_date')})")
        return False

    puesto = profile.get("puesto", "").lower()
    terminos_busqueda = profile.get("terminos_busqueda") or []
    job_title = job.get("title", "").lower()
    job_location = job.get("location", "").lower()

    # puesto es el título tal cual lo escribió el usuario (a veces en
    # español), pero terminos_busqueda son las variantes normalizadas por
    # IA (usualmente en inglés) que el scraper ya usa para buscar en
    # LinkedIn — sin incluirlas aquí, un puesto en español nunca hace
    # match contra títulos en inglés aunque el scraper sí haya
    # encontrado la vacante correcta con esos mismos términos.
    #
    # Cada frase se evalúa POR SEPARADO exigiendo que coincida la mayoría
    # de sus palabras (>3 letras) — no que aparezca UNA sola palabra del
    # conjunto de todas las frases juntas. Antes bastaba con que "Engineer"
    # apareciera para hacer match, y así "Senior Software Engineer
    # Fullstack" emparejaba con "Mechanical Design Engineer" sin relación
    # real. No se puede exigir mayoría sobre el conjunto completo porque
    # las frases son variantes alternativas del mismo puesto (a veces en
    # otro idioma), no modificadores de una sola frase — casi nunca
    # comparten palabras entre sí.
    frases = [puesto] + [t.lower() for t in terminos_busqueda]

    def frase_coincide(frase: str) -> bool:
        palabras = [w for w in frase.split() if len(w) > 3]
        if not palabras:
            return False
        coincidencias = sum(1 for w in palabras if w in job_title)
        return coincidencias * 2 > len(palabras)

    title_match = any(frase_coincide(f) for f in frases)

    print(f"  puesto={puesto} | terminos_busqueda={terminos_busqueda} | title={job_title} | title_match={title_match}")
    
    if not title_match:
        return False

    # Idioma deseado — se filtra antes de mirar ubicación/modalidad para
    # que aplique sin importar por qué ruta se decida el match (remoto,
    # USA o estado). Si no seleccionó nada, o seleccionó ambos idiomas,
    # el set de códigos deseados cubre cualquier resultado y no filtra.
    idiomas_deseados = profile.get("idiomasVacantes") or []
    if idiomas_deseados:
        codigos_deseados = {IDIOMA_CODIGOS[i] for i in idiomas_deseados if i in IDIOMA_CODIGOS}
        # Algunas fuentes (ej. Freelancer.com) reportan el idioma real de
        # la vacante — más confiable que adivinar por palabras clave.
        idioma_job = job.get("idioma") or detectar_idioma(job.get("title", ""))
        if codigos_deseados and idioma_job not in codigos_deseados:
            print(f"  NO MATCH (idioma detectado={idioma_job}, deseado={idiomas_deseados})")
            return False

    # Tipo de empleo deseado (Tiempo completo / Medio tiempo / Freelance /
    # Prácticas). Mismo criterio: sin selección, no filtra.
    tipos_deseados = profile.get("tiposTrabajo") or []
    if tipos_deseados:
        # Freelancer.com es 100% trabajo freelance por definición, y
        # Talenteca reporta el tipo real (job["tipo_empleo"]) — ninguna de
        # las dos depende de adivinar por el título.
        if job.get("source") == "Freelancer":
            tipo_job = "Freelance / Proyecto"
        else:
            tipo_job = job.get("tipo_empleo") or detectar_tipo_empleo(job.get("title", ""))
        if tipo_job not in tipos_deseados:
            print(f"  NO MATCH (tipo de empleo detectado={tipo_job}, deseado={tipos_deseados})")
            return False

    estados = profile.get("estados", [])
    remoto_usa = profile.get("remotoUSA", False)
    modalidades = profile.get("modalidades", [])  # legado, ver fallback abajo
    modalidad_por_estado = profile.get("modalidadPorEstado") or {}
    MODALIDADES_DEFAULT = ["Remoto", "Híbrido", "Presencial"]

    print(f"  estados={estados} | modalidadPorEstado={modalidad_por_estado} | location={job_location}")

    # ¿El usuario quiere remoto en AL MENOS uno de sus estados? Se usa
    # para las fuentes sin estado real (ver abajo) y como red de
    # seguridad para perfiles viejos sin modalidadPorEstado.
    quiere_remoto = any("Remoto" in mods for mods in modalidad_por_estado.values()) or "Remoto" in modalidades

    # Job "remoto" por palabras clave — se mira título Y location, porque
    # LinkedIn casi siempre pone "Remote Work" en el título y deja la
    # location como la ciudad de la empresa (ej. "Monterrey, Nuevo León").
    job_es_remoto = any(
        word in job_location or word in job_title for word in ["remoto", "remote", "anywhere"]
    )

    # Fuentes 100% remotas sin estado real (Freelancer.com, Remotive,
    # WeWorkRemotely, Himalayas) — todas guardan location="Remoto" literal.
    # No hay estado que comparar, así que solo importa si el usuario
    # quiere remoto en general.
    if job_location.strip() == "remoto":
        if quiere_remoto:
            print("  MATCH (fuente 100% remota, usuario quiere remoto)")
            return True
        print("  NO MATCH (fuente 100% remota, usuario no quiere remoto)")
        return False

    # USA
    if remoto_usa and job.get("source") in ["Remotive", "WeWorkRemotely", "Himalayas"]:
        return True

    # Si location es genérico "México" sin ciudad/estado, no hay forma de
    # saber si aplica — se descarta salvo que el usuario acepte remoto.
    loc_clean = job_location.strip()
    GENERIC_LOCATIONS = {"méxico", "mexico", "méxico, méxico", "mexico, mexico"}
    if loc_clean in GENERIC_LOCATIONS:
        if quiere_remoto:
            return True  # podría ser remota
        print("  NO MATCH (location genérico sin ciudad/estado)")
        return False

    # Estados — el location viene como "Ciudad, Estado, País" (LinkedIn,
    # ej. "Monterrey, Nuevo León, México") o "Ciudad, Estado" sin país
    # (OCC/Computrabajo, ej. "Benito Juárez, Ciudad de México"). Varios
    # municipios se llaman igual en distintos estados (ej. "Juárez" existe
    # en Nuevo León Y en Chihuahua/Ciudad Juárez; "Hidalgo" existe en
    # Nuevo León Y es nombre de otro estado) — comparar el nombre del
    # municipio contra el string completo genera falsos positivos
    # ("Benito Juárez, Ciudad de México" hacía match con Nuevo León solo
    # porque Nuevo León también tiene un municipio llamado Juárez). Para
    # evitarlo, el segmento de estado manda por sí solo, nunca se revisan
    # municipios: es el penúltimo segmento si el último es literalmente
    # "México" (el país), o si no, el último segmento tal cual.
    ALIAS_ESTADO = {
        "nuevo leon": ["nl", "monterrey", "mty"],
        "ciudad de mexico": ["cdmx", "df", "distrito federal"],
        "estado de mexico": ["edomex", "mexico"],
        "jalisco": ["gdl", "guadalajara"],
    }

    # Sin estado seleccionado (ej. el usuario solo configuró idioma o
    # modalidad): no hay nada que comparar aquí, así que no se descarta.
    if not estados:
        return True

    partes = [p.strip() for p in job_location.split(",")]
    if len(partes) >= 2 and strip_accents(partes[-1].lower()) == "mexico":
        estado_en_location_plain = strip_accents(partes[-2].lower())
    else:
        estado_en_location_plain = strip_accents(partes[-1].lower()) if partes else ""

    for estado in estados:
        estado_plain = strip_accents(estado.lower())

        coincide = (
            estado_plain == estado_en_location_plain
            or estado_plain in estado_en_location_plain
            or estado_en_location_plain in ALIAS_ESTADO.get(estado_plain, [])
        )

        if not coincide:
            continue

        # El estado coincide — ahora hay que ver si la modalidad de ESTA
        # vacante (remota o no) está permitida para ESE estado específico.
        # Sin configuración por estado, cae al campo legado modalidades
        # (perfiles guardados antes de esta función) y si tampoco hay eso,
        # se permite cualquier modalidad (así se comportaba antes).
        mods = modalidad_por_estado.get(estado) or modalidades or MODALIDADES_DEFAULT
        modalidad_ok = ("Remoto" in mods) if job_es_remoto else ("Híbrido" in mods or "Presencial" in mods)

        if modalidad_ok:
            print(f"  MATCH por estado: {estado} (modalidad ok, job_es_remoto={job_es_remoto}, mods={mods})")
            return True
        print(f"  estado {estado} coincide pero modalidad no aplica (job_es_remoto={job_es_remoto}, mods={mods})")

    print(f"  NO MATCH")
    return False

def save_match(user_id: str, job: dict):
    table = dynamodb.Table(USERS_TABLE)
    now = int(datetime.now(timezone.utc).timestamp())
    # SK fija por job_id (no por timestamp): si esta vacante ya se le
    # había guardado a este usuario, la actualiza en vez de duplicarla
    # (puede pasar si dos corridas del scraper se solapan, o si la misma
    # vacante sigue publicada y vuelve a salir como "nueva" del dedup).
    #
    # update_item, NO put_item: un put_item reemplaza el item completo y
    # borraría el "descartada"/"motivoDescarte" que el usuario ya había
    # elegido cada vez que esta vacante se vuelve a matchear — con
    # put_item, algo que el usuario marcó como "no me interesa" podía
    # reaparecer solo porque el scraper la volvió a encontrar.
    table.update_item(
        Key={"PK": f"USER#{user_id}", "SK": f"JOB#{job['job_id']}"},
        UpdateExpression=(
            "SET job_id = :jid, title = :title, company = :company, "
            "location = :location, link = :link, #src = :src, "
            "posted_date = :posted_date, idioma = :idioma, "
            "tipo_empleo = :tipo_empleo, seen_at = :seen_at, "
            "notified = if_not_exists(notified, :notified_default)"
        ),
        ExpressionAttributeNames={"#src": "source"},
        ExpressionAttributeValues={
            ":jid": job["job_id"],
            ":title": job["title"],
            ":company": job["company"],
            ":location": job["location"],
            ":link": job["link"],
            ":src": job["source"],
            ":posted_date": job.get("posted_date", ""),
            ":idioma": job.get("idioma", ""),
            ":tipo_empleo": job.get("tipo_empleo", ""),
            ":seen_at": now,
            ":notified_default": False,
        },
    )


def send_notification_email(email: str, nombre: str, jobs: list[dict]):
    if not jobs or not email:
        return

    vacantes_html = ""
    for job in jobs[:10]:
        vacantes_html += f"""
        <div style="margin-bottom:16px;padding:16px;background:#F8FAFC;border-radius:8px;border-left:4px solid #2563EB;">
            <p style="margin:0 0 4px;font-weight:700;color:#0F2744;font-size:15px;">{job['title']}</p>
            <p style="margin:0 0 4px;color:#2563EB;font-size:13px;">{job['company']}</p>
            <p style="margin:0 0 8px;color:#64748B;font-size:12px;">📍 {job['location']} · {job['source']}</p>
            <a href="{job['link']}" style="display:inline-block;padding:8px 16px;background:#2563EB;color:white;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;">
                Ver vacante →
            </a>
        </div>
        """

    nombre_display = nombre or email.split("@")[0]
    count = len(jobs)

    ses.send_email(
        Source=FROM_EMAIL,
        Destination={"ToAddresses": [email]},
        Message={
            "Subject": {
                "Data": f"🔔 {count} nueva{'s' if count > 1 else ''} vacante{'s' if count > 1 else ''} para ti — BuscoTrabajito",
            },
            "Body": {
                "Html": {
                    "Data": f"""
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                        <div style="text-align:center;margin-bottom:24px;">
                            <h1 style="font-size:24px;color:#0F2744;margin:0;">
                                Busco<span style="color:#2563EB;">Trabajito</span>
                            </h1>
                        </div>
                        <h2 style="color:#0F2744;font-size:18px;">
                            Hola {nombre_display}, encontramos {count} vacante{'s' if count > 1 else ''} para ti 🎯
                        </h2>
                        <p style="color:#64748B;font-size:14px;">
                            Revisamos más de 7 portales de empleo cada 30 minutos. Estas son las nuevas oportunidades que coinciden con tu perfil:
                        </p>
                        {vacantes_html}
                        <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
                        <p style="color:#94A3B8;font-size:11px;text-align:center;">
                            BuscoTrabajito · México y LATAM<br>
                            <a href="https://buscotrabajito.com/dashboard" style="color:#2563EB;">Ver todas tus vacantes</a>
                        </p>
                    </div>
                    """
                }
            },
        },
    )
    print(f"  ✉️ Correo enviado a {email} con {count} vacantes")


def lambda_handler(event, context):
    print(f"[matching] evento recibido: {json.dumps(event)[:200]}")

    new_jobs = event.get("jobs", [])
    if not new_jobs:
        return {"statusCode": 200, "body": "Sin vacantes"}

    profiles = get_all_profiles()
    print(f"[matching] {len(profiles)} perfiles, {len(new_jobs)} vacantes nuevas")

    user_matches: dict[str, list] = {}
    matched_job_ids: dict[str, set] = {}

    for profile in profiles:
        pk = profile.get("PK", "")
        user_id = pk.replace("USER#", "")
        if not user_id:
            continue

        for job in new_jobs:
            # Un usuario puede tener varios perfiles/puestos parecidos
            # (p. ej. "Backend Engineer" y "Technical Lead"); sin este
            # chequeo, la misma vacante se agregaba una vez por cada
            # perfil con el que hacía match y salía repetida en el correo.
            if job["job_id"] in matched_job_ids.get(user_id, set()):
                continue

            if job_matches_profile(job, profile):
                user_matches.setdefault(user_id, []).append(job)
                matched_job_ids.setdefault(user_id, set()).add(job["job_id"])
                save_match(user_id, job)

    print(f"[matching] matches para {len(user_matches)} usuarios")

    for user_id, matched_jobs in user_matches.items():
        user_data = get_user_data(user_id)
        email = user_data.get("email", "")
        nombre = user_data.get("nombre", "")

        if not email:
            print(f"  Sin email para USER#{user_id}, omitiendo")
            continue

        try:
            send_notification_email(email, nombre, matched_jobs)
        except Exception as e:
            print(f"  Error enviando correo a {email}: {e}")
            continue

        # Contador para el resumen del dashboard — best-effort, no debe
        # tirar la corrida si falla (el correo ya se mandó).
        try:
            dynamodb.Table(USERS_TABLE).update_item(
                Key={"PK": f"USER#{user_id}", "SK": "SEARCH_PROFILE"},
                UpdateExpression="ADD alertasEnviadas :one",
                ExpressionAttributeValues={":one": 1},
            )
        except Exception as e:
            print(f"  No se pudo incrementar alertasEnviadas para {user_id}: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "usuarios_notificados": len(user_matches),
            "vacantes_procesadas": len(new_jobs),
        }),
    }
