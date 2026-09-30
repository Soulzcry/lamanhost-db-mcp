import { SupportedFramework } from "./types.js";

export function getGeneralDeploymentGuide(): string {
  return `
================================================================================
🚀 PANDUAN INTEGRASI PANGKALAN DATA UNTUK PROJEK DI LAMANHOST
================================================================================

Sebagai AI Agent yang membantu pengguna, fahami prinsip utama ini:

1. DUA JENIS SAMBUNGAN:
   a. SAMBUNGAN DALAMAN (INTERNAL CONNECTION) -> UNTUK APLIKASI DI-DEPLOY DI LAMANHOST
      - Aplikasi dan database berada dalam rangkaian kontena Docker terasing yang sama.
      - Sangat pantas (latensi < 1ms), selamat tanpa membuka port ke internet awam.
      - Format URI: postgresql://<user>:<password>@<db-container-name>:5432/<dbname>
      - Kod backend (Node, Python, Go, dll.) MESTI menggunakan URI ini melalui DATABASE_URL.

   b. SAMBUNGAN LUARAN (EXTERNAL DATA API & MCP) -> UNTUK ANDA (AI AGENT) & TOOL LUARAN
      - Menggunakan X-Database-Secret-Key melalui HTTP REST Gateway (https://lamanhost.com/api/v1/db/query).
      - Digunakan oleh MCP ini untuk query data, run migration, atau inspect schema dari komputer dev.

2. LANGKAH SETUP UNTUK PENGGUNA DI LAMANHOST PORTAL:
   Langkah 1: Salin "Pautan Sambungan Dalaman (Internal Connection URI)" dari tab Pangkalan Data.
   Langkah 2: Buka projek yang ingin dideploy di dashboard LamanHost -> Pergi ke "Environment Variables".
   Langkah 3: Tambah pembolehubah:
              Key   : DATABASE_URL
              Value : <Pautan Sambungan Dalaman yang disalin>
   Langkah 4: Deploy / Redeploy projek.

3. CARA KOD APLIKASI MEMBACA DATABASE:
   Semua kod aplikasi MESTI membaca 'process.env.DATABASE_URL' (atau os.environ.get('DATABASE_URL')).
   Jangan sesekali 'hardcode' password atau URI ke dalam kod repo.

4. PENGURUSAN PORT OLEH PELAYAN (JANGAN MASUKKAN SEBAGAI SECRET):
   - Port pelayan diuruskan secara automatik oleh platform LamanHost melalui persekitaran kontena.
   - Pembangun/Agent TIDAK PERLU memasukkan PORT ke dalam Secret atau Environment Variables.
   - Kod aplikasi hanya perlu membaca pembolehubah lalai: process.env.PORT || 3000.
================================================================================
`.trim();
}

export function getFrameworkSnippet(framework: SupportedFramework): string {
  switch (framework) {
    case "nodejs-pg":
      return `
// --- NODE.JS DENGAN 'pg' (node-postgres) ---
// 1. Install: npm install pg @types/pg
// 2. Dalam fail kod (cth: src/db.js atau src/db.ts):

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Tiada ssl diperlukan untuk sambungan rangkaian dalaman LamanHost
  ssl: false,
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
`;

    case "prisma":
      return `
// --- PRISMA ORM ---
// 1. prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 2. Dalam kod:
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// 3. Untuk migration di LamanHost Build Command:
// Masukkan 'npx prisma migrate deploy && npm run start' dalam arahan start projek anda.
`;

    case "drizzle":
      return `
// --- DRIZZLE ORM ---
// 1. Install: npm install drizzle-orm pg && npm install -D drizzle-kit @types/pg
// 2. src/db.ts:
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
`;

    case "python-sqlalchemy":
      return `
# --- PYTHON (SQLAlchemy) ---
# 1. Install: pip install sqlalchemy psycopg2-binary
# 2. db.py:
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is missing")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
`;

    case "python-psycopg":
      return `
# --- PYTHON (psycopg3) ---
# 1. Install: pip install "psycopg[binary]"
# 2. db.py:
import os
import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_connection():
    return psycopg.connect(DATABASE_URL)
`;

    case "golang-pgx":
      return `
// --- GOLANG (pgx) ---
// 1. go get github.com/jackc/pgx/v5/pgxpool
package db

import (
    "context"
    "os"
    "github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB() error {
    var err error
    dbUrl := os.Getenv("DATABASE_URL")
    Pool, err = pgxpool.New(context.Background(), dbUrl)
    return err
}
`;

    case "php-pdo":
      return `
<?php
// --- PHP (PDO) ---
$databaseUrl = getenv('DATABASE_URL');
$db = parse_url($databaseUrl);

$dsn = sprintf(
    "pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s",
    $db['host'],
    $db['port'] ?? 5432,
    ltrim($db['path'], '/'),
    $db['user'],
    $db['pass']
);

$pdo = new PDO($dsn, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
`;

    default:
      return getGeneralDeploymentGuide();
  }
}
