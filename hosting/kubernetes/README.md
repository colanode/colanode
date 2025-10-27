# Colanode Kubernetes Deployment

A Helm chart for deploying [Colanode](https://github.com/colanode/colanode) on Kubernetes.

## Overview

This chart deploys a complete Colanode instance with all required dependencies:

- **Colanode Server**: The main application server
- **PostgreSQL**: Database with pgvector extension for vector operations
- **Redis/Valkey**: Message queue and caching
- **File Storage (default)**: Persistent volume for user files and avatars
- **Optional Object Storage**: MinIO (S3-compatible), external S3, Google Cloud Storage, or Azure Blob Storage

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

| Parameter            | Description                                                       | Default |
| -------------------- | ----------------------------------------------------------------- | ------- |
| `postgresql.enabled` | Enable PostgreSQL deployment                                      | `true`  |
| `redis.enabled`      | Enable Redis deployment                                           | `true`  |
| `minio.enabled`      | Enable bundled MinIO (only required for the in-cluster S3 option) | `false` |

### Storage Configuration

Set `colanode.storage.type` to choose where user files and avatars are stored:

- **File storage (default)** mounts a persistent volume at `/var/lib/colanode/storage`. Adjust `colanode.storage.file.persistence` to control the PVC size, storage class, or reference an existing claim.
- **S3-compatible storage** (Amazon S3, MinIO, Cloudflare R2, etc.) requires `colanode.storage.type=s3`. Enable the bundled MinIO instance with `--set minio.enabled=true` or supply your provider endpoint, bucket, region, and credentials via `colanode.storage.s3.*`.
- **Google Cloud Storage** needs a service-account JSON key. Create a secret:

  ```bash
  kubectl create secret generic gcs-credentials \
    --from-file=service-account.json=/path/to/key.json
  ```

  Then configure:

  ```yaml
  colanode:
    storage:
      type: gcs
      gcs:
        bucket: your-bucket
        projectId: your-project
        credentialsSecret:
          name: gcs-credentials
          key: service-account.json
  ```

- **Azure Blob Storage** is available with `colanode.storage.type=azure`. Provide the storage `account`, `containerName`, and the account key via `colanode.storage.azure.accountKey` (inline value or an existing secret).

## Important Notes

### Security Settings

The chart includes `global.security.allowInsecureImages: true` because we use a custom PostgreSQL image with the pgvector extension. This setting is required by Bitnami Helm charts when using non-official images.

### Storage

By default, the chart configures persistent storage for:

- Colanode file storage (PVC): 20Gi
- PostgreSQL: 8Gi
- Redis: 8Gi
- MinIO: 10Gi (only when `minio.enabled=true`)

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
