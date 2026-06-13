#!/usr/bin/env bash
# Daily pg_dump → Cloudflare R2
# Cron (on VPS): 0 2 * * * /docker/OruClass/scripts/backup-db.sh >> /var/log/oruclass-backup.log 2>&1
set -euo pipefail

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"
: "${R2_ENDPOINT:?R2_ENDPOINT not set}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID not set}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY not set}"
: "${R2_BUCKET_NAME:?R2_BUCKET_NAME not set}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
FILENAME="oruclass-backup-${TIMESTAMP}.sql.gz"
TMPFILE="/tmp/${FILENAME}"

echo "[$(date -u)] Starting backup: ${FILENAME}"

# Dump from the running postgres container
docker exec oruclass-postgres-1 \
  pg_dump -U oruclass oruclass | gzip > "${TMPFILE}"

FILESIZE=$(du -sh "${TMPFILE}" | cut -f1)
echo "[$(date -u)] Dump complete: ${FILESIZE}"

# Upload to R2 using AWS CLI (s3-compatible)
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${TMPFILE}" \
  "s3://${R2_BUCKET_NAME}/backups/${FILENAME}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --no-progress

rm -f "${TMPFILE}"
echo "[$(date -u)] Backup uploaded successfully: backups/${FILENAME}"

# Prune backups older than 30 days
CUTOFF=$(date -u -d "30 days ago" +"%Y-%m-%d" 2>/dev/null || date -u -v-30d +"%Y-%m-%d")
echo "[$(date -u)] Pruning backups older than ${CUTOFF}"

AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 ls "s3://${R2_BUCKET_NAME}/backups/" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto | \
awk '{print $4}' | \
grep "^oruclass-backup-" | \
while read -r KEY; do
  FILEDATE=$(echo "${KEY}" | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  if [[ "${FILEDATE}" < "${CUTOFF}" ]]; then
    AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
    AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
    aws s3 rm "s3://${R2_BUCKET_NAME}/backups/${KEY}" \
      --endpoint-url "${R2_ENDPOINT}" \
      --region auto
    echo "[$(date -u)] Deleted old backup: ${KEY}"
  fi
done

echo "[$(date -u)] Done."
