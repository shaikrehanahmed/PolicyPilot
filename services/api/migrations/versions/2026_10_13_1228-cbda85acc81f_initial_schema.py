"""initial_schema

Revision ID: cbda85acc81f
Revises: None
Create Date: 2026-10-13 12:28:14.764517

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import BYTEA, JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = 'cbda85acc81f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector and UUID extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    # 2. Users table
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=True),
        sa.Column("auth_provider_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )

    # 3. Profiles table
    op.create_table(
        "profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("data_encrypted", BYTEA, nullable=True),
        sa.Column("schema_version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )

    # 4. Sources table
    op.create_table(
        "sources",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("url", sa.Text(), unique=True, index=True, nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("publisher", sa.String(255), nullable=False),
        sa.Column("source_tier", sa.SmallInteger(), server_default="1", nullable=False),
        sa.Column("department", sa.String(255), nullable=True),
        sa.Column("state", sa.String(10), nullable=True),
        sa.Column("doc_type", sa.String(50), server_default="guideline", nullable=False),
        sa.Column("source_updated_at", sa.DateTime(), nullable=True),
        sa.Column("last_verified_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column("verification_status", sa.String(50), server_default="VERIFIED", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )

    # 5. Schemes table
    op.create_table(
        "schemes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(150), unique=True, index=True, nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("category", sa.String(100), index=True, nullable=False),
        sa.Column("level", sa.String(50), server_default="CENTRAL", nullable=False),
        sa.Column("state", sa.String(10), index=True, nullable=True),
        sa.Column("department", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )

    # 6. Scheme Sources Association
    op.create_table(
        "scheme_sources",
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("source_id", UUID(as_uuid=True), sa.ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.String(50), server_default="primary", nullable=False),
    )

    # 7. Scheme Criteria table
    op.create_table(
        "scheme_criteria",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False),
        sa.Column("criterion_key", sa.String(100), index=True, nullable=False),
        sa.Column("operator", sa.String(50), nullable=False),
        sa.Column("value", JSONB, nullable=False),
        sa.Column("required", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("source_id", UUID(as_uuid=True), sa.ForeignKey("sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_ref", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=True),
    )

    # 8. Scheme Documents table
    op.create_table(
        "scheme_documents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False),
        sa.Column("kind", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("required", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("source_id", UUID(as_uuid=True), sa.ForeignKey("sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("route", sa.String(255), nullable=True),
        sa.Column("apply_url", sa.Text(), nullable=True),
    )

    # 9. Document Chunks (Vector Store table for Evidence Chunks)
    op.create_table(
        "document_chunks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("source_id", UUID(as_uuid=True), sa.ForeignKey("sources.id", ondelete="CASCADE"), index=True, nullable=False),
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("schemes.id", ondelete="SET NULL"), index=True, nullable=True),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("page_ref", sa.String(100), nullable=True),
        sa.Column("section_ref", sa.String(255), nullable=True),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("metadata_json", JSONB, server_default="{}", nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=True),
    )

    # 10. Eligibility Results table
    op.create_table(
        "eligibility_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("profile_id", UUID(as_uuid=True), sa.ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=True),
        sa.Column("scheme_id", UUID(as_uuid=True), sa.ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("rules_version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("engine_trace", JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )

    # 11. Audit Logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("request_id", sa.String(100), index=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("event", sa.String(100), nullable=False),
        sa.Column("node", sa.String(100), nullable=True),
        sa.Column("payload_redacted", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("eligibility_results")
    op.drop_table("document_chunks")
    op.drop_table("scheme_documents")
    op.drop_table("scheme_criteria")
    op.drop_table("scheme_sources")
    op.drop_table("schemes")
    op.drop_table("sources")
    op.drop_table("profiles")
    op.drop_table("users")
