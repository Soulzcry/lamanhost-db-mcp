import { LamanHostApiResponse } from "./types.js";

export class LamanHostDbClient {
  private secretKey: string;
  private baseUrl: string;

  constructor(secretKey?: string, baseUrl?: string) {
    this.secretKey =
      secretKey ||
      process.env.LAMANHOST_SECRET_KEY ||
      process.env.LAMANHOST_DB_SECRET_KEY ||
      "";
    this.baseUrl =
      baseUrl ||
      process.env.LAMANHOST_API_URL ||
      "https://lamanhost.com/api/v1/db/query";

    if (!this.secretKey) {
      console.error(
        "[lamanhost-db-mcp] Amaran: LAMANHOST_SECRET_KEY tidak diset dalam environment variable."
      );
    }
  }

  public getSecretKey(): string {
    return this.secretKey;
  }

  public async executeQuery(sql: string): Promise<LamanHostApiResponse> {
    if (!this.secretKey) {
      throw new Error(
        "Kunci rahsia (LAMANHOST_SECRET_KEY) diperlukan. Sila konfigurasikan dalam settings MCP anda."
      );
    }

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Secret-Key": this.secretKey,
      },
      body: JSON.stringify({
        action: "query",
        query: sql,
      }),
    });

    const data = (await res.json()) as LamanHostApiResponse;

    if (!res.ok && !data.error) {
      throw new Error(`HTTP ${res.status}: Gagal menyambung ke gateway LamanHost.`);
    }

    // Normalisasi struktur result jika gateway memulangkan rows pada aras tertinggi
    if (data && !data.result && data.rows !== undefined) {
      data.result = {
        rows: data.rows,
        rowCount: data.rowCount ?? data.rows.length,
        fields: data.fields || [],
        command: data.command || "SELECT",
        executionTimeMs: data.executionTimeMs || 0,
      };
    }

    return data;
  }
}
