/**
 * Test which OpenRouter models are genuinely free and responsive.
 * Run: node scripts/test-openrouter-free.mjs
 */

const OPEN_ROUTER_API = process.env.OPENROUTER_API_KEY
const BASE_URL = "https://openrouter.ai/api/v1"

// Step 1: fetch actual free models from OpenRouter catalog
async function fetchFreeModels() {
  console.log("Fetching model catalog from OpenRouter...\n")
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${OPEN_ROUTER_API}` },
  })
  const data = await res.json()
  const free = data.data.filter(
    (m) =>
      (m.pricing?.prompt === "0" || m.pricing?.prompt === 0) &&
      (m.pricing?.completion === "0" || m.pricing?.completion === 0)
  )
  return free
}

// Step 2: quick chat test (very small prompt)
async function testModel(modelId) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPEN_ROUTER_API}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: 'Reply with exactly: {"ok":true}' }],
        max_tokens: 20,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error?.message ?? JSON.stringify(data) }
    }
    const content = data.choices?.[0]?.message?.content ?? ""
    return { ok: true, content: content.trim() }
  } catch (e) {
    clearTimeout(timeout)
    return { ok: false, error: e.name === "AbortError" ? "TIMEOUT (15s)" : e.message }
  }
}

async function main() {
  const freeModels = await fetchFreeModels()
  console.log(`Found ${freeModels.length} free models in catalog:\n`)
  freeModels.forEach((m) => console.log(`  ${m.id}`))
  console.log()

  const working = []
  const failed = []

  for (const m of freeModels) {
    process.stdout.write(`Testing ${m.id} ... `)
    const result = await testModel(m.id)
    if (result.ok) {
      console.log(`OK  →  ${result.content}`)
      working.push(m.id)
    } else {
      console.log(`FAIL  [${result.status ?? ""}] ${result.error}`)
      failed.push({ id: m.id, error: result.error })
    }
    // small delay to avoid rate limit
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log("\n=== WORKING FREE MODELS ===")
  working.forEach((id) => console.log(`  ✓ ${id}`))

  console.log("\n=== FAILED / UNAVAILABLE ===")
  failed.forEach(({ id, error }) => console.log(`  ✗ ${id}  —  ${error}`))

  console.log("\n=== COPY-PASTE FOR route.ts ===")
  working.forEach((id) => {
    const label = id.split("/").pop().replace(/:free$/, "").replace(/-/g, " ")
    console.log(`      { name: "OR ${label}", fn: () => tryOpenRouter("${id}", extractedText, title, count) },`)
  })
}

main().catch(console.error)
