# BusKaro Production Deployment Guide

Complete deployment guide for the BusKaro real-time transport system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  Mobile App (Expo)  │  Admin Web (React)  │  Driver App (Expo)  │
└──────────┬──────────┴──────────┬──────────┴──────────┬──────────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │ HTTPS/WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER (Nginx)                        │
│   - SSL/TLS termination                                         │
│   - Rate limiting                                               │
│   - WebSocket support                                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Backend   │         │   Backend   │         │   Backend   │
│   (Node.js) │         │   (Node.js) │         │   (Node.js) │
│   Pod 1     │         │   Pod 2     │         │   Pod 3     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ PostgreSQL  │         │    Redis    │         │  Web Admin  │
│ (PostGIS)   │         │  (Socket.IO │         │   (React)   │
│   20GB SSD  │         │   Adapter)  │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

## Prerequisites

### Cloud Provider Setup (AWS Example)

1. **Create AWS Account** with proper IAM roles
2. **EKS Cluster**: Create managed Kubernetes cluster
3. **RDS PostgreSQL**: Managed database with PostGIS extension
4. **ElastiCache Redis**: Managed Redis cluster
5. **ECR**: Container registry for Docker images
6. **Route 53**: DNS management
7. **S3**: For backups and static assets
8. **CloudFront**: CDN for admin web app

### Required Tools

```bash
# Install CLI tools
brew install awscli kubectl helm

# Configure AWS
aws configure

# Update kubeconfig for EKS
aws eks update-kubeconfig --region us-east-1 --name buskaro-production
```

## Environment Configuration

### 1. Create Environment Files

```bash
# Copy example files
cp .env.example .env.production
```

### 2. Configure Secrets

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate other secrets
DB_PASSWORD=$(openssl rand -base64 24)
RAZORPAY_KEY_ID="your_razorpay_key"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
GOOGLE_MAPS_API_KEY="your_google_maps_key"
```

### 3. Create Kubernetes Secrets

```bash
# Encode secrets to base64
echo -n "$JWT_SECRET" | base64
echo -n "$DB_PASSWORD" | base64

# Apply secrets
kubectl apply -f k8s/production/secrets.yaml
```

## Deployment Steps

### Step 1: Local Development

```bash
# Start local stack
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed
```

### Step 2: Build & Push Images

```bash
# Login to container registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build images
docker build -f docker/backend.Dockerfile -t ghcr.io/bharatbushan03/buskaro-backend:latest .
docker build -f docker/web.Dockerfile -t ghcr.io/bharatbushan03/buskaro-web:latest .

# Push images
docker push ghcr.io/bharatbushan03/buskaro-backend:latest
docker push ghcr.io/bharatbushan03/buskaro-web:latest
```

### Step 3: Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/production/namespace.yaml

# Apply configs
kubectl apply -f k8s/production/configmap.yaml
kubectl apply -f k8s/production/secrets.yaml

# Deploy databases
kubectl apply -f k8s/production/postgres.yaml
kubectl apply -f k8s/production/redis.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=60s

# Deploy applications
kubectl apply -f k8s/production/backend.yaml
kubectl apply -f k8s/production/web.yaml

# Apply ingress
kubectl apply -f k8s/production/ingress.yaml
```

### Step 4: Database Migration

```bash
# Run migrations
kubectl exec -it deployment/buskaro-backend -n buskaro -- npx prisma migrate deploy

# Verify migration
kubectl exec -it deployment/buskaro-backend -n buskaro -- npx prisma migrate status
```

### Step 5: Verify Deployment

```bash
# Check pods
kubectl get pods -n buskaro

# Check services
kubectl get svc -n buskaro

# Check ingress
kubectl get ingress -n buskaro

# Test health endpoints
curl https://api.buskaro.com/api/health
curl https://admin.buskaro.com
```

## Scaling

### Horizontal Pod Autoscaler

```bash
# View current status
kubectl get hpa -n buskaro

# Scale manually (if needed)
kubectl scale deployment buskaro-backend --replicas=5 -n buskaro
```

### Database Scaling

For RDS PostgreSQL:
```bash
# Modify instance type
aws rds modify-db-instance \
  --db-instance-identifier buskaro-prod \
  --db-instance-class db.t3.medium \
  --apply-immediately
```

## Monitoring & Alerting

### Access Dashboards

- **Prometheus**: http://localhost:9090 (port-forward)
- **Grafana**: https://grafana.buskaro.com (admin/admin123)

### Setup Alerts

```bash
# Create alert rules
kubectl apply -f monitoring/alert-rules.yaml

# Configure AlertManager
kubectl apply -f monitoring/alertmanager.yaml
```

### Key Metrics to Monitor

1. **API Latency**: p95 < 500ms
2. **Socket Connections**: Active connections
3. **Database CPU**: < 80%
4. **Error Rate**: < 1%
5. **Container Restarts**: Should be 0

## Backup Strategy

### Database Backups

```bash
# Automated RDS snapshots (enabled by default)
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier buskaro-prod \
  --db-snapshot-identifier buskaro-backup-$(date +%Y%m%d)
```

### Application State

```bash
# Backup Redis
kubectl exec -it redis-0 -n buskaro -- redis-cli BGSAVE
```

## Rollback Procedure

```bash
# Rollback deployment
kubectl rollout undo deployment/buskaro-backend -n buskaro

# Check rollout history
kubectl rollout history deployment/buskaro-backend -n buskaro

# Rollback to specific revision
kubectl rollout undo deployment/buskaro-backend --to-revision=2 -n buskaro
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Secrets stored in Kubernetes secrets (not in git)
- [ ] Database passwords rotated
- [ ] JWT secrets are strong (32+ chars)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers applied
- [ ] Container images scanned for vulnerabilities
- [ ] Network policies configured
- [ ] RBAC enabled

## Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n buskaro
kubectl logs <pod-name> -n buskaro
```

### Database Connection Issues
```bash
# Test connection from backend pod
kubectl exec -it deployment/buskaro-backend -n buskaro -- nc -zv postgres 5432
```

### Socket.IO Issues
```bash
# Check Redis adapter
kubectl exec -it deployment/buskaro-backend -n buskaro -- redis-cli ping
```

## Cost Optimization

### Resource Requests/Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

### Reserved Instances
- RDS: 1-year reserved (30% savings)
- ElastiCache: Reserved nodes

### Auto-shutdown (Staging)
```bash
# Scale to zero on weekends
kubectl scale deployment buskaro-backend --replicas=0 -n buskaro
```

## Domain Configuration

### DNS Records
```
A     api.buskaro.com     → Load Balancer IP
A     admin.buskaro.com   → Load Balancer IP
CNAME www.buskaro.com     → buskaro.com
```

### SSL Certificates
Managed by cert-manager + Let's Encrypt (auto-renewal)

## Support & Maintenance

### Regular Tasks
- Daily: Check logs and metrics
- Weekly: Review security scans
- Monthly: Update dependencies
- Quarterly: Disaster recovery drill

### Emergency Contacts
- Primary: DevOps team
- Escalation: Engineering lead
- Cloud provider: AWS Support

---

## Quick Commands Reference

```bash
# Full deployment
docker-compose up -d && \
kubectl apply -f k8s/production/ && \
kubectl rollout status deployment/buskaro-backend -n buskaro

# View logs
kubectl logs -f deployment/buskaro-backend -n buskaro --tail=100

# SSH into pod
kubectl exec -it deployment/buskaro-backend -n buskaro -- /bin/sh

# Port forwarding
kubectl port-forward svc/buskaro-backend 3000:3000 -n buskaro
```
