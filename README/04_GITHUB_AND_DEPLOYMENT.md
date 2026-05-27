# GitHub & Deployment Guide — K Star Fintech

---

## Pushing to GitHub

```bash
cd kstar_final
git init
git add .
git commit -m "feat: initial K Star Fintech microservices project"
```

Create a repo at https://github.com/new — name it `kstar-fintech`, keep it private (it's a fintech project), and don't let GitHub add a README since one already exists.

```bash
git remote add origin https://github.com/FlashDemonoid/kstar-fintech.git
git branch -M main
git push -u origin main
```

After push, your repo will have:
```
kstar-fintech/
├── backend/     ← all Spring Boot services
├── FrontEnd/    ← React app
├── docs/        ← PDF guides
├── scripts/     ← start/stop/reset helpers
├── README/      ← detailed markdown guides
├── .gitignore
└── README.md
```

## Running from a clone

```bash
git clone https://github.com/YOUR_USERNAME/kstar-fintech.git
cd kstar-fintech
chmod +x scripts/start.sh
./scripts/start.sh docker
```

---

## Do you need AWS/Azure?

For running locally or demoing on a call — no. For a live public URL or 24/7 uptime — yes.

| Scenario | Cloud needed? |
|----------|---------------|
| Run on your laptop | No |
| Team member clones and runs it | No |
| Live URL (e.g. kstar.com) | Yes |
| Always-on without your laptop running | Yes |
| Real users, production traffic | Yes |

---

## Option A — AWS (Production)

### Architecture
```
Internet
    │
[Route 53] → DNS
    │
[Application Load Balancer] → HTTPS
    │
    ├── [ECS/EC2] → gateway-service  :8080
    ├── [ECS/EC2] → user-service      :8081
    ├── [ECS/EC2] → exchange-service  :8082
    ├── [ECS/EC2] → transfer-service  :8083
    ├── [ECS/EC2] → bullion-service   :8084
    ├── [ECS/EC2] → nacha-service     :8085
    │
    ├── [RDS MySQL 8.0]
    ├── [DocumentDB / MongoDB Atlas]
    └── [Amazon MSK (Kafka)]

[S3 + CloudFront] → React frontend
```

### Deploy with ECS + Fargate

```bash
# Configure AWS CLI
aws configure

# Create ECR repo and push each service image
aws ecr create-repository --repository-name kstar/gateway-service
docker build -t kstar/gateway-service ./backend/gateway-service
docker tag kstar/gateway-service:latest <ECR_URI>:latest
docker push <ECR_URI>:latest
# Repeat for each service

# Deploy frontend
cd FrontEnd && npm run build
aws s3 sync build/ s3://your-kstar-bucket --acl public-read
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Environment variables (ECS Task Definitions)

```bash
# gateway-service
JWT_SECRET=your-production-secret-min-32-chars
SPRING_PROFILES_ACTIVE=docker

# user-service
SPRING_DATASOURCE_URL=jdbc:mysql://your-rds-endpoint:3306/kstar
SPRING_DATASOURCE_USERNAME=admin
SPRING_DATASOURCE_PASSWORD=your-secure-password
SPRING_KAFKA_BOOTSTRAP_SERVERS=your-msk-endpoint:9092

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## Option B — Azure

### Architecture
```
[Azure DNS]
    │
[Azure Application Gateway] → Load balancer + WAF
    │
[Azure Container Apps / AKS]
    │
    ├── [Azure Database for MySQL]
    ├── [Azure Cosmos DB (MongoDB API)]
    └── [Azure Event Hubs (Kafka API)]

[Azure Static Web Apps] → React frontend
```

### Deploy with Azure Container Apps

```bash
az login
az group create --name kstar-rg --location eastus

# Container registry
az acr create --resource-group kstar-rg --name kstarregistry --sku Basic
az acr login --name kstarregistry

# Push an image
docker build -t kstarregistry.azurecr.io/gateway-service ./backend/gateway-service
docker push kstarregistry.azurecr.io/gateway-service

# Create Container Apps environment
az containerapp env create --name kstar-env --resource-group kstar-rg --location eastus

# Deploy a service
az containerapp create \
  --name gateway-service \
  --resource-group kstar-rg \
  --environment kstar-env \
  --image kstarregistry.azurecr.io/gateway-service \
  --target-port 8080 \
  --ingress external

# Deploy frontend
az staticwebapp create --name kstar-frontend --resource-group kstar-rg \
  --source ./FrontEnd --branch main --app-location "/" --output-location "build"
```

---

## Cost estimates

### AWS (minimum production)

| Service | Monthly |
|---------|---------|
| ECS Fargate (6 services, small) | ~$40–80 |
| RDS MySQL (db.t3.micro) | ~$15 |
| MongoDB Atlas / DocumentDB | ~$10–50 |
| Amazon MSK (smallest Kafka) | ~$150 |
| CloudFront + S3 | ~$2 |
| **Total** | **~$217–297** |

Cheaper alternative: one EC2 t3.medium (~$30/mo) with Docker Compose instead of managed services.

### Azure

| Service | Monthly |
|---------|---------|
| Container Apps (6 services) | ~$30–60 |
| Azure Database for MySQL | ~$25 |
| Cosmos DB | ~$25 |
| Event Hubs (Kafka) | ~$10 |
| Static Web Apps | Free |
| **Total** | **~$90–120** |

---

## Free options (for portfolio / demos)

| Platform | What it hosts | Free tier |
|----------|--------------|-----------|
| Railway.app | Backend + MySQL + MongoDB | $5 credit/month |
| Render.com | Backend services | 750 hrs/month |
| Vercel | React frontend | Free |
| MongoDB Atlas | MongoDB | 512MB |
| Upstash | Kafka | 10K messages/day |

Recommended free portfolio stack: Vercel for frontend, Railway for backend services + MySQL, MongoDB Atlas for MongoDB, Upstash for Kafka. Covers everything with no card required.

---

## Security checklist before going live

- [ ] JWT secret changed to 32+ random chars
- [ ] MySQL root password changed
- [ ] `spring.jpa.show-sql=false`
- [ ] HTTPS enabled (Let's Encrypt or ACM)
- [ ] `REACT_APP_API_URL` pointing to HTTPS
- [ ] CORS `allowedOriginPatterns` locked down to your domain
- [ ] Spring Boot Actuator endpoints secured
- [ ] Database backups configured

---

**Kartikeya Shriwas** — Java Developer | Payment Domain
kartikeyashriwas19@gmail.com · https://github.com/FlashDemonoid

© 2026 Kartikeya Shriwas. All Rights Reserved.
