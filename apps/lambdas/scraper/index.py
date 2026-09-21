"""
BuscoTrabajito — Scraper de vacantes multi-usuario
Fuentes: OCC Mundial, LinkedIn Jobs, Computrabajo, Bumeran,
         Remotive, We Work Remotely, Himalayas

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
        soup  = BeautifulSoup(r.text, "html.parser")
        cards = (soup.find_all("article") or
                 soup.find_all(attrs={"data-testid": "job-card"}) or
                 soup.find_all(class_=lambda c: c and "job-card" in c.lower() if c else False))
        for card in cards:
            try:
                title_el   = card.find(["h2", "h3"]) or card.find("a")
                company_el = (card.find(attrs={"data-testid": "company-name"}) or
                              card.find(class_=lambda c: c and "company" in c.lower() if c else False))
                link_el    = card.find("a", href=True)
                loc_el     = (card.find(attrs={"data-testid": "job-location"}) or
                              card.find(class_=lambda c: c and "location" in c.lower() if c else False))
                title    = title_el.get_text(strip=True)   if title_el   else ""
                company  = company_el.get_text(strip=True) if company_el else "N/A"
                href     = link_el["href"] if link_el else ""
                link     = ("https://www.occ.com.mx" + href) if href.startswith("/") else href or url
                location = loc_el.get_text(strip=True) if loc_el else "México"
                if title and is_relevant(title, location, keywords):
                    jobs.append({"source": "OCC", "title": title, "company": company,
                                 "location": location, "link": link, "job_id": job_id(title, company, location)})
            except Exception as e:
                print(f"  OCC card error: {e}")
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
        url = f"https://www.computrabajo.com.mx/empleos-de-{slug}"
        r   = safe_get(url)
        if not r:
            continue
        soup  = BeautifulSoup(r.text, "html.parser")
        cards = (soup.find_all("article", class_=lambda c: c and "box_offer" in c if c else False) or
                 soup.find_all("div",     class_=lambda c: c and "offer" in c.lower() if c else False) or
                 soup.find_all("li",      class_=lambda c: c and "offer" in c.lower() if c else False))
        for card in cards:
            try:
                title_el   = card.find(["h2", "h3", "a"])
                company_el = card.find(class_=lambda c: c and "company" in c.lower() if c else False)
                link_el    = card.find("a", href=True)
                loc_el     = card.find(class_=lambda c: c and ("location" in c.lower() or "city" in c.lower()) if c else False)
                title    = title_el.get_text(strip=True)   if title_el   else ""
                company  = company_el.get_text(strip=True) if company_el else "N/A"
                href     = link_el["href"] if link_el else ""
                link     = ("https://www.computrabajo.com.mx" + href) if href.startswith("/") else href or url
                location = loc_el.get_text(strip=True) if loc_el else "México"
                if title and is_relevant(title, location, keywords):
                    jobs.append({"source": "Computrabajo", "title": title, "company": company,
                                 "location": location, "link": link, "job_id": job_id(title, company, location)})
            except Exception as e:
                print(f"  Computrabajo card error: {e}")
    print(f"Computrabajo: {len(jobs)} vacantes encontradas")
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