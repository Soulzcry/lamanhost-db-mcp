export interface LamanHostApiResponse<T = any> {
  success: boolean;
  database?: {
    name: string;
    type: string;
    status: string;
    createdAt?: string;
  };
  result?: {
    command?: string;
    rowCount?: number;
    fields?: string[];
    rows?: Record<string, any>[];
    executionTimeMs?: number;
  };
  error?: string;
  code?: string;
}

export type SupportedFramework =
  | "nodejs-pg"
  | "prisma"
  | "drizzle"
  | "python-sqlalchemy"
  | "python-psycopg"
  | "golang-pgx"
  | "php-pdo";
