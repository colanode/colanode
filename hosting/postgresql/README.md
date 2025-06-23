# PostgreSQL with pgvector

This directory contains a Dockerfile that builds a custom PostgreSQL image based on Bitnami's PostgreSQL image. The purpose of this custom image is for deploying PostgreSQL using Helm charts in Kubernetes environments.

## Features

- **Base Image**: Built on Bitnami PostgreSQL for enhanced security and enterprise features
- **pgvector Extension**: Integrated with pgvector extension for vector similarity search capabilities
- **Helm Chart Ready**: Designed specifically for deployment via Helm charts in Kubernetes clusters
