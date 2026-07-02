import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChannelTable } from "@/components/channel-table"
import { getDb } from "@/lib/db"
import { channels } from "@/lib/db/schema/channels"
import { eq } from "drizzle-orm"
import type { Channel } from "@/lib/channels/metadata"

export const runtime = "edge"

async function getChannels(userId: string) {
  const db = await getDb()
  return db.query.channels.findMany({
    where: eq(channels.userId, userId),
    orderBy: (channels, { desc }) => [desc(channels.createdAt)],
  })
}

export default async function ChannelsPage() {
  const session = await auth()

  const channelList = await getChannels(session!.user!.id!)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">
          渠道管理
        </h1>
        <p className="text-muted-foreground mt-2">
          管理您的推送渠道
        </p>
      </div>

      <Card className="bg-white/50 border-blue-100">
        <CardHeader>
          <CardTitle>推送渠道</CardTitle>
          <CardDescription>
            管理所有的推送渠道
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChannelTable
            channels={channelList as Channel[]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
