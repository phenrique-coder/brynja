-- DropIndex
DROP INDEX "probe_audit_logs_created_at_idx";

-- DropIndex
DROP INDEX "scans_created_at_idx";

-- DropIndex
DROP INDEX "target_authorizations_origin_key";

-- AlterTable
ALTER TABLE "probe_audit_logs" ADD COLUMN     "owner_github_user_id" TEXT;

-- AlterTable
ALTER TABLE "scans" ADD COLUMN     "owner_github_user_id" TEXT NOT NULL DEFAULT 'legacy-unassigned',
ADD COLUMN     "owner_login" TEXT;

-- AlterTable
ALTER TABLE "target_authorizations" ADD COLUMN     "owner_github_user_id" TEXT NOT NULL DEFAULT 'legacy-unassigned';

-- DropTable
DROP TABLE "github_connections";

-- CreateIndex
CREATE INDEX "probe_audit_logs_owner_github_user_id_created_at_idx" ON "probe_audit_logs"("owner_github_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "scans_owner_github_user_id_created_at_idx" ON "scans"("owner_github_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "target_authorizations_owner_github_user_id_idx" ON "target_authorizations"("owner_github_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "target_authorizations_owner_github_user_id_origin_key" ON "target_authorizations"("owner_github_user_id", "origin");
