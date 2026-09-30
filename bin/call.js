#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Auto-load env daripada .env presentation jika belum diset dalam shell
if (!process.env.LAMANHOST_SECRET_KEY) {
  const envPath = path.resolve(__dirname, '../../presentation/.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  }
}
const toolName = process.argv[2];
let args = {};
if (process.argv[3]) {
  try {
    args = JSON.parse(process.argv[3]);
  } catch (e) {
    console.error("Ralat parsing hujah JSON:", e.message);
    process.exit(1);
  }
}

if (!toolName) {
  console.log("Penggunaan: node bin/call.js <tool_name> [json_arguments]");
  process.exit(1);
}

const serverPath = path.resolve(__dirname, '../dist/index.js');
const proc = spawn('node', [serverPath], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'inherit']
});

let buffer = '';

proc.stdout.on('data', chunk => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      handleMessage(msg);
    } catch (_) {}
  }
});

function handleMessage(msg) {
  if (msg.id === 1) {
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }) + '\n');
  } else if (msg.id === 2) {
    if (msg.error) {
      console.error("MCP Tool Error:", msg.error);
      process.exit(1);
    }
    const content = msg.result?.content?.[0]?.text;
    try {
      const parsed = JSON.parse(content);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(content);
    }
    proc.kill();
    process.exit(0);
  }
}

proc.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'lh-mcp-agent-cli', version: '1.0.0' }
  }
}) + '\n');
