#!/bin/bash

# Update all .env files
for dir in /docker/OruClass /docker/orufy /docker/Oru /docker/easyio-technologies /docker/school-management; do
  if [ -f "$dir/.env" ]; then
    echo "Updating $dir/.env"
    echo "" >> "$dir/.env"
    echo "API_RATE_MAX=3000" >> "$dir/.env"
  fi
done

# Restart all projects cleanly to recreate their bridge networks with the new MTU and new ENV vars
for dir in /docker/OruClass /docker/orufy /docker/Oru /docker/easyio-technologies /docker/school-management; do
  if [ -d "$dir" ]; then
    echo "Restarting project $dir"
    cd "$dir"
    if [ -f "docker-compose.prod.yml" ]; then
      sudo docker compose -f docker-compose.prod.yml down
      sudo docker compose -f docker-compose.prod.yml up -d
    elif [ -f "docker-compose.yml" ]; then
      sudo docker compose down
      sudo docker compose up -d
    fi
  fi
done

echo "Done"
