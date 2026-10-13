import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import BYTEA, JSONB, UUID
from sqlalchemy.orm import relationship

from ..core.config import settings
from .session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=True)
    auth_provider_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    data_encrypted = Column(BYTEA, nullable=True)  # AES-GCM encrypted demographic payload
    schema_version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profiles")
    eligibility_results = relationship("EligibilityResult", back_populates="profile")


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(Text, unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    publisher = Column(String(255), nullable=False)
    source_tier = Column(SmallInteger, default=1, nullable=False)  # 1..5 trust model
    department = Column(String(255), nullable=True)
    state = Column(String(10), nullable=True)
    doc_type = Column(String(50), default="guideline", nullable=False)
    source_updated_at = Column(DateTime, nullable=True)
    last_verified_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    content_hash = Column(String(64), nullable=True)
    verification_status = Column(String(50), default="VERIFIED", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    chunks = relationship("DocumentChunk", back_populates="source", cascade="all, delete-orphan")
    criteria = relationship("SchemeCriterion", back_populates="source")


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(150), unique=True, nullable=False, index=True)
    name = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    level = Column(String(50), default="CENTRAL", nullable=False)
    state = Column(String(10), nullable=True, index=True)
    department = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    criteria = relationship(
        "SchemeCriterion", back_populates="scheme", cascade="all, delete-orphan"
    )
    documents = relationship(
        "SchemeDocument", back_populates="scheme", cascade="all, delete-orphan"
    )
    chunks = relationship("DocumentChunk", back_populates="scheme")


class SchemeSource(Base):
    __tablename__ = "scheme_sources"

    scheme_id = Column(
        UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True
    )
    source_id = Column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True
    )
    role = Column(String(50), default="primary", nullable=False)  # primary, secondary, amendment


class SchemeCriterion(Base):
    __tablename__ = "scheme_criteria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme_id = Column(
        UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    criterion_key = Column(String(100), nullable=False, index=True)
    operator = Column(String(50), nullable=False)
    value = Column(JSONB, nullable=False)  # e.g. {"v": 800000} or {"v": ["farmer"]}
    required = Column(Boolean, default=True, nullable=False)
    source_id = Column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True
    )
    source_ref = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    pathway = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)
    effective_from = Column(Date, nullable=True)

    scheme = relationship("Scheme", back_populates="criteria")
    source = relationship("Source", back_populates="criteria")


class SchemeDocument(Base):
    __tablename__ = "scheme_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme_id = Column(
        UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    required = Column(Boolean, default=True, nullable=False)
    source_id = Column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True
    )
    deadline = Column(Date, nullable=True)
    route = Column(String(255), nullable=True)
    apply_url = Column(Text, nullable=True)

    scheme = relationship("Scheme", back_populates="documents")


class DocumentChunk(Base):
    """Vector store table for evidence chunks.
    Separated strictly from business rules.
    """

    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scheme_id = Column(
        UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    page_ref = Column(String(100), nullable=True)
    section_ref = Column(String(255), nullable=True)
    embedding = Column(Vector(settings.embedding_dim), nullable=True)  # pgvector embedding
    metadata_json = Column(JSONB, default=dict, nullable=False)
    content_hash = Column(String(64), nullable=True)

    source = relationship("Source", back_populates="chunks")
    scheme = relationship("Scheme", back_populates="chunks")


class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True, index=True
    )
    scheme_id = Column(
        UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status = Column(
        String(50), nullable=False
    )  # ELIGIBLE | PARTIALLY_ELIGIBLE | NOT_ELIGIBLE | UNDETERMINED
    rules_version = Column(Integer, default=1, nullable=False)
    engine_trace = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="eligibility_results")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(String(100), index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    event = Column(String(100), nullable=False)
    node = Column(String(100), nullable=True)
    payload_redacted = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
