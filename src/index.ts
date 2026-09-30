#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LamanHostDbClient } from "./client.js";
import { getGeneralDeploymentGuide, getFrameworkSnippet } from "./guides.js";
import { SupportedFramework } from "./types.js";

const server = new Server(
  {
    name: "lamanhost-db-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// ---------------------------------------------------------------------------
// DAFTAR TOOLS
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "db_test_connection",
        description:
          "Uji sambungan ke Pangkalan Data LamanHost menggunakan Secret Key. Mengesahkan status aktif pangkalan data dan masa tindak balas.",
        inputSchema: {
          type: "object",
          properties: {
            secret_key: {
              type: "string",
              description:
                "X-Database-Secret-Key pilihan jika tidak diset dalam environment variable LAMANHOST_SECRET_KEY.",
            },
          },
        },
      },
      {
        name: "db_get_deployment_guide",
        description:
          "WAJIB DIBACA OLEH AI AGENT: Dapatkan panduan lengkap dan padat bagaimana cara mengintegrasikan pangkalan data ini ke dalam kod aplikasi yang dideploy di LamanHost (konfigurasi DATABASE_URL, perbezaan sambungan dalaman vs luaran, dan boilerplate mengikut framework).",
        inputSchema: {
          type: "object",
          properties: {
            framework: {
              type: "string",
              enum: [
                "nodejs-pg",
                "prisma",
                "drizzle",
                "python-sqlalchemy",
                "python-psycopg",
                "golang-pgx",
                "php-pdo",
              ],
              description:
                "Pilihan framework untuk contoh kod spesifik. Jika ditinggalkan, panduan umum akan diberikan.",
            },
          },
        },
      },
      {
        name: "db_list_tables",
        description:
          "Senaraikan semua jadual (tables) dalam skema 'public' pangkalan data LamanHost pengguna.",
        inputSchema: {
          type: "object",
          properties: {
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
        },
      },
      {
        name: "db_describe_table",
        description:
          "Dapatkan maklumat terperinci tentang struktur jadual tertentu (nama kolum, data type, nullable, default value, primary key).",
        inputSchema: {
          type: "object",
          properties: {
            table_name: {
              type: "string",
              description: "Nama jadual yang ingin diperiksa (contoh: 'users').",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["table_name"],
        },
      },
      {
        name: "db_get_schema_summary",
        description:
          "Dapatkan ringkasan menyeluruh semua jadual dan kolum sekaligus. Sangat efisien untuk AI merangka skema ORM, migration, atau membina fitur baru.",
        inputSchema: {
          type: "object",
          properties: {
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
        },
      },
      {
        name: "db_query",
        description:
          "Laksanakan kueri SQL (SELECT, INSERT, UPDATE, CREATE TABLE, dsb.) ke pangkalan data LamanHost secara selamat.",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "Pernyataan SQL yang ingin dijalankan.",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "db_list_my_projects",
        description:
          "Senaraikan semua projek web LamanHost milik pengguna pangkalan data ini sahaja (Tenant-Scoped). Berguna untuk AI menyemak projek sedia ada sebelum pautan dibuat.",
        inputSchema: {
          type: "object",
          properties: {
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
        },
      },
      {
        name: "db_link_to_project",
        description:
          "Pautkan pangkalan data ini ke projek web LamanHost pengguna secara automatik (menyuntik DATABASE_URL). Hanya projek milik pengguna pangkalan data ini dibenarkan demi keselamatan.",
        inputSchema: {
          type: "object",
          properties: {
            project_id_or_slug: {
              type: "string",
              description: "ID atau slug projek sasaran milik pengguna (contoh: 'presentation' atau 'cmuf6...').",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["project_id_or_slug"],
        },
      },
      {
        name: "db_redeploy_project",
        description:
          "Bina semula dan lancarkan semula projek pengguna di LamanHost dengan konfigurasi dan pembolehubah persekitaran terkini.",
        inputSchema: {
          type: "object",
          properties: {
            project_id_or_slug: {
              type: "string",
              description: "ID atau slug projek sasaran milik pengguna (contoh: 'bahagian' atau 'cmuo...').",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["project_id_or_slug"],
        },
      },
      {
        name: "db_list_project_files",
        description:
          "Senaraikan fail-fail dan folder dalam storan projek LamanHost milik pengguna (Tenant-Scoped & Path-Safe). Membolehkan AI menyemak fail sebelum membaca atau mengemas kini kod projek.",
        inputSchema: {
          type: "object",
          properties: {
            project_id_or_slug: {
              type: "string",
              description: "ID atau slug projek sasaran milik pengguna (contoh: 'bahagian' atau 'presentation').",
            },
            path: {
              type: "string",
              description: "Sub-laluan folder pilihan jika ingin menyenaraikan folder tertentu sahaja (contoh: 'src' atau 'public').",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["project_id_or_slug"],
        },
      },
      {
        name: "db_read_project_file",
        description:
          "Baca kandungan teks fail daripada projek pengguna di LamanHost (contoh: 'admin.html', 'config.json', 'server.js'). Dilindungi oleh sekatan rentas tenant dan pencegahan penembusan direktori.",
        inputSchema: {
          type: "object",
          properties: {
            project_id_or_slug: {
              type: "string",
              description: "ID atau slug projek sasaran milik pengguna.",
            },
            file_path: {
              type: "string",
              description: "Laluan fail relatif dari direktori projek (contoh: 'admin.html', 'config.json', 'package.json').",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["project_id_or_slug", "file_path"],
        },
      },
      {
        name: "db_update_project_file",
        description:
          "Kemas kini atau cipta fail dalam storan projek pengguna di LamanHost, dengan pilihan membina dan melancarkan semula kontena secara automatik (auto-redeploy) supaya perubahan dipaparkan secara langsung.",
        inputSchema: {
          type: "object",
          properties: {
            project_id_or_slug: {
              type: "string",
              description: "ID atau slug projek sasaran milik pengguna.",
            },
            file_path: {
              type: "string",
              description: "Laluan fail relatif untuk disimpan atau dikemas kini (contoh: 'admin.html', 'config.json').",
            },
            content: {
              type: "string",
              description: "Kandungan fail teks yang lengkap.",
            },
            redeploy: {
              type: "boolean",
              description: "Tetapkan true jika mahu projek dilancarkan semula secara langsung selepas fail disimpan (default: false).",
            },
            secret_key: {
              type: "string",
              description: "Secret key jika ingin override env var.",
            },
          },
          required: ["project_id_or_slug", "file_path", "content"],
        },
      },
    ],
  };
});

// ---------------------------------------------------------------------------
// DAFTAR PROMPTS
// ---------------------------------------------------------------------------
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "integrate-database-deployment",
        description:
          "Panduan arahan sistem untuk AI Agent semasa membina projek baru yang akan dideploy ke LamanHost.",
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "integrate-database-deployment") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: getGeneralDeploymentGuide(),
          },
        },
      ],
    };
  }
  throw new Error(`Prompt '${request.params.name}' tidak dijumpai.`);
});

// ---------------------------------------------------------------------------
// PELAKSANAAN TOOLS
// ---------------------------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "db_get_deployment_guide") {
      const framework = (args?.framework as SupportedFramework) || undefined;
      const content = framework
        ? `${getGeneralDeploymentGuide()}\n\n${getFrameworkSnippet(framework)}`
        : getGeneralDeploymentGuide();

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }

    const secretKey = (args?.secret_key as string) || undefined;
    const client = new LamanHostDbClient(secretKey);

    switch (name) {
      case "db_test_connection": {
        const res = await client.executeQuery("SELECT version(), current_timestamp;");
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Sambungan Gagal: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  connected: true,
                  database: res.database?.name,
                  type: res.database?.type,
                  status: res.database?.status,
                  executionTimeMs: res.result?.executionTimeMs,
                  serverTime: res.result?.rows?.[0]?.current_timestamp,
                  version: res.result?.rows?.[0]?.version,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "db_list_tables": {
        const sql = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `;
        const res = await client.executeQuery(sql);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal menyenaraikan jadual: ${res.error}` }],
          };
        }
        const tables = (res.result?.rows || []).map((r) => r.table_name);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tables, count: tables.length }, null, 2),
            },
          ],
        };
      }

      case "db_describe_table": {
        const tableName = args?.table_name as string;
        if (!tableName) {
          throw new Error("Parameter 'table_name' diperlukan.");
        }

        const sql = `
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${tableName.replace(/'/g, "''")}'
          ORDER BY ordinal_position;
        `;
        const res = await client.executeQuery(sql);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal menghurai jadual '${tableName}': ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  table: tableName,
                  columns: res.result?.rows || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "db_get_schema_summary": {
        const sql = `
          SELECT 
            table_name, 
            column_name, 
            data_type, 
            is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `;
        const res = await client.executeQuery(sql);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal mendapatkan skema: ${res.error}` }],
          };
        }

        const schema: Record<string, string[]> = {};
        for (const row of res.result?.rows || []) {
          if (!schema[row.table_name]) {
            schema[row.table_name] = [];
          }
          schema[row.table_name].push(
            `${row.column_name}: ${row.data_type}${row.is_nullable === "NO" ? " (required)" : ""}`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  database: res.database?.name,
                  tablesCount: Object.keys(schema).length,
                  schema,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "db_query": {
        const sql = args?.sql as string;
        if (!sql) {
          throw new Error("Parameter 'sql' diperlukan.");
        }
        const res = await client.executeQuery(sql);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Ralat SQL: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  command: res.result?.command,
                  rowCount: res.result?.rowCount,
                  executionTimeMs: res.result?.executionTimeMs,
                  rows: res.result?.rows || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "db_list_my_projects": {
        const res = await client.listProjects();
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal menyenaraikan projek: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case "db_link_to_project": {
        const projectId = (args?.project_id_or_slug || args?.projectId || args?.slug) as string;
        if (!projectId) {
          throw new Error("Parameter 'project_id_or_slug' diperlukan.");
        }
        const res = await client.linkProject(projectId);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal memautkan pangkalan data ke projek: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }
      case "db_redeploy_project": {
        const projectId = (args?.project_id_or_slug || args?.projectId || args?.slug) as string;
        if (!projectId) {
          throw new Error("Parameter 'project_id_or_slug' diperlukan.");
        }
        const res = await client.redeployProject(projectId);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal melancarkan semula projek: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }
      case "db_list_project_files": {
        const projectId = (args?.project_id_or_slug || args?.projectId || args?.slug) as string;
        if (!projectId) {
          throw new Error("Parameter 'project_id_or_slug' diperlukan.");
        }
        const subPath = (args?.path || args?.subpath) as string | undefined;
        const res = await client.listProjectFiles(projectId, subPath);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal menyenaraikan fail projek: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case "db_read_project_file": {
        const projectId = (args?.project_id_or_slug || args?.projectId || args?.slug) as string;
        const filePath = (args?.file_path || args?.filePath || args?.path) as string;
        if (!projectId) {
          throw new Error("Parameter 'project_id_or_slug' diperlukan.");
        }
        if (!filePath) {
          throw new Error("Parameter 'file_path' diperlukan.");
        }
        const res = await client.readProjectFile(projectId, filePath);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal membaca fail: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: typeof res.content === "string" ? res.content : JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case "db_update_project_file": {
        const projectId = (args?.project_id_or_slug || args?.projectId || args?.slug) as string;
        const filePath = (args?.file_path || args?.filePath || args?.path) as string;
        const content = args?.content as string;
        const redeploy = Boolean(args?.redeploy);

        if (!projectId) {
          throw new Error("Parameter 'project_id_or_slug' diperlukan.");
        }
        if (!filePath) {
          throw new Error("Parameter 'file_path' diperlukan.");
        }
        if (typeof content !== "string") {
          throw new Error("Parameter 'content' diperlukan.");
        }

        const res = await client.updateProjectFile(projectId, filePath, content, redeploy);
        if (!res.success) {
          return {
            isError: true,
            content: [{ type: "text", text: `Gagal mengemas kini fail: ${res.error}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Tool '${name}' tidak dikenali.`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Ralat: ${err.message || String(err)}` }],
    };
  }
});

// ---------------------------------------------------------------------------
// MULAKAN SERVER MELALUI STDIO
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[lamanhost-db-mcp] Server berjalan melalui stdio transport.");
}

main().catch((err) => {
  console.error("[lamanhost-db-mcp] Ralat kritikal:", err);
  process.exit(1);
});
