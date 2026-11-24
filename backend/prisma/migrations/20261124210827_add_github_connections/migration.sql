-- CreateTable
CREATE TABLE "github_connections" (
    "id" TEXT NOT NULL,
    "github_user_id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "avatar_url" TEXT,
    "encrypted_token" TEXT NOT NULL,
    "token_iv" TEXT NOT NULL,
    "token_auth_tag" TEXT NOT NULL,
    "session_hash" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_connections_session_hash_key" ON "github_connections"("session_hash");

-- CreateIndex
CREATE INDEX "github_connections_github_user_id_idx" ON "github_connections"("github_user_id");
