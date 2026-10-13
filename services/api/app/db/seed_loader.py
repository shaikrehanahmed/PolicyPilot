import argparse
import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List

import yaml
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .models import Scheme, SchemeCriterion, SchemeDocument, SchemeSource, Source
from .session import AsyncSessionLocal, check_db_health

logger = logging.getLogger("policypilot.seed_loader")


def parse_and_validate_seed_yaml(file_path: Path) -> List[Dict[str, Any]]:
    """Reads and validates the scheme seed file.

    Refuses to treat unverified data as verified.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Seed file not found at: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not data or "schemes" not in data:
        raise ValueError(
            f"Invalid seed file structure; missing top-level 'schemes' key in {file_path}"
        )

    schemes = data["schemes"]
    validated: List[Dict[str, Any]] = []

    for idx, s in enumerate(schemes):
        slug = s.get("slug")
        name = s.get("name")
        if not slug or not name:
            raise ValueError(f"Scheme at index {idx} missing mandatory slug or name")

        source_info = s.get("source", {})
        status = source_info.get("verification_status", "REQUIRES_REVIEW")

        # Anti-fabrication check: refuse to silently mark unverified sources as verified
        if status not in (
            "VERIFIED",
            "UNVERIFIED_EXAMPLE",
            "REQUIRES_REVIEW",
            "STALE",
            "CONFLICTING",
        ):
            logger.warning(
                f"Scheme '{slug}' has unrecognized status '{status}'; forcing to REQUIRES_REVIEW"
            )
            source_info["verification_status"] = "REQUIRES_REVIEW"

        if status == "UNVERIFIED_EXAMPLE":
            logger.info(
                f"[FIXTURE] Scheme '{slug}' is explicitly registered as UNVERIFIED_EXAMPLE; "
                f"will NOT be represented as verified official data."
            )

        validated.append(s)

    return validated


async def ingest_scheme_records(session: AsyncSession, scheme_dict: Dict[str, Any]) -> Scheme:
    """Ingests or updates a scheme, its source, criteria, and document records."""
    slug = scheme_dict["slug"]

    # 1. Upsert Source
    source_data = scheme_dict.get("source")
    source_obj = None
    if source_data:
        src_url = source_data.get("url")
        src_query = await session.execute(select(Source).where(Source.url == src_url))
        source_obj = src_query.scalar_one_or_none()
        if not source_obj:
            source_obj = Source(
                url=src_url,
                title=source_data.get("title", "Untitled Publication"),
                publisher=source_data.get("publisher", "Unknown Publisher"),
                source_tier=source_data.get("source_tier", 1),
                doc_type=source_data.get("doc_type", "guideline"),
                verification_status=source_data.get("verification_status", "VERIFIED"),
            )
            session.add(source_obj)
            await session.flush()

    # 2. Upsert Scheme
    scheme_query = await session.execute(select(Scheme).where(Scheme.slug == slug))
    scheme_obj = scheme_query.scalar_one_or_none()
    if not scheme_obj:
        scheme_obj = Scheme(
            slug=slug,
            name=scheme_dict["name"],
            category=scheme_dict.get("category", "general"),
            level=scheme_dict.get("level", "CENTRAL"),
            state=scheme_dict.get("state"),
            department=scheme_dict.get("department"),
            description=scheme_dict.get("description", ""),
            active=scheme_dict.get("active", True),
        )
        session.add(scheme_obj)
        await session.flush()
    else:
        scheme_obj.name = scheme_dict["name"]
        scheme_obj.description = scheme_dict.get("description", "")
        scheme_obj.active = scheme_dict.get("active", True)
        await session.flush()

    # 3. Associate Source with Scheme
    if source_obj:
        assoc_q = await session.execute(
            select(SchemeSource).where(
                SchemeSource.scheme_id == scheme_obj.id,
                SchemeSource.source_id == source_obj.id,
            )
        )
        if not assoc_q.scalar_one_or_none():
            session.add(
                SchemeSource(
                    scheme_id=scheme_obj.id,
                    source_id=source_obj.id,
                    role="primary",
                )
            )
            await session.flush()

    # 4. Ingest Criteria
    for c_data in scheme_dict.get("criteria", []):
        c_key = c_data["criterion_key"]
        op = c_data["operator"]
        val = c_data["value"]

        # Check existing criterion by key
        crit_q = await session.execute(
            select(SchemeCriterion).where(
                SchemeCriterion.scheme_id == scheme_obj.id,
                SchemeCriterion.criterion_key == c_key,
            )
        )
        crit_obj = crit_q.scalar_one_or_none()
        if not crit_obj:
            crit_obj = SchemeCriterion(
                scheme_id=scheme_obj.id,
                criterion_key=c_key,
                operator=op,
                value=val,
                required=c_data.get("required", True),
                pathway=c_data.get("pathway"),
                source_id=source_obj.id if source_obj else None,
                source_ref=c_data.get("source_ref"),
                description=c_data.get("description"),
            )
            session.add(crit_obj)
        else:
            crit_obj.operator = op
            crit_obj.value = val
            crit_obj.pathway = c_data.get("pathway")
            crit_obj.source_ref = c_data.get("source_ref")
            crit_obj.description = c_data.get("description")

    # 5. Ingest Documents
    for d_data in scheme_dict.get("documents", []):
        d_name = d_data["name"]
        doc_q = await session.execute(
            select(SchemeDocument).where(
                SchemeDocument.scheme_id == scheme_obj.id,
                SchemeDocument.name == d_name,
            )
        )
        doc_obj = doc_q.scalar_one_or_none()
        if not doc_obj:
            doc_obj = SchemeDocument(
                scheme_id=scheme_obj.id,
                kind=d_data.get("kind", "identity"),
                name=d_name,
                required=d_data.get("required", True),
                source_id=source_obj.id if source_obj else None,
            )
            session.add(doc_obj)

    await session.commit()
    logger.info(f"Successfully processed scheme '{slug}' [{scheme_dict.get('name')}]")
    return scheme_obj


async def load_seed_data(seed_path: Path) -> int:
    """Entrypoint function to validate and load scheme seed data."""
    is_connected, _, msg = await check_db_health()
    if not is_connected:
        raise ConnectionError(f"Database connection failed: {msg}")

    schemes_data = parse_and_validate_seed_yaml(seed_path)
    async with AsyncSessionLocal() as session:
        for s in schemes_data:
            await ingest_scheme_records(session, s)

    return len(schemes_data)


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    parser = argparse.ArgumentParser(description="PolicyPilot Verified Seed Data Loader")
    parser.add_argument(
        "--seed-file",
        type=str,
        default="../../seed/schemes.yaml",
        help="Path to schemes YAML seed file",
    )
    args = parser.parse_args()
    seed_file = Path(args.seed_file).resolve()

    logger.info(f"Starting seed loading from: {seed_file}")
    try:
        count = asyncio.run(load_seed_data(seed_file))
        logger.info(f"Seed loading complete. {count} schemes loaded/verified.")
    except Exception as e:
        logger.error(f"Seed loading failed: {str(e)}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
