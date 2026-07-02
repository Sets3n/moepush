import type { Channel as DBInferChannel } from "@/lib/db/schema/channels"
import { DingTalkChannel } from "./dingtalk"
import { WecomChannel } from "./wecom"
import { TelegramChannel } from "./telegram"
import { FeishuChannel } from "./feishu"
import { DiscordChannel } from "./discord"
import { BarkChannel } from "./bark"
import { WebhookChannel } from "./webhook"
import { MessageTemplate } from "./base"

export const CHANNEL_TYPES = {
  DINGTALK: "dingtalk",
  DINGTALK_APP: "dingtalk_app",
  WECOM: "wecom",
  WECOM_APP: "wecom_app",
  TELEGRAM: "telegram",
  FEISHU: "feishu",
  FEISHU_APP: "feishu_app",
  DISCORD: "discord",
  BARK: "bark",
  WEBHOOK: "webhook",
} as const

export type ChannelType = typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES]
export type Channel = DBInferChannel & { type: ChannelType }

const clientSafeChannels = {
  [CHANNEL_TYPES.DINGTALK]: new DingTalkChannel(),
  [CHANNEL_TYPES.WECOM]: new WecomChannel(),
  [CHANNEL_TYPES.TELEGRAM]: new TelegramChannel(),
  [CHANNEL_TYPES.FEISHU]: new FeishuChannel(),
  [CHANNEL_TYPES.DISCORD]: new DiscordChannel(),
  [CHANNEL_TYPES.BARK]: new BarkChannel(),
  [CHANNEL_TYPES.WEBHOOK]: new WebhookChannel(),
}

const appChannelLabels = {
  [CHANNEL_TYPES.DINGTALK_APP]: "钉钉企业应用",
  [CHANNEL_TYPES.WECOM_APP]: "企业微信应用",
  [CHANNEL_TYPES.FEISHU_APP]: "飞书企业应用",
}

const appChannelTemplates: Record<
  typeof CHANNEL_TYPES.DINGTALK_APP | typeof CHANNEL_TYPES.WECOM_APP | typeof CHANNEL_TYPES.FEISHU_APP,
  MessageTemplate[]
> = {
  [CHANNEL_TYPES.DINGTALK_APP]: [
    {
      type: "text",
      name: "文本消息",
      description: "通过钉钉工作通知发送文本消息",
      fields: [
        { key: "userid_list", description: "接收人 ID，多人用逗号分隔", required: true },
        { key: "msg.text.content", description: "消息内容", required: true, component: "textarea" },
        { key: "msg.msgtype", component: "hidden", defaultValue: "text" },
      ],
    },
    {
      type: "markdown",
      name: "Markdown 消息",
      description: "通过钉钉工作通知发送 Markdown 消息",
      fields: [
        { key: "userid_list", description: "接收人 ID，多人用逗号分隔", required: true },
        { key: "msg.markdown.title", description: "消息标题", required: true },
        { key: "msg.markdown.text", description: "Markdown 内容", required: true, component: "textarea" },
        { key: "msg.msgtype", component: "hidden", defaultValue: "markdown" },
      ],
    },
  ],
  [CHANNEL_TYPES.WECOM_APP]: [
    {
      type: "text",
      name: "文本消息",
      description: "最基础的消息类型",
      fields: [
        { key: "text.content", description: "消息内容", required: true, component: "textarea" },
        { key: "touser", description: "指定接收消息的成员", component: "input" },
        { key: "toparty", description: "指定接收消息的部门", component: "input" },
        { key: "totag", description: "指定接收消息的标签", component: "input" },
        { key: "safe", description: "是否保密消息", component: "checkbox" },
        { key: "msgtype", component: "hidden", defaultValue: "text" },
      ],
    },
    {
      type: "markdown",
      name: "Markdown消息",
      description: "支持Markdown格式的富文本消息",
      fields: [
        { key: "markdown.content", description: "markdown格式的消息内容", required: true, component: "textarea" },
        { key: "touser", description: "指定接收消息的成员" },
        { key: "toparty", description: "指定接收消息的部门" },
        { key: "totag", description: "指定接收消息的标签" },
        { key: "msgtype", component: "hidden", defaultValue: "markdown" },
      ],
    },
  ],
  [CHANNEL_TYPES.FEISHU_APP]: [
    {
      type: "text",
      name: "文本消息",
      description: "通过飞书应用发送文本消息",
      fields: [
        { key: "receive_id", description: "接收者 ID（open_id/user_id/chat_id）", required: true },
        { key: "content.text", description: "消息内容", required: true, component: "textarea" },
        { key: "msg_type", component: "hidden", defaultValue: "text" },
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
          component: "textarea",
        },
        { key: "msg_type", component: "hidden", defaultValue: "post" },
      ],
    },
  ],
}

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  ...Object.fromEntries(
    Object.entries(clientSafeChannels).map(([type, channel]) => [type, channel.getLabel()])
  ),
  ...appChannelLabels,
} as Record<ChannelType, string>

export const CHANNEL_TEMPLATES: Record<ChannelType, MessageTemplate[]> = {
  ...Object.fromEntries(
    Object.entries(clientSafeChannels).map(([type, channel]) => [type, channel.getTemplates()])
  ),
  ...appChannelTemplates,
} as Record<ChannelType, MessageTemplate[]>
