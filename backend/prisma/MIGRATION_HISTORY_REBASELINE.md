# Production migration history rebaseline

Date: 2026-10-04

Production migration metadata was rebaselined after a read-only schema audit and a verified logical-backup restore rehearsal. The production application schema was unchanged except for the intended nullable `ChatConversation.context` JSONB column.

## Active migration tree

The active tree mirrors production after rebaseline:

1. `0_rebaseline_current_production`
2. `20261004123000_add_chat_conversation_context`

The context migration is additive and nullable.

## Preserved legacy history

The previous local migration directories are preserved byte-for-byte under:

`backend/prisma/migrations_legacy_pre_rebaseline/`

They are historical only and must not be used as the active migration chain.

Three remote migration source files were unrecoverable during the audit; their production effects are represented by the rebaseline baseline migration.

## Audit and recovery notes

- Banner Campaign parity was restored and verified.
- Customer parity was restored and verified.
- A logical PostgreSQL backup was created and restored successfully into disposable PostgreSQL.
- Application row counts and foreign-key integrity matched the pre-migration snapshot.
- Production migration metadata was archived in `public."_prisma_migrations_legacy_20261004"` with 10 preserved rows.
- Native Supabase scheduled backup/PITR was not independently verified; the approved recovery path was the verified logical restore.

Do not place credentials, connection strings, tokens, or API keys in migration documentation.
