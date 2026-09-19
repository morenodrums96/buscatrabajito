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
CATALOGS_TABLE = "buscatrabajito-catalogs"
FROM_EMAIL = os.environ.get("FROM_EMAIL", "morenodrums96@gmail.com")

# Cache en memoria de municipios por estado — a nivel de módulo para que
# también sobreviva entre invocaciones "warm" del mismo contenedor de
# Lambda, no solo dentro de una ejecución.
_municipios_cache: dict[str, list[str]] = {}


def slugify_estado(estado: str) -> str:
    # "Nuevo León" -> "nuevo-leon", "Ciudad de México" -> "ciudad-de-mexico"
    return strip_accents(estado).lower().strip().replace(" ", "-")


def get_municipios_por_estado(estado: str) -> list[str]:
    slug = slugify_estado(estado)
    if slug in _municipios_cache:
        return _municipios_cache[slug]

    municipios: list[str] = []
    try:
        table = dynamodb.Table(CATALOGS_TABLE)
        result = table.get_item(Key={"PK": f"STATE#{slug}", "SK": "MUNICIPALITIES"})
        municipios = result.get("Item", {}).get("municipios", [])
    except Exception as e:
        print(f"  get_municipios_por_estado error [{estado}]: {e}")

    _municipios_cache[slug] = municipios
    return municipios


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


def job_matches_profile(job: dict, profile: dict) -> bool:
    puesto = profile.get("puesto", "").lower()
    job_title = job.get("title", "").lower()
    job_location = job.get("location", "").lower()

    puesto_words = [w for w in puesto.split() if len(w) > 3]
    title_match = any(word in job_title for word in puesto_words)
    
    print(f"  puesto={puesto} | title={job_title} | words={puesto_words} | title_match={title_match}")
    
    if not title_match:
        return False

    estados = profile.get("estados", [])
    remoto_usa = profile.get("remotoUSA", False)
    modalidades = profile.get("modalidades", [])

    print(f"  estados={estados} | location={job_location}")

    # Remoto
    if "Remoto" in modalidades:
        if any(word in job_location for word in ["remoto", "remote", "anywhere"]):
            return True

    # USA
    if remoto_usa and job.get("source") in ["Remotive", "WeWorkRemotely", "Himalayas"]:
        return True

    # Si location es genérico "México" sin ciudad/estado, no hay forma de
    # saber si aplica — se descarta salvo que el usuario acepte remoto.
    loc_clean = job_location.strip()
    GENERIC_LOCATIONS = {"méxico", "mexico", "méxico, méxico", "mexico, mexico"}
    if loc_clean in GENERIC_LOCATIONS:
        if "Remoto" in modalidades:
            return True  # podría ser remota
        print("  NO MATCH (location genérico sin ciudad/estado)")
        return False

    # Estados — comparación sin acentos contra los municipios reales del
    # estado (catálogo en DynamoDB), ya que LinkedIn/Computrabajo/etc.
    # casi siempre traen la ciudad ("Monterrey, Nuevo León, México") y no
    # el nombre del estado. También se compara contra el nombre del
    # estado por si el location viene sin ciudad (ej. "Nuevo León, México").
    job_location_plain = strip_accents(job_location)
    for estado in estados:
        municipios = get_municipios_por_estado(estado)
        terminos = [estado] + municipios
        terminos_plain = [strip_accents(t.lower()) for t in terminos]
        if any(t in job_location_plain for t in terminos_plain):
            print(f"  MATCH por estado: {estado}")
            return True

    print(f"  NO MATCH")
    return False

def save_match(user_id: str, job: dict):
    table = dynamodb.Table(USERS_TABLE)
    now = int(datetime.now(timezone.utc).timestamp())
    # SK fija por job_id (no por timestamp): si esta vacante ya se le
    # había guardado a este usuario, la sobreescribe en vez de duplicarla
    # (puede pasar si dos corridas del scraper se solapan).
    table.put_item(Item={
        "PK": f"USER#{user_id}",
        "SK": f"JOB#{job['job_id']}",
        "job_id": job["job_id"],
        "title": job["title"],
        "company": job["company"],
        "location": job["location"],
        "link": job["link"],
        "source": job["source"],
        "seen_at": now,
        "notified": False,
    })


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

    return {
        "statusCode": 200,
        "body": json.dumps({
            "usuarios_notificados": len(user_matches),
            "vacantes_procesadas": len(new_jobs),
        }),
    }
