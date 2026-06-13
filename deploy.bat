ssh oru "cd /docker/OruClass && git pull origin main && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d --build"
