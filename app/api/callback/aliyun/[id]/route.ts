import { NextRequest } from "next/server"
import { formatAliyunCallbackMessage, parseAliyunCallbackForm } from "@/lib/aliyun-callback"
import { pushEndpointMessage, PushEndpointError } from "@/lib/push"

export const runtime = "edge"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const uid = request.nextUrl.searchParams.get("uid")
    const seed = request.nextUrl.searchParams.get("seed")

    if (!uid || !seed) {
      return Response.json({ message: "缺少 uid 或 seed" }, { status: 400 })
    }

    const form = await request.formData()
    const body = await parseAliyunCallbackForm(form, { uid, seed })
    const message = formatAliyunCallbackMessage(body)
    await pushEndpointMessage(id, {
      body: message,
      content: message,
      text: message,
      aliyun: body,
    })

    return Response.json({ message: "推送成功" }, { status: 200 })
  } catch (error) {
    console.error("Aliyun callback error:", error)

    if (error instanceof PushEndpointError) {
      return Response.json({ message: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : "推送失败"
    const status = message.toLowerCase().includes("checksum") ? 403 : 500
    return Response.json({ message }, { status })
  }
}
