-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('WELL_KNOWN_FILE', 'DNS_TXT', 'LOCAL_DEV_SANDBOX');

-- CreateEnum
CREATE TYPE "AuthorizationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "FindingVerdict" AS ENUM ('CONFIRMED_ACTIVE', 'POTENTIALLY_EXPOSED', 'DEPENDENCY_ONLY');

-- CreateEnum
CREATE TYPE "ProbeOutcome" AS ENUM ('PASSED', 'FINDING', 'SKIPPED', 'ABORTED');

-- CreateTable
CREATE TABLE "target_authorizations" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "challenge_token" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "repository_url" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "target_url" TEXT,
    "authorization_id" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'QUEUED',
    "current_stage" TEXT NOT NULL DEFAULT 'queued',
    "ecosystems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_dependencies" INTEGER NOT NULL DEFAULT 0,
    "critical_count" INTEGER NOT NULL DEFAULT 0,
    "high_count" INTEGER NOT NULL DEFAULT 0,
    "medium_count" INTEGER NOT NULL DEFAULT 0,
    "low_count" INTEGER NOT NULL DEFAULT 0,
    "confirmed_active_count" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependencies" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "purl" TEXT NOT NULL,
    "source_file" TEXT NOT NULL,
    "is_direct" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vulnerability_findings" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "dependency_id" TEXT NOT NULL,
    "advisory_id" TEXT NOT NULL,
    "cve_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "cvss_score" DOUBLE PRECISION,
    "cvss_vector" TEXT,
    "cwe_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "epss_score" DOUBLE PRECISION,
    "epss_percentile" DOUBLE PRECISION,
    "is_known_exploited" BOOLEAN NOT NULL DEFAULT false,
    "fixed_version" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verdict" "FindingVerdict" NOT NULL DEFAULT 'DEPENDENCY_ONLY',
    "source" TEXT NOT NULL,

    CONSTRAINT "vulnerability_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probe_findings" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "probe_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "status" "ProbeOutcome" NOT NULL,
    "target_url" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "matched_package" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "probe_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probe_audit_logs" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT,
    "authorization_id" TEXT,
    "target_url" TEXT NOT NULL,
    "probe_id" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "request_path" TEXT NOT NULL,
    "status_code" INTEGER,
    "duration_ms" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "probe_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vulnerability_cache" (
    "cache_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vulnerability_cache_pkey" PRIMARY KEY ("cache_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "target_authorizations_origin_key" ON "target_authorizations"("origin");

-- CreateIndex
CREATE INDEX "scans_created_at_idx" ON "scans"("created_at" DESC);

-- CreateIndex
CREATE INDEX "dependencies_scan_id_idx" ON "dependencies"("scan_id");

-- CreateIndex
CREATE INDEX "vulnerability_findings_scan_id_idx" ON "vulnerability_findings"("scan_id");

-- CreateIndex
CREATE INDEX "vulnerability_findings_severity_idx" ON "vulnerability_findings"("severity");

-- CreateIndex
CREATE INDEX "probe_findings_scan_id_idx" ON "probe_findings"("scan_id");

-- CreateIndex
CREATE INDEX "probe_audit_logs_scan_id_idx" ON "probe_audit_logs"("scan_id");

-- CreateIndex
CREATE INDEX "probe_audit_logs_created_at_idx" ON "probe_audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_authorization_id_fkey" FOREIGN KEY ("authorization_id") REFERENCES "target_authorizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vulnerability_findings" ADD CONSTRAINT "vulnerability_findings_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vulnerability_findings" ADD CONSTRAINT "vulnerability_findings_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "dependencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probe_findings" ADD CONSTRAINT "probe_findings_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probe_audit_logs" ADD CONSTRAINT "probe_audit_logs_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probe_audit_logs" ADD CONSTRAINT "probe_audit_logs_authorization_id_fkey" FOREIGN KEY ("authorization_id") REFERENCES "target_authorizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
