# 🔌 LamanHost Database MCP Server (`lamanhost-db-mcp`)

Official **Model Context Protocol (MCP)** server for [LamanHost](https://lamanhost.com) PostgreSQL databases.

This server enables AI Agents (Claude Desktop, Cursor, VS Code Copilot, Antigravity, etc.) to securely:
1. **Test connection & monitor database health**
2. **Inspect database schema** (tables, columns, types)
3. **Execute SQL queries safely** (SELECT, migrations, DDL)
4. **Get deployment integration guides** on how to connect your deployed app on LamanHost via internal Docker networks.

---

## ⚡ Quick Start (No Installation Needed)

You can run this MCP directly with `npx`:

```bash
npx -y lamanhost-db-mcp
```

---

## ⚙️ Configuration for AI Agents

### 1. Cursor (`.cursor/mcp.json` or Global Settings)

Add this to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "lamanhost-db": {
      "command": "npx",
      "args": ["-y", "lamanhost-db-mcp"],
      "env": {
        "LAMANHOST_SECRET_KEY": "lh_sec_your_secret_key_here"
      }
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)

On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`  
On Windows: `%APPDATA%\Claude\claude_desktop_config.json`  
On Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lamanhost-db": {
      "command": "npx",
      "args": ["-y", "lamanhost-db-mcp"],
      "env": {
        "LAMANHOST_SECRET_KEY": "lh_sec_your_secret_key_here"
      }
    }
  }
}
```

---

## 🛠️ Available MCP Tools

| Tool | Description |
|---|---|
| `db_test_connection` | Tests credentials and verifies database connectivity & response latency. |
| `db_get_deployment_guide` | **Crucial for Agents:** Explains exactly how to configure `DATABASE_URL` in LamanHost environment variables, internal vs external connection differences, and provides framework-specific code snippets. |
| `db_list_tables` | Lists all public tables in the database. |
| `db_describe_table` | Inspects schema details of a specific table (column types, nullability, defaults). |
| `db_get_schema_summary` | Compact full database schema overview (ideal for ORM/migration drafting). |
| `db_query` | Executes safe SQL queries directly on your database instance. |

---

## 💡 How Deployed Apps Connect to LamanHost Database

When an application is deployed on **LamanHost**, it resides in the **same isolated Docker network** as your PostgreSQL container:

1. **Inside Deployed App**: Use the **Internal Connection URI** as `DATABASE_URL`:
   ```bash
   DATABASE_URL="postgresql://user:password@db-container:5432/dbname"
   ```
   *Do NOT use the external secret key HTTP gateway for app runtime queries—internal connection gives sub-millisecond native TCP sockets.*

2. **Outside (AI Agents / Dev Machines)**: Use **Secret Key Gateway** (`lh_sec_...`) via this MCP server.

Ask your agent:  
> *"Gunakan tool `db_get_deployment_guide` untuk terangkan cara sambung database ke projek Next.js/Prisma saya di LamanHost."*

---

## 📄 License

MIT © [LamanHost](https://lamanhost.com)
