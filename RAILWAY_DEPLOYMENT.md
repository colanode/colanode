# Railway Deployment Guide

## Overview
This project is optimized for Railway deployment with the following services:
- **Colanode Server** (Node.js API)
- **Colanode Web** (React frontend)
- **MinIO Bucket** (Object storage)
- **MinIO Console** (Storage management)
- **Redis** (Caching/messaging)
- **pgvector** (PostgreSQL with vector extension)

## Environment Variables

### Colanode Server Required Variables
```json
{
  "NODE_ENV": "production",
  "PORT": "3000",
  "SERVER_NAME": "henjii",
  "SERVER_MODE": "standalone",
  "SERVER_CORS_ORIGIN": "https://colanode-web-production.up.railway.app",
  "POSTGRES_URL": "postgresql://postgres:password@pgvector.railway.internal:5432/railway",
  "REDIS_URL": "redis://default:password@redis.railway.internal:6379",
  "STORAGE_S3_ENDPOINT": "http://minio-bucket.railway.internal:9000",
  "STORAGE_S3_ACCESS_KEY": "your_minio_access_key",
  "STORAGE_S3_SECRET_KEY": "your_minio_secret_key",
  "STORAGE_S3_BUCKET": "client",
  "STORAGE_S3_REGION": "us-east-1",
  "STORAGE_S3_FORCE_PATH_STYLE": "true"
}
```

## Build Configuration

### Node.js Version
- Minimum: 20.19.0
- Specified in `.nvmrc` and `package.json` engines

### Build Process
1. Install dependencies: `npm ci`
2. Build server: `cd apps/server && npm run build`
3. Start server: `cd apps/server && npm start`

### Health Check
- Endpoint: `/health`
- Returns: `{ status: "ok", timestamp: "..." }`

## Deployment Steps

1. **Link to Railway Project**
   ```bash
   railway link -p YOUR_PROJECT_ID
   ```

2. **Set Environment Variables**
   - Go to Railway Dashboard → Colanode Server → Variables
   - Add all required variables listed above

3. **Deploy**
   ```bash
   railway up
   ```

## Troubleshooting

### Common Issues

1. **Node Version Mismatch**
   - Ensure Railway uses Node 20.19.0+
   - Check `.nvmrc` file

2. **Build Failures**
   - Check build logs in Railway dashboard
   - Ensure all dependencies are properly installed

3. **Start Command Not Found**
   - Verify `package.json` has `start` script
   - Check `railway.json` configuration

4. **S3/MinIO Connection Issues**
   - Verify MinIO credentials match between services
   - Check internal endpoint URLs

### Logs
- View logs: `railway logs`
- Check specific service: `railway logs --service "Colanode Server"`

## File Structure
```
colanode/
├── apps/
│   ├── server/          # Main API server
│   └── web/            # React frontend
├── packages/           # Shared packages
├── railway.json        # Railway configuration
├── .nvmrc             # Node version
└── Dockerfile         # Backup deployment option
```

## Services Configuration

### Colanode Server
- **Port**: 3000
- **Build**: TypeScript → ESM
- **Start**: `node dist/index.js`

### MinIO Services
- **Bucket**: Object storage for files/avatars
- **Console**: Web UI for storage management
- **Internal**: `minio-bucket.railway.internal:9000`

### Database
- **PostgreSQL**: With pgvector extension
- **Redis**: For caching and job queues

## Monitoring
- Health check: `https://your-domain.railway.app/health`
- MinIO Console: `https://minio-console-production-xxx.up.railway.app`
- Railway Dashboard: Monitor all services 