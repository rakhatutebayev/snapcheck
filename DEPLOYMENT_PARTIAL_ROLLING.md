# Частичные и безопасные деплои (rolling)

Этот документ описывает, как обновлять только изменившиеся сервисы (backend / frontend) и минимизировать простой при выкладке в продакшн.

## Почему «ломается» после каждой заливки

Частые причины:

- Старый docker-compose v1 (1.29.x) на новой версии Docker Engine — баг `KeyError: 'ContainerConfig'` при пересоздании контейнеров.
- Неполный `.env` (например, отсутствует `FRONTEND_URL`) — backend падает на старте.
- Жёстко заданные `container_name` мешают запускать новый контейнер параллельно со старым (невозможен start-first/scale без конфликта имён).
- Миграции БД выполняются в «горячую» без health‑гейтов — кратковременно падает API.
- Несоответствие сетей/лейблов Traefik или конкуренция со старыми сервисами.

## Что сделано

В репозитории добавлен скрипт `./deploy-rolling.sh`, который:

- Валидирует `.env` и наличие `DOMAIN` и `FRONTEND_URL`.
- Строит и обновляет только изменившиеся сервисы:
  - Автоопределение изменений через `git diff` c прошлого деплоя.
  - Если не удаётся определить — по умолчанию обновляет оба.
- Обновляет сервисы по одному с ожиданием здоровья контейнера.
- Не трогает БД; пытается запустить миграции аккуратно, если `alembic` доступен.
- Пишет последний задеплоенный коммит в `.last_deploy_sha`.

## Как пользоваться

На сервере:

```bash
cd /opt/snapcheck
# Обновите репозиторий до нужного коммита (или main)
# git fetch origin && git reset --hard origin/main

# Авто-режим: определить изменения и задеплоить только их
./deploy-rolling.sh

# Принудительно только backend
./deploy-rolling.sh --backend

# Принудительно только frontend
./deploy-rolling.sh --frontend

# Принудительно оба
./deploy-rolling.sh --both
```

Скрипт сам подождёт `healthy` у контейнеров и проверит доступность через Traefik:
- https://DOMAIN/
- https://DOMAIN/api/health

## Рекомендации для нулевого простоя

- Обновить до docker compose v2 (рекомендуется):
  - На Ubuntu/Debian:
    ```bash
    sudo apt-get remove -y docker-compose || true
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -SL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    docker compose version
    ```
- Убрать `container_name` в compose, чтобы можно было использовать `--scale` и запускать новый контейнер до остановки старого.
- Рассмотреть blue/green для backend: два сервиса (blue/green) и переключение Traefik лейблами.
- Держать миграции быстрыми и обратносовместимыми (вначале добавить поля — потом начать ими пользоваться).

## Часто задаваемые вопросы

- «Можно ли деплоить только изменения?» — Да: используйте `deploy-rolling.sh` (автоопределение по git) или флаги `--backend/--frontend`.
- «Почему иногда падает при деплое?» — Чаще всего из-за compose v1 бага и отсутствия `FRONTEND_URL` в `.env`. В `deploy-rolling.sh` это проверяется и деплой происходит по одному сервису с ожиданием health.
- «Нужен ли Traefik рестарт?» — Нет. Мы обновляем контейнеры приложений, Traefik сам переподхватит новые конечные точки по docker‑провайдеру.
