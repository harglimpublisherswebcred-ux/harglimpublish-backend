# VARADHI / INCITE Backend Useful Commands

This file is a practical command runbook for local development, production EC2, Docker Compose, deployment, logs, monitoring, and troubleshooting.

Use commands from the correct location:

- Local Windows project: `C:\Users\user\incite_backend`
- EC2 project path: `/home/ubuntu/apps/incite_backend`
- Production API: `https://api.vaaradhinews.com/`

Never print or commit secrets from `.env`, `run/secrets/firebase.json`, AWS keys, Firebase keys, database passwords, or JWT tokens.

## 1. **Check Current Git Changes**

Where to use:

- Local project folder
- EC2 project folder

```bash
git status
git status --short
```

Why we use:

- Shows changed files.
- Helps confirm no secret files are staged.
- Run before every commit, deploy, or patch.

When to use:

- Before `git add`
- Before `git push`
- Before debugging deployment issues

## 2. **Check Current Branch**

Where to use:

- Local or EC2 project folder

```bash
git branch --show-current
```

Why we use:

- Confirms we are on `main`.
- Auto deploy is configured for pushes to `main`.

When to use:

- Before pushing code
- Before manual `git pull`

## 3. **Check Code Diff**

Where to use:

- Local project folder

```bash
git diff
git diff --stat
git diff --check
```

Why we use:

- `git diff`: shows exact code changes.
- `git diff --stat`: shows changed files summary.
- `git diff --check`: finds whitespace errors.

When to use:

- Before committing
- After patching production fixes

## 4. **Commit And Push Code**

Where to use:

- Local project folder

```bash
git add .
git commit -m "Your clear commit message"
git push origin main
```

Why we use:

- Push to `main` triggers GitHub Actions auto deploy.

Important:

- Do not add `.env`.
- Do not add `run/secrets/firebase.json`.
- Do not add datasets, logs, media, or database dumps.

## 5. **Django System Check**

Where to use:

- Local project folder

```bash
.\venv\Scripts\python.exe manage.py check --settings ci.test_settings
```

Where to use on EC2 Docker:

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml run --rm backend python manage.py check --settings config.settings.prod
```

Why we use:

- Checks Django configuration.
- Finds deployment/security configuration problems.

When to use:

- Before push
- After changing settings
- After deploy failure

## 6. **Check Migrations**

Where to use:

- Local project folder

```bash
.\venv\Scripts\python.exe manage.py makemigrations --check --dry-run --settings ci.test_settings
```

Where to use on EC2:

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml run --rm migrate
```

Why we use:

- Confirms no missing migrations.
- Applies migrations safely in production deploy flow.

When to use:

- Before push
- Before production deploy
- After model changes

## 7. **Run Tests**

Where to use:

- Local project folder

```bash
.\venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```

Run focused tests:

```bash
.\venv\Scripts\python.exe -m pytest apps\core\tests.py -q -p no:cacheprovider
```

Why we use:

- Confirms features did not regress.
- Full suite currently passed with `277 passed`.

When to use:

- Before push
- After backend patch
- Before production release

## 8. **Generate OpenAPI / Swagger Schema**

Where to use:

- Local project folder

```bash
.\venv\Scripts\python.exe manage.py spectacular --file openapi-schema.yml --settings ci.test_settings
```

Why we use:

- Regenerates OpenAPI schema.
- Confirms Swagger docs are valid.

When to use:

- After API changes
- Before giving docs to frontend

## 9. **Validate Docker Compose**

Where to use:

- EC2 project folder or local project folder with Docker running

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml config --quiet
```

Why we use:

- Validates `docker-compose.prod.yml`.
- Finds YAML/env interpolation mistakes before restarting.

When to use:

- Before deploy
- After editing Compose
- When GitHub Actions deploy fails

## 10. **Check Running Containers**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml ps
```

Why we use:

- Shows backend, db, redis, nginx, celery worker, celery beat status.

When to use:

- After deploy
- After restart
- When API is down

## 11. **Start Production Services**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml up -d db redis
docker compose -f docker-compose.prod.yml up -d backend
docker compose -f docker-compose.prod.yml up -d celery_worker celery_beat
docker compose -f docker-compose.prod.yml up -d nginx
```

Why we use:

- Starts services in safe order.
- DB/Redis first, then app, then workers, then public Nginx.

When to use:

- After server reboot
- Manual recovery
- Fresh EC2 setup

## 12. **Restart App Services**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml restart backend celery_worker celery_beat nginx
```

Why we use:

- Restarts app layer without deleting database/Redis volumes.

When to use:

- After `.env` change
- After clearing logs
- After temporary issue

## 13. **Restart Only Celery**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml restart celery_worker celery_beat
```

Why we use:

- Applies Celery env changes.
- Refreshes periodic task execution.

When to use:

- After changing periodic task settings
- After notification worker issue
- After changing Redis/Celery env

## 14. **Production Health Check**

Where to use:

- EC2 or local terminal

```bash
curl -I https://api.vaaradhinews.com/api/v1/health/
curl https://api.vaaradhinews.com/api/v1/health/
```

Expected:

```text
HTTP/1.1 200 OK
{"data":{"status":"ok","checks":{"database":"ok","cache":"ok"}}}
```

Why we use:

- Confirms Nginx, Django, DB, and Redis are working.

When to use:

- After deploy
- After restart
- When frontend says backend is down

## 15. **HTTP To HTTPS Redirect Check**

Where to use:

- EC2 or local terminal

```bash
curl -I http://api.vaaradhinews.com/api/v1/health/
```

Expected:

```text
301 Moved Permanently
Location: https://api.vaaradhinews.com/api/v1/health/
```

Why we use:

- Confirms HTTP redirects to HTTPS.

When to use:

- After Nginx/certificate changes
- After domain setup

## 16. **Check Admin Static Files**

Where to use:

- EC2 or local terminal

```bash
curl -I https://api.vaaradhinews.com/static/admin/css/base.css
```

Expected:

```text
HTTP/1.1 200 OK
Content-Type: text/css
```

Why we use:

- Confirms admin CSS/static files are served.

When to use:

- Swagger blank screen
- Admin page has no styling
- After collectstatic failure

## 17. **Run Collectstatic**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml run --rm collectstatic
```

Why we use:

- Copies Django/static assets into `staticfiles`.
- Required for admin and Swagger UI assets.

When to use:

- After deployment
- After static files missing
- After changing frontend/admin static assets

## 18. **Fix Old Static Permission Issue**

Where to use:

- EC2 only, only if collectstatic fails with `PermissionError`

```bash
cd /home/ubuntu/apps/incite_backend
sudo chown -R ubuntu:ubuntu staticfiles
sudo chmod -R u+rwX staticfiles
docker compose -f docker-compose.prod.yml run --rm collectstatic
```

Why we use:

- Repairs old files created with wrong ownership.

Important:

- Do not use `chmod 777`.
- New Compose runs collectstatic with root one-shot mode, so this should rarely be needed.

## 19. **View Backend Logs**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

Follow live logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Why we use:

- Debug API 500 errors.
- Check request paths/status codes.

When to use:

- API error
- Admin error
- Login/logout error

## 20. **View Celery Logs**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml logs --tail=150 celery_worker
```

Follow live:

```bash
docker compose -f docker-compose.prod.yml logs -f celery_worker
```

Why we use:

- Debug notifications, YouTube jobs, scheduled jobs, analytics, cleanup.

When to use:

- Notification failed
- YouTube 429
- Periodic task not running

## 21. **View Nginx Logs**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml logs --tail=100 nginx
```

Why we use:

- Debug 404/502/SSL/static issues.

When to use:

- Browser cannot open site
- Nginx restart loop
- Static files not served

## 22. **Check YouTube Quota Logs**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml logs -f celery_worker | grep -i "youtube"
```

Why we use:

- Shows `youtube_api_429`, cooldown, global suspend, skipped calls.

When to use:

- YouTube videos/live not updating
- Quota usage is high
- After disabling duplicate YouTube tasks

## 23. **Check Notification Logs**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml logs --tail=200 celery_worker | grep -i "notification"
```

Why we use:

- Confirms scheduled/admin notifications dispatch.
- Shows Firebase failures.

When to use:

- Admin notification says failed
- FCM token cleanup issue
- Celery notification task issue

## 24. **Check Redis**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml exec redis redis-cli -a "$REDIS_PASSWORD" ping
```

Expected:

```text
PONG
```

Memory:

```bash
docker compose -f docker-compose.prod.yml exec redis redis-cli -a "$REDIS_PASSWORD" info memory
```

Why we use:

- Confirms cache and Celery broker are alive.

When to use:

- Health endpoint cache fails
- Celery not processing
- Redis container restart

## 25. **Check PostgreSQL**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml exec db pg_isready -U "$DB_USER" -d "$DB_NAME"
```

Check active DB connections:

```bash
docker compose -f docker-compose.prod.yml exec db psql -U "$DB_USER" -d "$DB_NAME" -c "select count(*) from pg_stat_activity;"
```

Why we use:

- Confirms database is healthy.
- Detects connection exhaustion.

When to use:

- Health check fails database.
- API slow.
- Deployment migration issue.

## 26. **Open Django Shell In Docker**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml exec backend python manage.py shell
```

Why we use:

- Inspect database rows.
- Run safe admin/debug queries.

When to use:

- Debug category/user/article data.
- Inspect periodic tasks.

Important:

- Do not delete production data unless you are 100% sure and have approval.

## 27. **Check Periodic Tasks In Shell**

Where to use:

- EC2 Django shell

```python
from django_celery_beat.models import PeriodicTask

for task in PeriodicTask.objects.order_by("name"):
    print(task.name, task.enabled, task.task, task.crontab_id, task.interval_id)
```

Why we use:

- Finds duplicate/manual periodic tasks.
- Confirms enabled/disabled state.

When to use:

- YouTube quota high.
- Duplicate tasks visible in admin.
- Celery running too many jobs.

## 28. **Disable Duplicate Periodic Tasks**

Where to use:

- EC2 Django shell or Django admin

```python
from django_celery_beat.models import PeriodicTask

names = [
    "notifications",
    "generate_tts_task",
    "fetch_youtube_shorts",
    "fetch_trending_videos",
    "latest_news_videos",
    "fetch_live_news",
    "refresh_trending",
    "retention-cleanup",
]

PeriodicTask.objects.filter(name__in=names).update(enabled=False)
```

Why we use:

- Stops duplicate/old DB-backed scheduled jobs.
- Reduces YouTube quota usage and background load.

When to use:

- Admin periodic task list shows duplicates.
- Logs show repeated YouTube `429`.

## 29. **Check Server Memory**

Where to use:

- EC2

```bash
free -h
```

Why we use:

- Checks RAM and swap.

Healthy for current t3.small:

```text
Available RAM above 500 MiB: OK
Swap under 500 MiB: OK
```

When to use:

- API slow
- Deploy slow
- Containers restarting

## 30. **Check Disk Space**

Where to use:

- EC2

```bash
df -h
```

Why we use:

- Checks disk capacity.

Healthy:

```text
Disk under 75% used: OK
Disk above 85% used: risky
```

When to use:

- Docker pull fails
- Database errors
- Logs growing

## 31. **Check Container CPU/RAM**

Where to use:

- EC2

```bash
docker stats --no-stream
```

Why we use:

- Shows per-container memory and CPU.

When to use:

- High memory
- Slow API
- Celery consuming too much RAM

## 32. **Clear Docker Logs**

Where to use:

- EC2

Find logs:

```bash
sudo find /var/lib/docker/containers -name "*-json.log" -type f -print
```

Clear logs:

```bash
sudo find /var/lib/docker/containers -name "*-json.log" -type f -exec truncate -s 0 {} \;
```

Why we use:

- Frees disk space.
- Starts fresh log view.

When to use:

- Logs are huge.
- You want clean debugging.

Important:

- This does not delete containers or data.

## 33. **Clear Project Log Files**

Where to use:

- EC2 project folder

```bash
cd /home/ubuntu/apps/incite_backend
find . -maxdepth 3 -type f -name "*.log" -print
find . -maxdepth 3 -type f -name "*.log" -exec truncate -s 0 {} \;
```

Why we use:

- Clears old app/debug log files.

When to use:

- Debugging from fresh logs.
- Disk usage increasing.

## 34. **Docker Disk Cleanup**

Where to use:

- EC2

```bash
docker image prune -f
docker builder prune -f
```

Why we use:

- Removes unused Docker images/build cache.

When to use:

- Disk above 70%.
- Many deployments completed.

Avoid unless approved:

```bash
docker system prune -a
```

It can remove more than expected.

## 35. **Check Current Deployed Image**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
cat .deploy_state
grep -n "^BACKEND_IMAGE=" .env
docker compose -f docker-compose.prod.yml config | grep "image:"
```

Why we use:

- Confirms which ECR image is deployed.
- Helps debug when GitHub Actions says deployed but server still uses old image.

When to use:

- After auto deploy
- Before rollback
- When code change does not appear live

## 36. **Manual Deploy Latest Image From State**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
source .deploy_state
sed -i "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=${BACKEND_IMAGE}|" .env
docker compose -f docker-compose.prod.yml up -d backend celery_worker celery_beat
curl -I https://api.vaaradhinews.com/api/v1/health/
```

Why we use:

- Forces `.env` to use the latest image stored by deploy script.

When to use:

- GitHub deploy completed but Compose still shows `varadhi/backend:latest`.

## 37. **Rollback To Previous Image**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
source .deploy_state
export BACKEND_IMAGE="$PREVIOUS_BACKEND_IMAGE"
docker compose -f docker-compose.prod.yml up -d backend celery_worker celery_beat
curl -I https://api.vaaradhinews.com/api/v1/health/
```

Why we use:

- Rolls app containers back to previous Docker image.

When to use:

- Latest deploy breaks API.
- Health check fails after deploy.

Important:

- Does not rollback database migrations.
- Ask before rollback if schema changed.

## 38. **GitHub Actions Runner Status**

Where to use:

- EC2

```bash
sudo systemctl status actions.runner.Ghani55-dev-incite_backend.varadhi-ec2-runner.service
```

Restart runner:

```bash
sudo systemctl restart actions.runner.Ghani55-dev-incite_backend.varadhi-ec2-runner.service
```

Why we use:

- Confirms self-hosted GitHub runner is online.

When to use:

- GitHub Actions job stuck waiting for runner.
- Auto deploy not starting.

## 39. **AWS ECR Login**

Where to use:

- EC2

```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 382888095930.dkr.ecr.ap-south-1.amazonaws.com
```

Why we use:

- Lets EC2 pull backend image from ECR.

When to use:

- Docker pull unauthorized.
- Deploy cannot pull image.

## 40. **Check Domain DNS**

Where to use:

- EC2 or local terminal

```bash
nslookup api.vaaradhinews.com
```

Expected:

```text
Address: 15.252.96.177
```

Why we use:

- Confirms subdomain points to EC2 public IP.

When to use:

- Domain not opening.
- SSL certificate issue.

## 41. **Check Nginx Config**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml exec nginx nginx -t
docker compose -f docker-compose.prod.yml exec nginx nginx -T | grep -n "server_name" -A20
```

Why we use:

- Validates Nginx syntax.
- Confirms domain/proxy/static config.

When to use:

- Nginx restarting.
- 404 from Nginx.
- SSL/domain issues.

## 42. **Restart Nginx**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml restart nginx
```

Why we use:

- Applies Nginx config changes.

When to use:

- After editing `nginx/incite.conf`.
- After certificate setup.

## 43. **Certbot Create Certificate**

Where to use:

- EC2, only after DNS points to server

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d api.vaaradhinews.com
docker compose -f docker-compose.prod.yml up -d nginx
```

Why we use:

- Creates Let's Encrypt SSL certificate.

When to use:

- First HTTPS setup.
- New domain/subdomain.

## 44. **Certbot Renewal Dry Run**

Where to use:

- EC2

```bash
sudo certbot renew --dry-run
```

Why we use:

- Confirms certificate renewal can work.

When to use:

- After SSL setup.
- Before certificate expiry.

## 45. **Firebase Secret Check**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
ls -lah run/secrets/firebase.json
docker compose -f docker-compose.prod.yml exec backend test -r /run/secrets/firebase.json
docker compose -f docker-compose.prod.yml exec celery_worker test -r /run/secrets/firebase.json
```

Why we use:

- Confirms backend and Celery can read Firebase credentials.

When to use:

- Notifications fail.
- Deploy check says Firebase credentials missing.
- After moving server.

## 46. **Firebase Package Check**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml exec celery_worker python -c "import firebase_admin; print(firebase_admin.__version__)"
```

Why we use:

- Confirms Firebase Admin SDK is installed in Celery container.

When to use:

- FCM send task fails.

## 47. **Swagger / API Docs Security Check**

Where to use:

- EC2 or local terminal

```bash
curl -I https://api.vaaradhinews.com/api/docs/
curl -I https://api.vaaradhinews.com/api/schema/
```

Expected in production:

```text
302 Found
Location: /admin/login/?next=/api/docs/
```

Why we use:

- Confirms API docs are staff-only unless `API_DOCS_PUBLIC=True`.

When to use:

- After deploy.
- Before public launch.

## 48. **Check CORS / CSRF Env**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
grep -E "^(ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS|CORS_ALLOW_ALL_ORIGINS|CSRF_TRUSTED_ORIGINS|API_DOCS_PUBLIC)=" .env
```

Why we use:

- Confirms frontend/admin domains are allowed.
- Confirms wildcard CORS is disabled.

When to use:

- Frontend gets CORS error.
- Admin gets CSRF 403.

## 49. **Check EC2 Security Group Access**

Where to use:

- AWS console

Required inbound rules:

```text
SSH 22     Your IP only, example 106.192.3.57/32
HTTP 80    0.0.0.0/0
HTTPS 443  0.0.0.0/0
```

Why we use:

- Allows browser/API access.
- Keeps SSH safer.

When to use:

- SSH timeout.
- Domain not opening.

## 50. **SSH To EC2**

Where to use:

- Local terminal

```bash
ssh -i "vaaradhi.pem" ubuntu@ec2-15-252-96-177.ap-south-1.compute.amazonaws.com
```

Why we use:

- Connects to server.

When to use:

- Manual deploy/debug.
- Logs/checks.

If timeout:

- Check EC2 instance is running.
- Check security group allows port 22 from your current IP.
- Check public IP has not changed.

## 51. **Backup PostgreSQL**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "backups/incite_$(date +%Y%m%d_%H%M%S).sql"
ls -lah backups | tail
```

Why we use:

- Creates logical database backup.

When to use:

- Before risky deploy.
- Before data cleanup.
- Before production launch.

Important:

- Copy backups off EC2 to S3 or another safe place.

## 52. **Restore Backup To Staging Only**

Where to use:

- Staging or temporary database, not production

```bash
psql "$STAGING_DATABASE_URL" < backups/incite_YYYYMMDD_HHMMSS.sql
```

Why we use:

- Proves backups can actually restore.

When to use:

- Backup verification.
- Disaster recovery drill.

Do not restore over production without approval.

## 53. **Inspect Category Soft Deleted Rows**

Where to use:

- Django shell

```python
from apps.categories.models import Category

print("Visible categories:", Category.objects.count())
print("All categories including deleted:", Category.all_objects.count())

for c in Category.all_objects.filter(deleted_at__isnull=False):
    print(c.id, c.name, c.slug, c.deleted_at, c.is_active)
```

Why we use:

- Finds soft-deleted categories blocking duplicate slug creation.

When to use:

- Admin says category already exists but you cannot see it.

## 54. **Inspect Articles Using Category**

Where to use:

- Django shell

```python
from apps.categories.models import Category
from apps.articles.models import Article

cat = Category.all_objects.get(slug="technology")
for article in Article.all_objects.filter(category=cat):
    print(article.id, article.title, article.status, article.deleted_at)
```

Why we use:

- Finds hidden/soft-deleted articles protecting category deletion.

When to use:

- Admin cannot delete category because protected articles exist.

## 55. **Check Location Pagination Performance**

Where to use:

- EC2 or local terminal

```bash
curl -sS -o /dev/null -w "villages %{http_code} %{time_total} %{size_download}\n" "https://api.vaaradhinews.com/api/v1/locations/villages/?page_size=20"
```

Why we use:

- Confirms villages API is paginated and not returning huge 20 MB response.

When to use:

- After location API changes.
- Frontend reports slow location dropdown.

## 56. **Check API Smoke Endpoints**

Where to use:

- EC2 or local terminal

```bash
curl -sS -o /dev/null -w "health %{http_code} %{time_total}\n" https://api.vaaradhinews.com/api/v1/health/
curl -sS -o /dev/null -w "feed %{http_code} %{time_total}\n" https://api.vaaradhinews.com/api/v1/feed/
curl -sS -o /dev/null -w "search %{http_code} %{time_total}\n" "https://api.vaaradhinews.com/api/v1/search/?q=test&page_size=10"
curl -sS -o /dev/null -w "categories %{http_code} %{time_total}\n" https://api.vaaradhinews.com/api/v1/categories/
curl -sS -o /dev/null -w "videos %{http_code} %{time_total}\n" https://api.vaaradhinews.com/api/v1/articles/video-feed/
curl -sS -o /dev/null -w "shorts %{http_code} %{time_total}\n" https://api.vaaradhinews.com/api/v1/articles/shorts-feed/
curl -sS -o /dev/null -w "live %{http_code} %{time_total}\n" https://api.vaaradhinews.com/api/v1/articles/live/
```

Why we use:

- Quick production API health check.

When to use:

- After deploy.
- Before demo.
- When frontend reports backend issue.

## 57. **Reduce Celery Worker Memory**

Where to use:

- EC2 `.env`

Set:

```env
CELERY_WORKER_CONCURRENCY=2
```

Restart:

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml up -d celery_worker
```

Why we use:

- t3.small has 2 GB RAM.
- Reduces Celery memory pressure.

When to use:

- Available RAM below 300 MB.
- Swap usage increasing.
- Celery worker above 700 MB.

## 58. **Recommended Periodic Task Setup**

Keep enabled:

```text
fetch-live-news
refresh-trending
rebuild-interest-profiles-nightly
refresh-live-trends
aggregate-analytics-events-hourly
refresh-trending-videos
send-scheduled-notifications
anonymize-search-logs
decay-user-preferences
compute-daily-stats
sync-view-counts
flush-expired-tokens
publish-scheduled-articles
ugc-expired-otp-cleanup-hourly
tts-metrics-aggregate-daily
tts-cleanup-daily
celery.backend_cleanup
```

Keep disabled:

```text
retention-cleanup
notifications
generate_tts_task
fetch_youtube_shorts
fetch_trending_videos
latest_news_videos
```

Reduce YouTube schedule:

```text
fetch-live-news: every 10 minutes
refresh-trending-videos: every 2 hours
```

Why we use:
o
- Reduces YuTube quota usage.
- Prevents duplicate background work.
- Keeps core app jobs running.

## 59. **Emergency Health Recovery**

Where to use:

- EC2

```bash
cd /home/ubuntu/apps/incite_backend
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
docker compose -f docker-compose.prod.yml logs --tail=100 nginx
docker compose -f docker-compose.prod.yml restart backend nginx
curl -I https://api.vaaradhinews.com/api/v1/health/
```

Why we use:

- Quick recovery if API is temporarily down.

When to use:

- Health endpoint not responding.
- Admin/API gives 502/500.

## 60. **Final Production Verification**

Where to use:

- EC2 after every deploy

```bash
cd /home/ubuntu/apps/incite_backend
cat .deploy_state
docker compose -f docker-compose.prod.yml ps
curl -I https://api.vaaradhinews.com/api/v1/health/
curl -I https://api.vaaradhinews.com/static/admin/css/base.css
curl -I https://api.vaaradhinews.com/api/docs/
free -h
df -h
docker stats --no-stream
```

Expected:

```text
health: 200 OK
static: 200 OK
docs: 302 to admin login
containers: backend/db/redis/nginx/celery healthy/running
disk: under 75%
available RAM: above 500 MiB preferred
```

Why we use:

- Confirms production is ready after deploy.

When to use:

- Every production deploy.
- Before client demo.
- Before app release.




