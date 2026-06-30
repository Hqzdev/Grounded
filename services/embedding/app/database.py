from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.config import get_settings


def normalized_database_url() -> str:
    url = get_settings().database_url
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parts = urlsplit(url)
    query = urlencode([(key, value) for key, value in parse_qsl(parts.query) if key != "schema"])
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


engine = create_async_engine(normalized_database_url(), pool_pre_ping=True)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)
