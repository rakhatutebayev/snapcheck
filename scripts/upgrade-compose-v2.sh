#!/usr/bin/env bash
set -Eeuo pipefail

# Install Docker Compose v2 CLI plugin (recommended) on Linux x86_64
# Leaves docker-compose v1 installed if present (optional to remove).

if ! command -v docker &>/dev/null; then
  echo "Docker is required. Install Docker first." >&2
  exit 1
fi

sudo mkdir -p /usr/local/lib/docker/cli-plugins
VER="v2.29.7"
URL="https://github.com/docker/compose/releases/download/${VER}/docker-compose-linux-x86_64"
echo "Downloading docker compose ${VER} ..."
sudo curl -fsSL "$URL" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "Installed: $(docker compose version || true)"

echo "Optionally remove legacy docker-compose v1:"
echo "  sudo apt-get remove -y docker-compose"
