"""
BuscoTrabajito — Scraper de vacantes multi-usuario
Fuentes activas: OCC Mundial, LinkedIn Jobs, Computrabajo, Talenteca,
                  Freelancer.com, OXXO, Coca-Cola FEMSA, CEMEX, Ternium,
                  Grupo Modelo, Cargill
Definidas pero inactivas (no están en la lista `scrapers` de main()):
                  Bumeran, Remotive, We Work Remotely, Himalayas

Los términos de búsqueda se derivan dinámicamente de los puestos que
los usuarios de BuscoTrabajito guardaron en sus preferencias
(buscatrabajito-users, SK begins_with "PROFILE#"). La relevancia final
por usuario (estado, modalidad, disponibilidad, etc.) la decide la
Lambda buscatrabajito-matching — este scraper solo hace una
recolección amplia filtrada por palabra clave.

Persistencia:
  - job-bot-seen-jobs: IDs ya vistos globalmente (evita reprocesar el
    mismo posting en cada corrida; expira a los 14 días).
  - buscatrabajito-jobs: copia de las vacantes nuevas encontradas.
  - buscatrabajito-matching: se invoca de forma async con las
    vacantes nuevas para que le avise a cada usuario por correo (SES,
    FROM_EMAIL) según su propio perfil guardado.
"""

import os
import re
import json
import hashlib
import unicodedata
import requests
import time
import random
import boto3
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup

# ── DynamoDB ──────────────────────────────────────────────────────
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "job-bot-seen-jobs")
USERS_TABLE    = os.environ.get("USERS_TABLE", "buscatrabajito-users")
EXPIRY_DAYS    = 14
MAX_TERMS      = 20

SCRAPER_SERVICE_API_KEY = os.environ.get("SCRAPER_SERVICE_API_KEY", "")
SCRAPER_SERVICE_URL     = os.environ.get("SCRAPER_SERVICE_URL", "https://api.scraperapi.com")

# Locations de LinkedIn — busca primero en NL específico, luego en México
# general para capturar remotas. El matching filtra por estado del usuario.
LINKEDIN_LOCATIONS = [
    "Monterrey, Nuevo León, Mexico",
    "San Pedro Garza García, Nuevo León, Mexico",
    "Guadalupe, Nuevo León, Mexico",
    "Mexico",  # captura remotas y otras ciudades
]

HEADERS_POOL = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "es-MX,es;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "Accept-Language": "es;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
]


# ── Términos de búsqueda ──────────────────────────────────────────
def normalize_puesto(puesto: str) -> str:
    primero = re.split(r"[/(\-–]", puesto)[0].strip()
    return primero


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", "-", text).strip("-")
    return text


MESES_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}


def parse_fecha_relativa(texto: str) -> str:
    """OCC y Computrabajo no dan la fecha real en un atributo aparte (a
    diferencia de LinkedIn) — la muestran como texto relativo en español
    ("Hace 6 días", "Hoy", "Ayer", "9 de septiembre", "Más de 30 días").
    Esto lo convierte a fecha ISO (solo día, igual que LinkedIn) usando
    la fecha actual como referencia. Devuelve "" si no reconoce el
    formato — mejor no guardar posted_date que guardar uno incorrecto.
    """
    t = unicodedata.normalize("NFKD", texto.lower().strip()).encode("ascii", "ignore").decode()
    t = re.sub(r"\s+", " ", t)
    hoy = datetime.now(timezone.utc)

    if t == "hoy":
        return hoy.strftime("%Y-%m-%d")
    if t == "ayer":
        return (hoy - timedelta(days=1)).strftime("%Y-%m-%d")
    if "mas de 30 dias" in t:
        return (hoy - timedelta(days=30)).strftime("%Y-%m-%d")

    m = re.match(r"hace (\d+) (minuto|hora|dia|semana|mes)", t)
    if m:
        n, unidad = int(m.group(1)), m.group(2)
        dias = {"minuto": 0, "hora": 0, "dia": n, "semana": n * 7, "mes": n * 30}[unidad]
        return (hoy - timedelta(days=dias)).strftime("%Y-%m-%d")

    m = re.match(r"(\d+) de (\w+)", t)
    if m and m.group(2) in MESES_ES:
        dia, mes = int(m.group(1)), MESES_ES[m.group(2)]
        try:
            fecha = datetime(hoy.year, mes, dia, tzinfo=timezone.utc)
        except ValueError:
            return ""
        if fecha > hoy:
            fecha = fecha.replace(year=hoy.year - 1)
        return fecha.strftime("%Y-%m-%d")

    return ""


MESES_ABREV_ES = {
    "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
    "jul": 7, "ago": 8, "sept": 9, "sep": 9, "oct": 10, "nov": 11, "dic": 12,
}


def parse_fecha_cemex(texto: str) -> str:
    """CEMEX (SuccessFactors) da la fecha como "18 sept 2026" (día, mes
    abreviado en español, año) — formato distinto al relativo de OCC/
    Computrabajo, necesita su propio parser."""
    t = unicodedata.normalize("NFKD", texto.lower().strip()).encode("ascii", "ignore").decode()
    m = re.match(r"(\d+)\s+([a-z]+)\.?\s+(\d{4})", t)
    if not m:
        return ""
    dia, mes_txt, anio = m.group(1), m.group(2), m.group(3)
    mes = MESES_ABREV_ES.get(mes_txt)
    if not mes:
        return ""
    try:
        return datetime(int(anio), mes, int(dia), tzinfo=timezone.utc).strftime("%Y-%m-%d")
    except ValueError:
        return ""


CEMEX_ESTADOS = {
    "agu": "Aguascalientes", "bcn": "Baja California", "bcs": "Baja California Sur",
    "cam": "Campeche", "chp": "Chiapas", "chh": "Chihuahua", "cdmx": "Ciudad de México",
    "coa": "Coahuila", "col": "Colima", "dur": "Durango", "gua": "Guanajuato",
    "gro": "Guerrero", "hid": "Hidalgo", "jal": "Jalisco", "mex": "Estado de México",
    "mic": "Michoacán", "mor": "Morelos", "nay": "Nayarit", "nle": "Nuevo León",
    "oax": "Oaxaca", "pue": "Puebla", "que": "Querétaro", "roo": "Quintana Roo",
    "slp": "San Luis Potosí", "sin": "Sinaloa", "son": "Sonora", "tab": "Tabasco",
    "tam": "Tamaulipas", "tla": "Tlaxcala", "ver": "Veracruz", "yuc": "Yucatán",
    "zac": "Zacatecas",
}


def normalizar_location_cemex(location: str) -> str:
    """CEMEX da la ubicación como "Ciudad, ESTADO_ABREV, PAÍS, CP" (ej.
    "San Luis Potosí, SLP, MX, 78378") — CEMEX opera también en EUA,
    Francia, Colombia, etc., así que solo normaliza cuando el país es
    México; el resto se deja tal cual (no va a matchear ningún estado,
    igual que pasa hoy con otras fuentes internacionales).
    Formato distinto al de OCC/Computrabajo ("Ciudad, Estado"), que es lo
    que espera el matching por estado — se normaliza aquí, en el
    scraper, en vez de tocar esa lógica (ya duplicada en dos lugares:
    matching.py y route.ts).
    """
    partes = [p.strip() for p in location.split(",")]
    if len(partes) < 3 or partes[2].strip().upper() != "MX":
        return location
    ciudad = partes[0]
    estado = CEMEX_ESTADOS.get(partes[1].strip().lower(), partes[1].strip())
    return f"{ciudad}, {estado}"


# Ternium (acero) opera en pocas ciudades fijas en México — a diferencia
# de CEMEX, su careers site (mismo SuccessFactors pero con tema de
# tarjetas en vez de tabla) solo da ciudad + país, sin estado. Se mapea
# a mano en vez de necesitar un catálogo completo de municipios.
TERNIUM_CIUDAD_A_ESTADO = {
    "colima": "Colima",
    "puebla": "Puebla",
    "san luis potosi": "San Luis Potosí",
    "san nicolas de los garza": "Nuevo León",
    "pesqueria": "Nuevo León",
    "guadalupe": "Nuevo León",
    "apodaca": "Nuevo León",
    "monterrey": "Nuevo León",
    "ecatepec": "Estado de México",
    "toluca": "Estado de México",
    "tultitlan": "Estado de México",
}


def normalizar_location_ternium(ciudad: str, country: str) -> str:
    """Igual que con CEMEX: se normaliza aquí para no tocar la lógica de
    matching por estado (ya duplicada en matching.py y route.ts)."""
    if country.strip().upper() != "MX":
        return f"{ciudad}, {country}".strip(", ")
    ciudad_plain = unicodedata.normalize("NFKD", ciudad.strip().lower()).encode("ascii", "ignore").decode()
    estado = TERNIUM_CIUDAD_A_ESTADO.get(ciudad_plain)
    if estado:
        return f"{ciudad.strip()}, {estado}"
    # Sin mapeo conocido (ej. "México" a secas, la oficina corporativa, o
    # una ciudad nueva que Ternium agregue) — se deja tal cual. Si es
    # exactamente "México", cae en el mismo caso "location genérico" que
    # ya manejan matching.py y route.ts.
    return ciudad.strip()


def parse_fecha_workday(texto: str) -> str:
    """Workday da la fecha como texto relativo, localizado según el
    Accept-Language de la request — con nuestros headers (es-MX) viene
    en español ("Publicado hoy", "Publicado ayer", "Publicado hace 5
    días", "Publicado hace más de 30 días"), pero se deja también el
    patrón en inglés por si algún tenant no lo localiza."""
    t = unicodedata.normalize("NFKD", texto.lower().strip()).encode("ascii", "ignore").decode()
    hoy = datetime.now(timezone.utc)
    if "hoy" in t or "today" in t:
        return hoy.strftime("%Y-%m-%d")
    if "ayer" in t or "yesterday" in t:
        return (hoy - timedelta(days=1)).strftime("%Y-%m-%d")
    if "mas de 30" in t or "30+" in t:
        return (hoy - timedelta(days=30)).strftime("%Y-%m-%d")
    m = re.search(r"(\d+)\s+dias?|(\d+)\s+days?", t)
    if m:
        dias = int(m.group(1) or m.group(2))
        return (hoy - timedelta(days=dias)).strftime("%Y-%m-%d")
    return ""


def get_search_terms(max_terms: int = MAX_TERMS) -> list[str]:
    dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    table = dynamodb.Table(USERS_TABLE)
    profiles = []
    try:
        response = table.scan(
            FilterExpression="begins_with(SK, :sk)",
            ExpressionAttributeValues={":sk": "PROFILE#"},
        )
        profiles = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = table.scan(
                FilterExpression="begins_with(SK, :sk)",
                ExpressionAttributeValues={":sk": "PROFILE#"},
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            profiles.extend(response.get("Items", []))
    except Exception as e:
        print(f"  get_search_terms error: {e}")

    terminos, vistos = [], set()
    for profile in profiles:
        candidatos = profile.get("terminos_busqueda") or []
        if not candidatos:
            puesto = profile.get("puesto", "")
            if puesto:
                candidatos = [normalize_puesto(puesto)]

        for term in candidatos:
            key = term.lower().strip()
            if key and key not in vistos:
                vistos.add(key)
                terminos.append(term.strip())

    return terminos[:max_terms]


# ── DynamoDB helpers ──────────────────────────────────────────────
def get_dynamodb_table():
    dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return dynamodb.Table(DYNAMODB_TABLE)


def load_seen() -> set:
    table  = get_dynamodb_table()
    cutoff = int((datetime.now(timezone.utc) - timedelta(days=EXPIRY_DAYS)).timestamp())
    seen   = set()
    try:
        response = table.scan(
            FilterExpression="seen_at > :cutoff",
            ExpressionAttributeValues={":cutoff": cutoff}
        )
        for item in response.get("Items", []):
            seen.add(item["job_id"])
        while "LastEvaluatedKey" in response:
            response = table.scan(
                FilterExpression="seen_at > :cutoff",
                ExpressionAttributeValues={":cutoff": cutoff},
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            for item in response.get("Items", []):
                seen.add(item["job_id"])
    except Exception as e:
        print(f"  DynamoDB load_seen error: {e}")
    print(f"DynamoDB: {len(seen)} IDs cargados (últimos {EXPIRY_DAYS} días)")
    return seen


def save_seen_batch(job_ids: list):
    if not job_ids:
        return
    table  = get_dynamodb_table()
    now_ts = int(datetime.now(timezone.utc).timestamp())
    try:
        with table.batch_writer() as batch:
            for jid in job_ids:
                batch.put_item(Item={"job_id": jid, "seen_at": now_ts})
        print(f"DynamoDB: {len(job_ids)} IDs guardados")
    except Exception as e:
        print(f"  DynamoDB save error: {e}")


def save_jobs_batch(jobs: list[dict]):
    if not jobs:
        return
    dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    table    = dynamodb.Table("buscatrabajito-jobs")
    now_ts   = int(datetime.now(timezone.utc).timestamp())
    try:
        with table.batch_writer() as batch:
            for j in jobs:
                batch.put_item(Item={
                    "job_id":      j["job_id"],
                    "title":       j["title"],
                    "company":     j["company"],
                    "location":    j["location"],
                    "link":        j["link"],
                    "source":      j["source"],
                    "posted_date": j.get("posted_date", ""),
                    "idioma":      j.get("idioma", ""),
                    "tipo_empleo": j.get("tipo_empleo", ""),
                    "seen_at":     now_ts,
                })
        print(f"[buscatrabajito-jobs] {len(jobs)} vacantes guardadas")
    except Exception as e:
        print(f"  save_jobs_batch error: {e}")


def trigger_matching(new_jobs: list[dict]):
    if not new_jobs:
        return
    lambda_client = boto3.client("lambda", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    try:
        lambda_client.invoke(
            FunctionName="buscatrabajito-matching",
            InvocationType="Event",
            Payload=json.dumps({"jobs": new_jobs}).encode(),
        )
        print(f"[matching] invocado con {len(new_jobs)} vacantes")
    except Exception as e:
        print(f"  trigger_matching error: {e}")


# ── Helpers ───────────────────────────────────────────────────────
def job_id(title: str, company: str, location: str = "") -> str:
    clave = f"{title.lower().strip()}{company.lower().strip()}{location.lower().strip()}"
    return hashlib.md5(clave.encode()).hexdigest()


def random_headers() -> dict:
    return random.choice(HEADERS_POOL)


def extraer_json_embebido(texto: str, marcador: str) -> dict | None:
    """Algunos sitios (ej. Talenteca) no traen una API JSON aparte, pero sí
    incrustan el estado inicial de la página como `window.ALGO = {...}` en
    un <script>. Esto ubica el marcador y balancea llaves (respetando
    strings) para extraer y parsear ese objeto, sin asumir que termina en
    un punto fijo del HTML."""
    start = texto.find(marcador)
    if start == -1:
        return None
    start_json = texto.find("{", start)
    if start_json == -1:
        return None

    depth = 0
    end = None
    in_str = False
    esc = False
    for i in range(start_json, len(texto)):
        c = texto[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if end is None:
        return None
    try:
        return json.loads(texto[start_json:end])
    except json.JSONDecodeError:
        return None


def keywords_from_terms(terms: list[str]) -> list[str]:
    words = set()
    for term in terms:
        for word in term.lower().split():
            if len(word) > 3:
                words.add(word)
    return list(words)


def is_relevant(title: str, location: str, keywords: list[str]) -> bool:
    title_l = title.lower()
    if not any(k in title_l for k in keywords):
        return False
    loc_clean = location.strip().lower()
    if not loc_clean or loc_clean in ("n/a", "-", ""):
        return False
    return True


def is_relevant_remote(title: str, keywords: list[str]) -> bool:
    title_l = title.lower()
    return any(k in title_l for k in keywords)


def safe_get(url: str, timeout: int = 15, retries: int = 1) -> requests.Response | None:
    for attempt in range(retries + 1):
        try:
            time.sleep(random.uniform(1.0, 2.5))
            r = requests.get(url, headers=random_headers(), timeout=timeout)
            if r.status_code == 200:
                return r
            # 429 = rate limit — con más páginas por término (MAX_PAGES=6)
            # el volumen de requests sube y LinkedIn empieza a limitarnos.
            # Un reintento con espera larga suele bastar sin sacrificar cobertura.
            if r.status_code == 429 and attempt < retries:
                print(f"  HTTP 429, esperando antes de reintentar: {url[:80]}")
                time.sleep(random.uniform(8.0, 15.0))
                continue
            print(f"  HTTP {r.status_code}: {url[:80]}")
            return None
        except Exception as e:
            print(f"  Error GET: {e} → {url[:80]}")
            return None
    return None


# ── Scrapers ──────────────────────────────────────────────────────

def scrape_occ(terms: list[str]) -> list[dict]:
    jobs = []
    keywords = keywords_from_terms(terms)
    for term in terms:
        slug = slugify(term)
        if not slug:
            continue
        url = f"https://www.occ.com.mx/empleos/de-{slug}/"
        r = safe_get(url)
        if not r:
            continue
        try:
            soup = BeautifulSoup(r.text, "html.parser")

            # El link visible en cada tarjeta apunta a la EMPRESA, no a la
            # vacante — la liga real (con slug) solo viene en el JSON-LD
            # de la página, así que hay que cruzarla por id con las
            # tarjetas del DOM (data-id).
            id_a_url = {}
            ld = soup.find("script", type="application/ld+json")
            if ld and ld.string:
                data = json.loads(ld.string)
                for node in data.get("@graph", []):
                    if "itemListElement" in node:
                        for it in node["itemListElement"]:
                            m = re.search(r"/oferta/(\d+)-", it.get("url", ""))
                            if m:
                                id_a_url[m.group(1)] = it["url"].split("?")[0].replace("//empleo", "/empleo")
                        break

            cards = soup.find_all(attrs={"data-offers-grid-offer-item-container": True})
            for card in cards:
                try:
                    oferta_id = card.get("data-id", "")
                    title_el  = card.find("h2")
                    title     = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    company_el = card.select_one(".line-clamp-title a")
                    company    = company_el.get_text(strip=True) if company_el else "N/A"

                    loc_el   = card.select_one(".no-alter-loc-text p")
                    location = loc_el.get_text(strip=True) if loc_el else "México"

                    # Sin match en el JSON-LD (tarjetas promocionadas que no
                    # entran a esa lista): mejor un link con solo el id que
                    # nada, aunque le falte el slug bonito.
                    link = id_a_url.get(oferta_id, f"https://www.occ.com.mx/empleo/oferta/{oferta_id}")

                    fecha_el = card.select_one("span.mr-2.text-sm.font-light")
                    posted_date = parse_fecha_relativa(fecha_el.get_text(strip=True)) if fecha_el else ""

                    if is_relevant(title, location, keywords):
                        jobs.append({"source": "OCC", "title": title, "company": company,
                                     "location": location, "link": link, "posted_date": posted_date,
                                     "job_id": job_id(title, company, location)})
                except Exception as e:
                    print(f"  OCC card error: {e}")
        except Exception as e:
            print(f"  OCC parse error [{term}]: {e}")
    print(f"OCC: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_linkedin(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    MAX_PAGES = 6  # antes 3 — LinkedIn sin sesión no deja ordenar por fecha,
    # así que hay que muestrear más profundo en resultados por "relevancia"
    # para pescar vacantes nuevas que no rankean en las primeras páginas.

    for term in terms:
        for location_query in LINKEDIN_LOCATIONS:
            for page in range(MAX_PAGES):
                start      = page * 25
                target_url = (
                    "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
                    f"?keywords={requests.utils.quote(term)}"
                    f"&location={requests.utils.quote(location_query)}"
                    f"&f_TPR=r1209600&start={start}"
                )

                if SCRAPER_SERVICE_API_KEY:
                    payload = {
                        "api_key":     SCRAPER_SERVICE_API_KEY,
                        "url":         target_url,
                        "country_code": "mx",
                        "premium":     "true",
                    }
                    try:
                        r = requests.get(SCRAPER_SERVICE_URL, params=payload, timeout=25)
                    except Exception as e:
                        print(f"  Error scraping service [{term}|{location_query}]: {e}")
                        break
                else:
                    r = safe_get(target_url)

                if not r or r.status_code != 200:
                    print(f"  LinkedIn: sin resultados [{term}|{location_query}] pág {page}")
                    break

                soup  = BeautifulSoup(r.text, "html.parser")
                cards = soup.find_all("li")
                if not cards:
                    break

                for card in cards:
                    try:
                        title_el   = card.find("h3")
                        company_el = card.find("h4")
                        link_el    = card.find("a", href=True)
                        loc_el     = card.find(class_="job-search-card__location")
                        # Fecha real de publicación (no cuándo la vimos nosotros).
                        # LinkedIn solo da precisión de día, no de hora.
                        time_el    = card.find("time", class_="job-search-card__listdate")
                        title    = title_el.get_text(strip=True)   if title_el   else ""
                        company  = company_el.get_text(strip=True) if company_el else "N/A"
                        link     = link_el["href"].split("?")[0]   if link_el    else ""
                        location = loc_el.get_text(strip=True)     if loc_el     else location_query
                        posted_date = time_el.get("datetime") if time_el else ""
                        if title and is_relevant(title, location, keywords):
                            jobs.append({"source": "LinkedIn", "title": title, "company": company,
                                         "location": location, "link": link,
                                         "posted_date": posted_date,
                                         "job_id": job_id(title, company, location)})
                    except Exception as e:
                        print(f"  LinkedIn card error: {e}")

                if len(cards) < 25:
                    break  # última página

    print(f"LinkedIn: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_computrabajo(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    for term in terms:
        slug = slugify(term)
        if not slug:
            continue
        # El dominio viejo (www.computrabajo.com.mx) ahora hace 301 a este.
        url = f"https://mx.computrabajo.com/empleos-de-{slug}"
        r   = safe_get(url)
        if not r:
            continue
        soup  = BeautifulSoup(r.text, "html.parser")
        cards = soup.find_all("article", class_=lambda c: c and "box_offer" in c if c else False)
        for card in cards:
            try:
                title_el = card.select_one("a.js-o-link")
                title    = title_el.get_text(strip=True) if title_el else ""
                if not title:
                    continue

                href = title_el.get("href", "")
                link = href if href.startswith("http") else f"https://mx.computrabajo.com{href}"

                # Compañía y ubicación son los dos primeros <p class="...
                # fc_base..."> de la tarjeta, en ese orden fijo — no hay
                # una clase que las distinga entre sí.
                parrafos = card.select("p.fc_base")
                company  = parrafos[0].get_text(" ", strip=True) if len(parrafos) > 0 else "N/A"
                # Algunas tarjetas traen una calificación numérica pegada
                # antes del nombre (ej. "3.9 Hermos S.A DE C.V.").
                company  = re.sub(r"^\d+(\.\d+)?\s+", "", company).strip() or "N/A"
                location = parrafos[1].get_text(" ", strip=True) if len(parrafos) > 1 else "México"

                fecha_el = card.select_one("p.fs13.fc_aux.mt15")
                posted_date = parse_fecha_relativa(fecha_el.get_text(strip=True)) if fecha_el else ""

                if is_relevant(title, location, keywords):
                    jobs.append({"source": "Computrabajo", "title": title, "company": company,
                                 "location": location, "link": link, "posted_date": posted_date,
                                 "job_id": job_id(title, company, location)})
            except Exception as e:
                print(f"  Computrabajo card error: {e}")
    print(f"Computrabajo: {len(jobs)} vacantes encontradas")
    return jobs


WORKHOURS_A_TIPO_EMPLEO = {
    "tiempo completo": "Tiempo completo",
    "tiempo parcial": "Medio tiempo",
    "prácticas / becario / pasantía": "Prácticas / Becario",
    "por proyecto": "Freelance / Proyecto",
}


def scrape_talenteca(terms: list[str]) -> list[dict]:
    jobs      = []
    keywords  = keywords_from_terms(terms)
    MAX_PAGES = 2  # 20 resultados por página, ya es buen volumen por término
    for term in terms:
        for page in range(1, MAX_PAGES + 1):
            url = (
                "https://www.talenteca.com/empleos"
                f"?q={requests.utils.quote(term)}&page={page}"
            )
            r = safe_get(url)
            if not r:
                break
            try:
                data = extraer_json_embebido(
                    r.text, "window._tk_tamarin_job_ad_search_initial_payload = "
                )
                resultados_wrap = (data or {}).get("payload", {}).get("search_response", {}).get("job_ads_results", {})
                resultados = resultados_wrap.get("results", [])
            except Exception as e:
                print(f"  Talenteca parse error [{term}] pág {page}: {e}")
                break

            if not resultados:
                break

            for item in resultados:
                try:
                    title   = item.get("title", "")
                    company = item.get("company_name") or "N/A"
                    city, region = item.get("city", ""), item.get("region", "")
                    location = f"{city}, {region}" if city and region else (region or city or "México")
                    link = item.get("job_ad_url", "")

                    ts = item.get("published_at")
                    posted_date = (
                        datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                        if ts else ""
                    )

                    # Talenteca sí da el tipo de empleo explícito (a
                    # diferencia de las demás fuentes, donde hay que
                    # adivinarlo del título) — se usa cuando mapea a
                    # nuestro vocabulario.
                    tipo_empleo = ""
                    for w in (item.get("workhours") or []):
                        tipo_empleo = WORKHOURS_A_TIPO_EMPLEO.get(w.lower(), "")
                        if tipo_empleo:
                            break

                    if title and is_relevant(title, location, keywords):
                        jobs.append({
                            "source": "Talenteca", "title": title, "company": company,
                            "location": location, "link": link, "posted_date": posted_date,
                            "tipo_empleo": tipo_empleo,
                            "job_id": job_id(title, company, location),
                        })
                except Exception as e:
                    print(f"  Talenteca item error: {e}")

            total_pages = resultados_wrap.get("total_pages", 1)
            if page >= total_pages:
                break
    print(f"Talenteca: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_bumeran(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    for term in terms:
        slug = slugify(term)
        if not slug:
            continue
        url = f"https://www.bumeran.com.mx/empleos-busqueda-{slug}.html?reciente=true"
        r   = safe_get(url)
        if not r:
            continue
        soup  = BeautifulSoup(r.text, "html.parser")
        cards = (soup.find_all("div", class_=lambda c: c and "Posting" in c if c else False) or
                 soup.find_all("li",  class_=lambda c: c and "posting" in c.lower() if c else False) or
                 soup.find_all("article"))
        for card in cards:
            try:
                title_el   = card.find(["h2", "h3", "a"])
                company_el = card.find(class_=lambda c: c and "company" in c.lower() if c else False)
                link_el    = card.find("a", href=True)
                loc_el     = card.find(class_=lambda c: c and ("location" in c.lower() or "zona" in c.lower()) if c else False)
                title    = title_el.get_text(strip=True)   if title_el   else ""
                company  = company_el.get_text(strip=True) if company_el else "N/A"
                href     = link_el["href"] if link_el else ""
                link     = ("https://www.bumeran.com.mx" + href) if href.startswith("/") else href or url
                location = loc_el.get_text(strip=True) if loc_el else "México"
                if title and is_relevant(title, location, keywords):
                    jobs.append({"source": "Bumeran", "title": title, "company": company,
                                 "location": location, "link": link, "job_id": job_id(title, company, location)})
            except Exception as e:
                print(f"  Bumeran card error: {e}")
    print(f"Bumeran: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_remotive(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    for term in terms:
        url = f"https://remotive.com/api/remote-jobs?search={requests.utils.quote(term)}&limit=50"
        try:
            time.sleep(random.uniform(1.0, 2.0))
            r = requests.get(url, timeout=15)
            if r.status_code != 200:
                print(f"  Remotive API {r.status_code}: {term}")
                continue
            data = r.json()
            for job in data.get("jobs", []):
                title   = job.get("title", "")
                company = job.get("company_name", "N/A")
                link    = job.get("url", "")
                if title and is_relevant_remote(title, keywords):
                    jobs.append({"source": "Remotive", "title": title, "company": company,
                                 "location": "Remoto", "link": link,
                                 "job_id": job_id(title, company, "Remoto")})
        except Exception as e:
            print(f"  Remotive error [{term}]: {e}")
    print(f"Remotive: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_freelancer(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    for term in terms:
        url = (
            "https://www.freelancer.com/api/projects/0.1/projects/active/"
            f"?query={requests.utils.quote(term)}&limit=30"
        )
        try:
            time.sleep(random.uniform(1.0, 2.0))
            r = requests.get(url, headers=random_headers(), timeout=15)
            if r.status_code != 200:
                print(f"  Freelancer API {r.status_code}: {term}")
                continue
            data = r.json()
            for p in data.get("result", {}).get("projects", []):
                title      = p.get("title", "")
                seo_url    = p.get("seo_url", "")
                link       = f"https://www.freelancer.com/projects/{seo_url}" if seo_url else ""
                submitdate = p.get("submitdate")
                posted_date = (
                    datetime.fromtimestamp(submitdate, tz=timezone.utc).strftime("%Y-%m-%d")
                    if submitdate else ""
                )
                if title and is_relevant_remote(title, keywords):
                    jobs.append({
                        "source": "Freelancer", "title": title, "company": "Freelancer.com",
                        # Trabajo 100% remoto por naturaleza — "Remoto" en location
                        # reutiliza el chequeo de modalidad Remoto que ya existe en
                        # job_matches_profile, sin necesitar un caso especial.
                        "location": "Remoto", "link": link,
                        # El id numérico del proyecto (único) en vez de
                        # title+company+location: muchos títulos de Freelancer.com
                        # son genéricos ("Website designing") y "company" siempre
                        # es el mismo placeholder, así que hashear solo esos campos
                        # colisionaría entre proyectos distintos.
                        "job_id": job_id(title, "Freelancer.com", str(p.get("id", ""))),
                        "posted_date": posted_date,
                        # Idioma real que reporta la API — más confiable que la
                        # heurística por palabras clave que usa matching.py para
                        # las demás fuentes.
                        "idioma": p.get("language", ""),
                    })
        except Exception as e:
            print(f"  Freelancer error [{term}]: {e}")
    print(f"Freelancer: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_weworkremotely(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    rss_feeds = [
        "https://weworkremotely.com/categories/remote-data-science-jobs.rss",
        "https://weworkremotely.com/categories/remote-programming-jobs.rss",
        "https://weworkremotely.com/remote-jobs.rss",
    ]
    import xml.etree.ElementTree as ET
    for feed_url in rss_feeds:
        try:
            time.sleep(random.uniform(1.0, 2.0))
            r = requests.get(feed_url, headers=random_headers(), timeout=15)
            if r.status_code != 200:
                print(f"  WWR RSS {r.status_code}: {feed_url}")
                continue
            root = ET.fromstring(r.content)
            for item in root.findall(".//item"):
                title       = item.findtext("title", "").strip()
                company_raw = title.split(" at ")[-1] if " at " in title else "N/A"
                title_clean = title.split(" at ")[0].strip() if " at " in title else title
                link        = item.findtext("link", "").strip()
                if title_clean and is_relevant_remote(title_clean, keywords):
                    jobs.append({"source": "WeWorkRemotely", "title": title_clean,
                                 "company": company_raw, "location": "Remoto",
                                 "link": link, "job_id": job_id(title_clean, company_raw, "Remoto")})
        except Exception as e:
            print(f"  WWR RSS error: {e}")
    print(f"WeWorkRemotely: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_himalayas(terms: list[str]) -> list[dict]:
    jobs     = []
    keywords = keywords_from_terms(terms)
    for term in terms:
        url = f"https://himalayas.app/api/jobs?q={requests.utils.quote(term)}&limit=50"
        try:
            time.sleep(random.uniform(1.0, 2.0))
            r = requests.get(url, headers={"Accept": "application/json"}, timeout=15)
            if r.status_code != 200:
                print(f"  Himalayas API {r.status_code}: {term}")
                continue
            data  = r.json()
            items = data.get("jobs", data.get("data", []))
            for job in items:
                title    = job.get("title", "")
                company  = job.get("company", {}).get("name", "N/A") if isinstance(job.get("company"), dict) else job.get("company", "N/A")
                link     = job.get("applicationLink", job.get("url", job.get("link", "")))
                location = job.get("location", "Remoto / México")
                if title and is_relevant_remote(title, keywords):
                    jobs.append({"source": "Himalayas", "title": title, "company": company,
                                 "location": location, "link": link,
                                 "job_id": job_id(title, company, location)})
        except Exception as e:
            print(f"  Himalayas error [{term}]: {e}")
    print(f"Himalayas: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_eightfold(terms: list[str], source_name: str, api_host: str, domain_param: str) -> list[dict]:
    """OXXO y Coca-Cola FEMSA publican sus vacantes en Eightfold.ai (careers
    site propio con dominio blanco, o subdominio directo de eightfold.ai) —
    misma API pública en ambos casos, solo cambian el host y el 'domain'
    de la empresa (encontrado inspeccionando el HTML/cookies de cada
    careers site, no es un parámetro documentado). La API pagina fijo en
    10 resultados por página sin importar el 'num' que se pida.
    """
    jobs      = []
    keywords  = keywords_from_terms(terms)
    RESULTS_PER_PAGE = 10
    MAX_PAGES = 3
    for term in terms:
        for page in range(MAX_PAGES):
            start = page * RESULTS_PER_PAGE
            url = (
                f"https://{api_host}/api/apply/v2/jobs"
                f"?domain={domain_param}&start={start}&num={RESULTS_PER_PAGE}"
                f"&query={requests.utils.quote(term)}"
            )
            try:
                time.sleep(random.uniform(1.0, 2.0))
                r = requests.get(url, headers=random_headers(), timeout=15)
                if r.status_code != 200:
                    print(f"  {source_name} API {r.status_code}: {term}")
                    break
                data = r.json()
            except Exception as e:
                print(f"  {source_name} error [{term}] pág {page}: {e}")
                break

            positions = data.get("positions", [])
            if not positions:
                break

            for p in positions:
                try:
                    title    = p.get("name", "")
                    location = p.get("location", "México")
                    link     = p.get("canonicalPositionUrl", "")
                    t_create = p.get("t_create")
                    posted_date = (
                        datetime.fromtimestamp(t_create, tz=timezone.utc).strftime("%Y-%m-%d")
                        if t_create else ""
                    )
                    if title and is_relevant(title, location, keywords):
                        jobs.append({
                            "source": source_name, "title": title, "company": source_name,
                            "location": location, "link": link, "posted_date": posted_date,
                            # El id numérico de Eightfold es único y estable — mismo
                            # patrón que Freelancer.com, se hashea junto con la fuente
                            # en vez de title+company+location (muchos títulos se
                            # repiten entre sucursales/ciudades).
                            "job_id": job_id(title, source_name, str(p.get("id", ""))),
                        })
                except Exception as e:
                    print(f"  {source_name} item error: {e}")

            if data.get("count", 0) <= start + RESULTS_PER_PAGE:
                break
    print(f"{source_name}: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_cemex(terms: list[str]) -> list[dict]:
    """CEMEX publica sus vacantes en un career site SAP SuccessFactors
    propio (jobs.cemex.com) con búsqueda real por palabra clave — misma
    familia de plataforma que se investigó para FEMSA Salud/Solistica,
    pero con un tema/HTML distinto (tabla con columnas título/ubicación/
    fecha, no requiere JS)."""
    jobs      = []
    keywords  = keywords_from_terms(terms)
    RESULTS_PER_PAGE = 10
    MAX_PAGES = 2
    for term in terms:
        for page in range(MAX_PAGES):
            startrow = page * RESULTS_PER_PAGE
            url = (
                "https://jobs.cemex.com/search/"
                f"?q={requests.utils.quote(term)}&locale=es_MX&startrow={startrow}"
            )
            r = safe_get(url)
            if not r:
                break
            soup = BeautifulSoup(r.text, "html.parser")
            rows = soup.select("tr.data-row")
            if not rows:
                break

            for row in rows:
                try:
                    title_el = row.select_one("a.jobTitle-link")
                    title    = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    href = title_el.get("href", "")
                    link = href if href.startswith("http") else f"https://jobs.cemex.com{href}"

                    loc_el   = row.select_one("td.colLocation span.jobLocation")
                    location = normalizar_location_cemex(loc_el.get_text(strip=True)) if loc_el else "México"

                    date_el     = row.select_one("td.colDate span.jobDate")
                    posted_date = parse_fecha_cemex(date_el.get_text(strip=True)) if date_el else ""

                    if is_relevant(title, location, keywords):
                        jobs.append({"source": "CEMEX", "title": title, "company": "CEMEX",
                                     "location": location, "link": link, "posted_date": posted_date,
                                     "job_id": job_id(title, "CEMEX", location)})
                except Exception as e:
                    print(f"  CEMEX card error: {e}")

            if len(rows) < RESULTS_PER_PAGE:
                break
    print(f"CEMEX: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_ternium(terms: list[str]) -> list[dict]:
    """Ternium usa el mismo SAP SuccessFactors que CEMEX, pero con un
    tema visual de tarjetas (<li class="job-tile" data-url="...">) en
    vez de tabla — selectores distintos, mismo motor de búsqueda por
    palabra clave."""
    jobs      = []
    keywords  = keywords_from_terms(terms)
    RESULTS_PER_PAGE = 10
    MAX_PAGES = 2
    for term in terms:
        for page in range(MAX_PAGES):
            startrow = page * RESULTS_PER_PAGE
            url = (
                "https://carrera.ternium.com/search/"
                f"?q={requests.utils.quote(term)}&locale=es_MX&startrow={startrow}"
            )
            r = safe_get(url)
            if not r:
                break
            soup  = BeautifulSoup(r.text, "html.parser")
            tiles = soup.select("li.job-tile")
            if not tiles:
                break

            for tile in tiles:
                try:
                    href = tile.get("data-url", "")
                    if not href:
                        continue
                    title_el = tile.select_one("a.jobTitle-link")
                    title    = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    link = href if href.startswith("http") else f"https://carrera.ternium.com{href}"

                    loc_el     = tile.find(id=re.compile(r"-location-value$"))
                    country_el = tile.find(id=re.compile(r"-country-value$"))
                    ciudad     = loc_el.get_text(strip=True) if loc_el else ""
                    country    = country_el.get_text(strip=True) if country_el else ""
                    location   = normalizar_location_ternium(ciudad, country) if ciudad else "México"

                    if is_relevant(title, location, keywords):
                        jobs.append({"source": "Ternium", "title": title, "company": "Ternium",
                                     "location": location, "link": link,
                                     "job_id": job_id(title, "Ternium", location)})
                except Exception as e:
                    print(f"  Ternium card error: {e}")

            if len(tiles) < RESULTS_PER_PAGE:
                break
    print(f"Ternium: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_workday(terms: list[str], source_name: str, wd_host: str, tenant: str, site: str) -> list[dict]:
    """Workday es una de las plataformas de ATS más comunes entre
    multinacionales (Grupo Modelo/AB InBev la usa, y muchas otras
    también) — API pública de búsqueda (Candidate Experience / CxS) en
    POST {wd_host}/wday/cxs/{tenant}/{site}/jobs, sin sesión ni token.
    Genérica a propósito para poder sumar más empresas con solo pasar
    su tenant/site, igual que se hizo con scrape_eightfold.

    La ubicación (ej. "MEX - CD - LCM Occidente, Guadalajara") se deja
    tal cual — el matching por estado ya solo mira el ÚLTIMO segmento
    después de la coma, así que el prefijo interno de la empresa no
    afecta y no hace falta normalizarla aparte.
    """
    jobs      = []
    keywords  = keywords_from_terms(terms)
    api_url   = f"https://{wd_host}/wday/cxs/{tenant}/{site}/jobs"
    site_url  = f"https://{wd_host}/es/recruiting/{tenant}/{site}"
    RESULTS_PER_PAGE = 20
    MAX_PAGES = 2
    for term in terms:
        for page in range(MAX_PAGES):
            offset  = page * RESULTS_PER_PAGE
            payload = json.dumps({
                "appliedFacets": {}, "limit": RESULTS_PER_PAGE, "offset": offset, "searchText": term,
            })
            try:
                time.sleep(random.uniform(1.0, 2.0))
                headers = random_headers()
                headers["Content-Type"] = "application/json"
                r = requests.post(api_url, data=payload, headers=headers, timeout=15)
                if r.status_code != 200:
                    print(f"  {source_name} API {r.status_code}: {term}")
                    break
                data = r.json()
            except Exception as e:
                print(f"  {source_name} error [{term}] pág {page}: {e}")
                break

            postings = data.get("jobPostings", [])
            if not postings:
                break

            for p in postings:
                try:
                    title    = p.get("title", "")
                    location = p.get("locationsText") or "México"
                    link     = site_url + p.get("externalPath", "")
                    posted_date = parse_fecha_workday(p.get("postedOn", ""))
                    if title and is_relevant(title, location, keywords):
                        jobs.append({"source": source_name, "title": title, "company": source_name,
                                     "location": location, "link": link, "posted_date": posted_date,
                                     "job_id": job_id(title, source_name, location)})
                except Exception as e:
                    print(f"  {source_name} item error: {e}")

            if data.get("total", 0) <= offset + RESULTS_PER_PAGE:
                break
    print(f"{source_name}: {len(jobs)} vacantes encontradas")
    return jobs


def scrape_cargill(terms: list[str]) -> list[dict]:
    """Cargill usa TalentBrew (Radancy) — a diferencia de Whirlpool/
    Schneider/Chedraui, sí sirve el HTML de resultados directo (sin
    esperar JS), con paginación real vía ?p=N. Cargill opera en toda
    LATAM (Paraguay, Colombia, Argentina, etc., no solo México) — las
    vacantes fuera de México se dejan pasar tal cual, mismo criterio
    que ya se usa con Ternium: no van a matchear ningún estado
    mexicano de todos modos."""
    jobs      = []
    keywords  = keywords_from_terms(terms)
    MAX_PAGES = 2
    for term in terms:
        slug = slugify(term)
        if not slug:
            continue
        for page in range(1, MAX_PAGES + 1):
            # La página 1 real es la URL sin "?p=" — agregarlo (incluso
            # como "?p=1") hace que ignore el término buscado y devuelva
            # una mezcla genérica de vacantes de toda la empresa.
            url = f"https://careers.cargill.com/es/search-jobs/{slug}/"
            if page > 1:
                url += f"?p={page}"
            r = safe_get(url)
            if not r:
                break
            soup       = BeautifulSoup(r.text, "html.parser")
            contenedor = soup.find(id="search-results-list")
            items      = contenedor.find_all("li") if contenedor else []
            if not items:
                break

            for li in items:
                try:
                    a = li.find("a")
                    if not a:
                        continue
                    title_el = a.find("h3")
                    title    = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    href = a.get("href", "")
                    link = href if href.startswith("http") else f"https://careers.cargill.com{href}"

                    loc_el   = a.find(class_="job-location")
                    location = loc_el.get_text(strip=True) if loc_el else "México"

                    if is_relevant(title, location, keywords):
                        jobs.append({"source": "Cargill", "title": title, "company": "Cargill",
                                     "location": location, "link": link,
                                     "job_id": job_id(title, "Cargill", location)})
                except Exception as e:
                    print(f"  Cargill card error: {e}")

            if len(items) < 10:
                break
    print(f"Cargill: {len(jobs)} vacantes encontradas")
    return jobs


# ── Deduplicar ────────────────────────────────────────────────────
def filter_new(jobs: list[dict], seen: set) -> list[dict]:
    new_jobs        = []
    seen_this_batch = set()
    for j in jobs:
        if j["job_id"] not in seen and j["job_id"] not in seen_this_batch:
            new_jobs.append(j)
            seen_this_batch.add(j["job_id"])
    return new_jobs


# ── Handler Lambda ────────────────────────────────────────────────
def main(event=None, context=None):
    print(f"[{datetime.now().isoformat()}] Iniciando búsqueda...")

    terms = get_search_terms()
    if not terms:
        print("ℹ️  No hay perfiles guardados en BuscoTrabajito todavía, nada que buscar.")
        return {"statusCode": 200, "body": "Sin perfiles"}
    print(f"Términos de búsqueda ({len(terms)}): {terms}")

    seen = load_seen()

    scrapers = [
        ("LinkedIn", lambda: scrape_linkedin(terms)),
        ("Freelancer", lambda: scrape_freelancer(terms)),
        ("OCC", lambda: scrape_occ(terms)),
        ("Computrabajo", lambda: scrape_computrabajo(terms)),
        ("Talenteca", lambda: scrape_talenteca(terms)),
        ("OXXO", lambda: scrape_eightfold(terms, "OXXO", "careers.oxxo.com", "oxxo.com")),
        ("Coca-Cola FEMSA", lambda: scrape_eightfold(terms, "Coca-Cola FEMSA", "coca-colafemsa.eightfold.ai", "coca-colafemsa.com")),
        ("CEMEX", lambda: scrape_cemex(terms)),
        ("Ternium", lambda: scrape_ternium(terms)),
        ("Grupo Modelo", lambda: scrape_workday(terms, "Grupo Modelo", "wd1.myworkdaysite.com", "abinbev", "MEX")),
        ("Cargill", lambda: scrape_cargill(terms)),
    ]

    all_jobs = []
    for name, fn in scrapers:
        print(f"\n── {name} ──")
        try:
            found = fn()
            all_jobs.extend(found)
        except Exception as e:
            print(f"  Error en {name}: {e}")

    print(f"\nTotal bruto: {len(all_jobs)} vacantes de {len(scrapers)} fuentes")

    new_jobs = filter_new(all_jobs, seen)
    print(f"Nuevas (no vistas antes): {len(new_jobs)}")

    if new_jobs:
        save_seen_batch([j["job_id"] for j in new_jobs])
        save_jobs_batch(new_jobs)
        trigger_matching(new_jobs)
        print("✅ buscatrabajito-matching invocado y DynamoDB actualizado")
    else:
        print("ℹ️  No hay vacantes nuevas")

    return {"statusCode": 200, "body": f"{len(new_jobs)} vacantes nuevas"}


if __name__ == "__main__":
    main()