"""Add users, tracking, subscriptions, organizations, seats, payments, and audit logs.

Revision ID: 9f4e2a1b8c7d
Revises: cbda85acc81f
Create Date: 2026-10-14 13:00:00.000000
"""
import sqlalchemy as sa
from alembic import op

revision = "9f4e2a1b8c7d"
down_revision = "cbda85acc81f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="CITIZEN"),
        sa.Column("successful_analyses_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("free_analyses_limit", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "pricing_configs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("individual_price_paise", sa.Integer(), nullable=False),
        sa.Column("org_discount_percent", sa.Integer(), nullable=False, server_default="25"),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("changed_by_admin", sa.String(length=128), nullable=False),
        sa.Column("change_note", sa.Text(), nullable=True),
    )

    op.create_table(
        "organizations",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("admin_user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("purchased_seats", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("subscription_status", sa.String(length=32), nullable=False, server_default="INACTIVE"),
        sa.Column("locked_unit_price_paise", sa.Integer(), nullable=False, server_default="1900"),
        sa.Column("locked_discount_percent", sa.Integer(), nullable=False, server_default="25"),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "organization_seats",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("org_id", sa.String(length=64), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("member_email", sa.String(length=255), nullable=False),
        sa.Column("member_user_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),  # INVITED | ASSIGNED | REVOKED
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("org_id", sa.String(length=64), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("plan_type", sa.String(length=32), nullable=False),  # INDIVIDUAL | ORGANIZATION
        sa.Column("status", sa.String(length=32), nullable=False),  # ACTIVE | CANCELLED | PAST_DUE
        sa.Column("locked_price_paise", sa.Integer(), nullable=False),
        sa.Column("pending_price_change_paise", sa.Integer(), nullable=True),
        sa.Column("price_change_consent_granted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "payment_orders",
        sa.Column("order_id", sa.String(length=128), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("org_id", sa.String(length=64), nullable=True),
        sa.Column("plan_type", sa.String(length=32), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("unit_price_paise", sa.Integer(), nullable=False),
        sa.Column("original_total_paise", sa.Integer(), nullable=False),
        sa.Column("discount_paise", sa.Integer(), nullable=False),
        sa.Column("final_amount_paise", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),  # CREATED | PAID | FAILED | REFUNDED
        sa.Column("provider_payment_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "tracked_schemes",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scheme_slug", sa.String(length=120), nullable=False),
        sa.Column("user_application_status", sa.String(length=32), nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_visited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("visit_count", sa.Integer(), nullable=False, server_default="1"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("actor_user_id", sa.String(length=64), nullable=False),
        sa.Column("org_id", sa.String(length=64), nullable=True),
        sa.Column("action", sa.String(length=128), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("tracked_schemes")
    op.drop_table("payment_orders")
    op.drop_table("subscriptions")
    op.drop_table("organization_seats")
    op.drop_table("organizations")
    op.drop_table("pricing_configs")
    op.drop_table("users")
