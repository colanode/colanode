# PostgreSQL with pgvector

Custom PostgreSQL image with pgvector extension for Colanode's vector search capabilities.

## Why Custom Image?

The default Bitnami PostgreSQL image used by our Helm chart dependency doesn't include pgvector. This custom image builds on the same base image Bitnami uses but adds the pgvector extension.

See the [Helm chart documentation](../kubernetes/README.md) for deployment details.
