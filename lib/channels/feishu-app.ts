import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"
import { getCachedToken } from "../token-cache"

export class FeishuAppChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "feishu_app",
    label: "飞书企业应用",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "通过飞书应用发送文本消息",
        fields: [
          { key: "receive_id", description: "接收者 ID（open_id/user_id/chat_id）", required: true },
          { key: "content.text", description: "消息内容", required: true, component: 'textarea' },
          { key: "msg_type", component: 'hidden', defaultValue: "text" },
        ],
      },
      {
        type: "post",
        name: "富文本消息",
        description: "支持标题和格式化内容的富文本消息",
        fields: [
          { key: "receive_id", description: "接收者 ID（open_id/user_id/chat_id）", required: true },
          { key: "content.post.zh_cn.title", description: "标题", required: true },
          {
            key: "content.post.zh_cn.content",
            description: "富文本内容(JSON格式)",
            required: true,
            component: 'textarea',
          },
          { key: "msg_type", component: 'hidden', defaultValue: "post" },
        ],
      },
    ]
  }

  async sendMessage(
    message: any,
    options: SendMessageOptions
  ): Promise<Response> {
    const { appId, appSecret } = options

    if (!appId || !appSecret) {
      throw new Error("缺少飞书应用 App ID 或 App Secret")
    }

    const { getRequestContext } = await import("@cloudflare/next-on-pages")
    const kv = getRequestContext().env.TOKEN_CACHE as KVNamespace | undefined
    const cacheKey = `feishu_app:token:${appId}`

    const tenantAccessToken = await getCachedToken(kv, cacheKey, async () => {
      const res = await fetch(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
        }
      )
      const data = await res.json() as { tenant_access_token?: string; code: number; msg: string }
      if (data.code !== 0 || !data.tenant_access_token) {
        throw new Error(`获取飞书 tenant_access_token 失败: ${data.msg}`)
      }
      return data.tenant_access_token
    })

    const receiveIdType = options.receiveIdType || "open_id"
    let contentStr: string
    if (message.msg_type === "text") {
      contentStr = JSON.stringify({ text: message.content?.text || message.content })
    } else {
      contentStr = typeof message.content === "string" ? message.content : JSON.stringify(message.content)
    }

    const response = await fetch(
      `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tenantAccessToken}`,
        },
        body: JSON.stringify({
          receive_id: message.receive_id,
          msg_type: message.msg_type || "text",
          content: contentStr,
        }),
      }
    )

    const data = await response.json() as { code: number; msg: string }
    if (data.code !== 0) {
      if (data.code === 99991663 || data.code === 99991668) {
        await kv?.delete(cacheKey)
      }
      throw new Error(`飞书应用消息推送失败: ${data.msg}`)
    }

    return response
  }
}
