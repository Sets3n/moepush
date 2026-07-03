import { NextRequest } from "next/server"
import { pushEndpointMessage, PushEndpointError } from "@/lib/push"

export const runtime = "edge"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const body = await request.json()
    console.log('body:', body)

    await pushEndpointMessage(id, body)

    return new Response(JSON.stringify({ message: "推送成功" }), { status: 200 })

  } catch (error) {
    console.error("Push error:", error)
    if (error instanceof PushEndpointError) {
      return new Response(
        JSON.stringify({ message: error.message }),
        { status: error.status }
      )
    }

    return new Response(
      JSON.stringify({ message: error instanceof Error ? error.message : "推送失败" }),
      { status: 500 }
    )
  }
}
