from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from fastapi.responses import FileResponse, PlainTextResponse

##### Initialize logging #####
import logging
import logging.config
from app.config import Config

try:  # PyYAML is optional when running tests
    import yaml
except ModuleNotFoundError:  # pragma: no cover - exercised in CI
    yaml = None

BASE_DIR = Path(__file__).resolve().parent
LOGGING_CONFIG = BASE_DIR.parent / "app" / "logging.yaml"

# Ensure logs directory exists
if Config.LOGS_DIR and not Config.LOGS_DIR.exists():
    os.makedirs(Config.LOGS_DIR)

# Load logging configuration from YAML file when PyYAML is available
if LOGGING_CONFIG.exists() and yaml is not None:
    with open(LOGGING_CONFIG, "r") as f:
        config = yaml.safe_load(f.read())
        logging.config.dictConfig(config)
else:
    logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

if yaml is None:
    logger.warning("PyYAML not installed; using basic logging configuration")
elif not LOGGING_CONFIG.exists():
    logger.warning(
        "Logging configuration %s not found; using basic configuration", LOGGING_CONFIG
    )

##### Initialize the system #####
from contextlib import asynccontextmanager
from app.utils.db_utils import init_db
from app.services.user_service import create_superuser


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    init_db()
    # Create default admin users
    create_superuser()
    yield


app = FastAPI(lifespan=lifespan)

# zoom svs
os.makedirs("tiles", exist_ok=True)
app.mount("/tiles", StaticFiles(directory="tiles"), name="tiles")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",  # Vite
        "http://localhost:3000",
        "http://127.0.0.1:3000",  # CRA
        "http://localhost:8080",
        "http://127.0.0.1:8080",  # Express
        "http://localhost:5001",
        "http://127.0.0.1:5001",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

##### Load ReactJS app #####

FRONTEND_BUILD = BASE_DIR.parent / "frontend"
ASSETS_DIR = FRONTEND_BUILD / "assets"

if not Path(ASSETS_DIR).exists():
    os.makedirs(ASSETS_DIR)

# Mount React static files
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

logger.info(f"Serving frontend from: {FRONTEND_BUILD}")


@app.get("/", include_in_schema=False)
async def serve_spa():
    """
    Serve index.html for root (SPA ReactJS behavior)
    """
    index_file = FRONTEND_BUILD / "index.html"
    if not index_file.exists():
        logger.warning("Frontend build missing at %s", index_file)
        return PlainTextResponse("Frontend build not found", status_code=503)
    return FileResponse(index_file)


@app.get("/favicon.png", include_in_schema=False)
async def favicon():
    icon_file = FRONTEND_BUILD / "favicon.png"
    if not icon_file.exists():
        logger.warning("Frontend favicon missing at %s", icon_file)
        return PlainTextResponse("favicon not found", status_code=404)
    return FileResponse(icon_file)


##### Routes configuration #####

from app.routes import auth
from app.routes import admin
from app.routes import health
from app.routes import files


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(health.router)
app.include_router(files.router)
