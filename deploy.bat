git push origin main
ssh oru "cd /docker/OruClass && git reset --hard && git clean -fd && git pull origin main && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d --build"
