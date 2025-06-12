<p align="center">
  <img alt="Colanode cover" src="assets/images/colanode-cover-black.png">
</p>

# Colanode

### Open-source & local-first collaboration workspace that you can self-host

Colanode is an all-in-one platform for easy collaboration, built to prioritize your data privacy and control. Designed with a **local-first** approach, it helps teams communicate, organize, and manage projects—whether online or offline. With Colanode, you get the flexibility of modern collaboration tools, plus the peace of mind that comes from owning your data.

### What can you do with Colanode?

- **Real-Time Chat:** Stay connected with instant messaging for teams and individuals.
- **Rich Text Pages:** Create documents, wikis, and notes using an intuitive editor, similar to Notion.
- **Customizable Databases:** Organize information with structured data, custom fields and dynamic views (table, kanban, calendar).
- **File Management:** Store, share, and manage files effortlessly within secure workspaces.

Built for both individuals and teams, Colanode adapts to your needs, whether you're running a small project, managing a team, or collaborating across an entire organization. With its self-hosted model, you retain full control over your data while enjoying a polished, feature-rich experience.

![Colanode preview](assets/images/colanode-desktop-preview.gif)

## How it works

Colanode includes a client app (web or desktop) and a self-hosted server. You can connect to multiple servers with a single app, each containing one or more **workspaces** for different teams or projects. After logging in, you pick a workspace to start collaborating—sending messages, editing pages, or updating database records.

### Local-first workflow

All changes you make are saved to a local SQLite database first and then synced to the server. A background process handles this synchronization so you can keep working even if your computer or the server goes offline. Data reads also happen locally, ensuring immediate access to any content you have permissions to view.

### Concurrent edits

Colanode relies on **Conflict-free Replicated Data Types (CRDTs)** - powered by [Yjs](https://docs.yjs.dev/) - to allow real-time collaboration on entries like pages or database records. This means multiple people can edit at the same time, and the system gracefully merges everyone’s updates. Deletions are also tracked as specialized transactions. Messages and file operations don’t support concurrent edits and use simpler database tables.

## Get started for free

The easiest way to start using Colanode is through our **web app**, accessible instantly at [app.colanode.com](https://app.colanode.com). Simply log in to get started immediately, without any installation. _Please note, the web app is currently in early preview and under testing; you may encounter bugs or compatibility issues in certain browsers._

For optimal performance, you can install our **desktop app**, available from our [downloads page](https://colanode.com/downloads). Both the web and desktop apps allow you to connect to any of our free beta cloud servers:

- **Colanode Cloud (EU)** – hosted in Europe.
- **Colanode Cloud (US)** – hosted in the United States.

Both cloud servers are currently available in beta and free to use; pricing details will be announced soon.

### Self-host with Docker

If you prefer to host your own Colanode server, simply use the Docker Compose file in the root of this repository. In the near future, we’ll provide more detailed instructions for other environments, including Kubernetes. For now, here’s what you need to run Colanode yourself:

- **Postgres** with the **pgvector** extension.
- **Redis** (any Redis-compatible service will work, e.g., Valkey).
- **S3-compatible storage** (supporting basic file operations: PUT, GET, DELETE).
- **Colanode server API**, provided as a Docker image.

All required environment variables for the Colanode server can be found in the docker-compose file.

## License

Colanode is released under the [Apache 2.0 License](LICENSE).
