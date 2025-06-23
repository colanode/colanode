# Colanode Kubernetes Deployment

A Helm chart for deploying [Colanode](https://github.com/colanode/colanode) on Kubernetes.

## Overview

This chart deploys a complete Colanode instance with all required dependencies:

- **Colanode Server**: The main application server
- **PostgreSQL**: Database with pgvector extension for vector operations
- **Redis/Valkey**: Message queue and caching
- **MinIO**: S3-compatible object storage for files and avatars

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Ingress controller (if ingress is enabled)

## Installation

### Quick Start

```bash
# Add the chart repository (if publishing to a Helm repo)
helm repo add colanode https://static.colanode.com/hosting/kubernetes/chart

# Install with default values
helm install my-colanode colanode/colanode

# Or install from local chart
helm install my-colanode ./hosting/kubernetes/chart
```

### Custom Installation

```bash
# Install with custom values
helm install my-colanode ./hosting/kubernetes/chart \
  --set colanode.ingress.hosts[0].host=colanode.example.com \
  --set colanode.config.SERVER_NAME="My Colanode Instance"
```

## Configuration

### Core Settings

| Parameter                     | Description                 | Default                   |
| ----------------------------- | --------------------------- | ------------------------- |
| `colanode.replicaCount`       | Number of Colanode replicas | `1`                       |
| `colanode.image.repository`   | Colanode image repository   | `ghcr.io/colanode/server` |
| `colanode.image.tag`          | Colanode image tag          | `latest`                  |
| `colanode.config.SERVER_NAME` | Server display name         | `Colanode K8s`            |

### Ingress Configuration

| Parameter                        | Description              | Default               |
| -------------------------------- | ------------------------ | --------------------- |
| `colanode.ingress.enabled`       | Enable ingress           | `true`                |
| `colanode.ingress.hosts[0].host` | Hostname for the ingress | `chart-example.local` |
| `colanode.ingress.className`     | Ingress class name       | `""`                  |

### Dependencies

| Parameter            | Description                  | Default |
| -------------------- | ---------------------------- | ------- |
| `postgresql.enabled` | Enable PostgreSQL deployment | `true`  |
| `redis.enabled`      | Enable Redis deployment      | `true`  |
| `minio.enabled`      | Enable MinIO deployment      | `true`  |

## Important Notes

### Security Settings

The chart includes `global.security.allowInsecureImages: true` because we use a custom PostgreSQL image with the pgvector extension. This setting is required by Bitnami Helm charts when using non-official images.

### Storage

By default, the chart configures persistent storage for:

- PostgreSQL: 8Gi
- Redis: 8Gi
- MinIO: 10Gi

Adjust these values based on your requirements.

## Accessing Colanode

After installation, you can access Colanode through:

1. **Ingress** (recommended): Configure your ingress host and access via HTTP/HTTPS
2. **Port forwarding**: `kubectl port-forward svc/my-colanode 3000:3000`
3. **LoadBalancer**: Change service type to LoadBalancer if supported by your cluster

## Uninstall

```bash
helm uninstall my-colanode
```

## Development

To modify the chart:

1. Edit values in `/hosting/kubernetes/chart/values.yaml`
2. Update templates in `/hosting/kubernetes/chart/templates/`
3. Test with `helm template` or `helm install --dry-run`
