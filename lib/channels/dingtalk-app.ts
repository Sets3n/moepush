import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"
import { getCachedToken } from "../token-cache"
import { getRequestContext } from "@cloudflare/next-on-pages"

export class DingTalkAppChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "dingtalk_app",
    label: "钉钉企业应用",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "通过钉钉工作通知发送文本消息",
        fields: [
          { key: "userid_list", description: "接收人 ID，多人用逗号分隔", required: true },
          { key: "msg.text.content", description: "消息内容", required: true, component: 'textarea' },
          { key: "msg.msgtype", component: 'hidden', defaultValue: "text" },
        ],
      },
      {
        type: "markdown",
        name: "Markdown 消息",
        description: "通过钉钉工作通知发送 Markdown 消息",
        fields: [
          { key: "userid_list", description: "接收人 ID，多人用逗号分隔", required: true },
          { key: "msg.markdown.title", description: "消息标题", required: true },
          { key: "msg.markdown.text", description: "Markdown 内容", required: true, component: 'textarea' },
          { key: "msg.msgtype", component: 'hidden', defaultValue: "markdown" },
        ],
      },
    ]
  }

  async sendMessage(
    message: any,
    options: SendMessageOptions
  ): Promise<Response> {
    const { appKey, appSecret, agentId } = options

    if (!appKey || !appSecret || !agentId) {
      throw new Error("缺少钉钉应用 AppKey、AppSecret 或 AgentId")
    }

    const kv = getRequestContext().env.TOKEN_CACHE as KVNamespace | undefined
    const cacheKey = `dingtalk_app:token:${appKey}`

    const accessToken = await getCachedToken(kv, cacheKey, async () => {
      const res = await fetch(
        `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`
      )
      const data = await res.json() as { access_token?: string; errcode: number; errmsg: string }
      if (data.errcode !== 0 || !data.access_token) {
        throw new Error(`获取钉钉 access_token 失败: ${data.errmsg}`)
      }
      return data.access_token
    })

    const response = await fetch(
      `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: parseInt(agentId),
          userid_list: message.userid_list,
          msg: message.msg,
        }),
      }
    )

    const data = await response.json() as { errcode: number; errmsg: string }
    if (data.errcode !== 0) {
      if (data.errcode === 40014 || data.errcode === 42001) {
        await kv?.delete(cacheKey)
      }
      throw new Error(`钉钉应用消息推送失败: ${data.errmsg}`)
    }

    return response
  }
}
