import { getDb } from "@/lib/db"
import { endpoints } from "@/lib/db/schema/endpoints"
import { eq } from "drizzle-orm"
import { safeInterpolate } from "@/lib/template"
import { sendChannelMessage } from "@/lib/channels"

export class PushEndpointError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message)
    this.name = "PushEndpointError"
  }
}

export async function pushEndpointMessage(id: string, body: unknown) {
  const db = await getDb()
  const endpoint = await db.query.endpoints.findFirst({
    where: eq(endpoints.id, id),
    with: {
      channel: true,
    },
  })

  if (!endpoint || !endpoint.channel) {
    throw new PushEndpointError("接口不存在", 404)
  }

  if (endpoint.status !== "active") {
    throw new PushEndpointError("接口已禁用", 403)
  }

  const processedTemplate = safeInterpolate(endpoint.rule, {
    body,
  })
  const messageObj = JSON.parse(processedTemplate)

  await sendChannelMessage(
    endpoint.channel.type as any,
    messageObj,
    {
      webhook: endpoint.channel.webhook,
      secret: endpoint.channel.secret,
      corpId: endpoint.channel.corpId,
      agentId: endpoint.channel.agentId,
      botToken: endpoint.channel.botToken,
      chatId: endpoint.channel.chatId,
      appId: endpoint.channel.appId,
      appKey: endpoint.channel.appKey,
    }
  )
}
