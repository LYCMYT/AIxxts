#!/usr/bin/env bash
set -u

job="${1:-}"
project_path="${2:-}"

if [[ -z "$job" || "$job" != "collect" && "$job" != "daily" ]]; then
  echo "Usage: bash scripts/run-wsl-job.sh <collect|daily> [project_path]" >&2
  exit 64
fi

if [[ -z "$project_path" ]]; then
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  project_path="$(cd "$script_dir/.." && pwd)"
fi

if [[ ! -f "$project_path/package.json" ]]; then
  echo "Project path must point to the AIxxts repository root: $project_path" >&2
  exit 66
fi

if [[ "$job" == "collect" ]]; then
  package_script="job:collect"
  log_name="collect.log"
else
  package_script="job:daily"
  log_name="daily.log"
fi

output_path="$project_path/output"
log_path="$output_path/$log_name"

mkdir -p "$output_path"

{
  printf '[%s] START %s\n' "$(date -Is)" "$package_script"
} >> "$log_path"

cd "$project_path" || exit 66

if pnpm "$package_script" >> "$log_path" 2>&1; then
  exit_code=0
else
  exit_code=$?
fi

{
  printf '[%s] END %s exit=%s\n' "$(date -Is)" "$package_script" "$exit_code"
} >> "$log_path"

exit "$exit_code"
