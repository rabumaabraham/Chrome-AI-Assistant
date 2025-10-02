# Docker Deployment

## Prerequisites

- Docker Desktop installed
- OpenRouter API key

## Quick Start

1. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your OpenRouter API key
   ```

2. **Deploy**:
   ```bash
   docker-compose up -d --build
   ```

3. **Access**: `http://localhost:3000`

## Architecture

- **Backend**: Node.js API server with AI, OCR, and PDF processing
- **Container**: Alpine Linux with security hardening
- **Networking**: Isolated container network
- **Health Checks**: Automated service monitoring

## Commands

```bash
# Start services
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

## Production Deployment

### Current Setup
- **Backend**: Deployed on Render
- **Extension**: Published to Chrome Web Store
- **Local Development**: Docker containerization

### Alternative Deployment Options
- **AWS**: ECS, EKS, or EC2 with Docker
- **Google Cloud**: Cloud Run or GKE
- **Azure**: Container Instances or AKS
- **DigitalOcean**: App Platform or Droplets

### Local Development
```bash
git clone <repository>
cd <project>
cp .env.example .env
# Configure .env
docker-compose up -d --build
```

## Configuration

Key environment variables:
- `OPENROUTER_API_KEY`: AI service authentication
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `MAX_TOKENS`: AI response limits
- `RATE_LIMIT_MAX`: Request throttling

## Security

- Non-root container user
- Environment variable isolation
- Network segmentation
- Resource limits configured
- Health check monitoring

## Monitoring

- Container health checks
- Application logs via `docker-compose logs`
- Resource usage via `docker stats`
- API health endpoint: `/api/health`
