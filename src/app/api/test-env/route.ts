export async function GET() {
  return Response.json({ key: process.env.OPENAI_API_KEY })
}
