export interface LamanHostApiResponse<T = any> {
  success: boolean;
  database?: {
    id?: string;
    name: string;
    type: string;
    status: string;
    createdAt?: string;
  };
  rows?: Record<string, any>[];
  rowCount?: number;
  fields?: string[];
  command?: string;
  executionTimeMs?: number;
  message?: string;
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
