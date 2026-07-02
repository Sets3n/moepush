import { BaseChannel } from "./base"
import { DingTalkChannel } from "./dingtalk"
import { DingTalkAppChannel } from "./dingtalk-app"
import { WecomChannel } from "./wecom"
import { WecomAppChannel } from "./wecom-app"
import { TelegramChannel } from "./telegram"
import { FeishuChannel } from "./feishu"
import { FeishuAppChannel } from "./feishu-app"
import { DiscordChannel } from "./discord"
import { BarkChannel } from "./bark"
import { WebhookChannel } from "./webhook"
export { CHANNEL_LABELS, CHANNEL_TEMPLATES, CHANNEL_TYPES } from "./metadata"
export type { Channel, ChannelType } from "./metadata"
import { CHANNEL_TYPES, ChannelType } from "./metadata"

// 注册所有渠道
const channels: Record<ChannelType, BaseChannel> = {
  [CHANNEL_TYPES.DINGTALK]: new DingTalkChannel(),
  [CHANNEL_TYPES.DINGTALK_APP]: new DingTalkAppChannel(),
  [CHANNEL_TYPES.WECOM]: new WecomChannel(),
  [CHANNEL_TYPES.WECOM_APP]: new WecomAppChannel(),
  [CHANNEL_TYPES.TELEGRAM]: new TelegramChannel(),
  [CHANNEL_TYPES.FEISHU]: new FeishuChannel(),
  [CHANNEL_TYPES.FEISHU_APP]: new FeishuAppChannel(),
  [CHANNEL_TYPES.DISCORD]: new DiscordChannel(),
  [CHANNEL_TYPES.BARK]: new BarkChannel(),
  [CHANNEL_TYPES.WEBHOOK]: new WebhookChannel(),
}

// 获取指定渠道
export function getChannel(type: ChannelType): BaseChannel {
  return channels[type]
}

// 发送消息
export async function sendChannelMessage(
  type: ChannelType,
  message: any,
  options: any
): Promise<Response> {
  const channel = getChannel(type)
  return channel.sendMessage(message, options)
}
