# MCP Builder

> **Sumber:** [`skills/mcp-builder/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/mcp-builder/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

MCP (Model Context Protocol) server adalah cara LLM agent berinteraksi dengan external
service. Server yang dibangun ad hoc biasanya gagal di hal-hal yang tidak terlihat saat
implementasi: tool name yang tidak discoverable, response yang membanjiri konteks,
error message yang tidak actionable, schema yang ambigu. Skill ini memandu pembangunan
server MCP berkualitas dengan empat fase yang eksplisit — research, implementation,
review/test, evaluation.

Nilai uniknya: penekanan pada **measurable quality**. Output akhir bukan cuma server yang
jalan, tapi server + 10 evaluation questions independen yang menguji apakah LLM benar-benar
bisa menyelesaikan tugas dunia nyata via server itu. Ini adalah cara objektif untuk
menilai apakah desain tool mu bagus, bukan sekadar feeling.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mau bangun MCP server untuk integrasi external API/service.
- Stack Python (FastMCP) atau Node/TypeScript (MCP SDK).
- User butuh panduan tool design, schema, error handling, pagination, evaluation.

## Cara menggunakannya

### Fase 1: Deep Research & Planning

- **Pahami desain MCP modern** — balance API coverage vs workflow tool. Default ke API
  coverage komprehensif kecuali user butuh workflow spesifik.
- **Tool naming** — prefix konsisten (`github_create_issue`, `github_list_repos`),
  action-oriented.
- **Context management** — tool description ringkas, return data terfokus, dukung
  filter/pagination.
- **Actionable error messages** — kasih saran solusi + next step.
- **Studi MCP spec** — mulai dari `https://modelcontextprotocol.io/sitemap.xml`, fetch
  page dengan suffix `.md`.
- **Studi framework doc** — TypeScript SDK (direkomendasikan) atau Python SDK,
  ditambah `reference/mcp_best_practices.md` di skill ini.
- **Plan implementation** — review API service, list endpoint, prioritaskan operasi
  paling umum.

### Fase 2: Implementation

- Setup project structure — `reference/node_mcp_server.md` atau `reference/python_mcp_server.md`.
- Shared utilities: API client + auth, error helpers, response formatting (JSON/Markdown),
  pagination.
- Per-tool: input schema (Zod / Pydantic dengan constraint + contoh), output schema
  (`outputSchema` untuk structured data), description ringkas, implementasi async/await
  dengan error handling, annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`,
  `openWorldHint`).

### Fase 3: Review & Test

- Code quality: no duplicate, error handling konsisten, type coverage full, tool description
  jelas.
- Build & test: `npm run build` atau `python -m py_compile`, lalu MCP Inspector
  (`npx @modelcontextprotocol/inspector`).

### Fase 4: Create Evaluations

- Load `reference/evaluation.md` untuk panduan lengkap.
- Bikin 10 pertanyaan eval — independen, read-only, kompleks (multi tool call),
  realistic, verifiable (jawaban tunggal string-comparable), stable (jawaban tidak
  berubah).
- Output XML:
  ```xml
  <evaluation>
    <qa_pair>
      <question>...</question>
      <answer>...</answer>
    </qa_pair>
  </evaluation>
  ```

Resource pendukung (folder `reference/`):

- `mcp_best_practices.md` — panduan universal naming, response format, pagination,
  transport selection, security.
- `node_mcp_server.md` — TypeScript patterns + complete examples.
- `python_mcp_server.md` — Python/FastMCP patterns.
- `evaluation.md` — panduan lengkap pembuatan eval + script untuk menjalankan.

Recommended stack: **TypeScript** (SDK quality + compatibility MCPB + LLM lebih baik
generate TS), **Streamable HTTP** stateless untuk remote, **stdio** untuk local.

## Contoh / Studi kasus

User: *"Bangunkan MCP server untuk Linear API."*

1. **Research** — Claude pakai WebFetch ke `https://modelcontextprotocol.io/sitemap.xml`,
   muat MCP best practices, baca TypeScript SDK README. Studi Linear API: list teams,
   list issues, create issue, update status, search.
2. **Implementation** — Project TypeScript dengan Zod schema. Tools: `linear_list_teams`,
   `linear_list_issues` (dengan filter & pagination), `linear_create_issue`,
   `linear_update_issue_status`, `linear_search_issues`. Tiap tool dengan
   `inputSchema`, `outputSchema`, `readOnlyHint` di mana applicable, error message
   actionable (mis. "API token expired — refresh via Linear dashboard").
3. **Test** — `npm run build`, test via MCP Inspector dengan beberapa skenario manual.
4. **Eval** — 10 pertanyaan kompleks, mis. *"Find all P1 bugs assigned to Sarah in Q4
   that took longer than 5 days to close. What's the average cycle time?"* Claude solve
   sendiri dulu untuk verify jawaban. Save sebagai XML, jalankan eval script di
   `reference/evaluation.md`.

## Kesimpulan

Skill ini adalah blueprint pembangunan MCP server berkualitas — bukan sekadar "kode yang
jalan", tapi server yang LLM bisa pakai untuk tugas dunia nyata, dengan validasi
empiris via eval questions. Diniatkan untuk developer yang serius integrasi external API
ke LLM agent. Output: MCP server (TS/Python) + 10 eval questions independen + dokumentasi
tool yang LLM-friendly. Empat fase eksplisit (research → implementation → review/test →
evaluation) mencegah skip step yang biasanya bikin server "jadi" tapi sulit dipakai
agent.
