"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { ChannelDialog } from "@/components/channel-dialog"
import { Channel, CHANNEL_LABELS } from "@/lib/channels/metadata"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { deleteChannel } from "@/lib/services/channels"

interface ChannelTableProps {
  channels: Channel[]
}

export function ChannelTable({ channels }: ChannelTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [channelsState, setChannels] = useState(channels)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setChannels(channels)
  }, [channels])

  const filteredChannels = channelsState.filter((channel) => {
    if (!searchQuery.trim()) return true

    const searchContent = [
      channel.id,
      channel.name,
      CHANNEL_LABELS[channel.type]
    ].join(" ").toLowerCase()

    const keywords = searchQuery.toLowerCase().split(/\s+/)
    return keywords.every(keyword => searchContent.includes(keyword))
  })

  const handleDelete = async () => {
    if (!channelToDelete) return

    try {
      setIsDeleting(true)
      await deleteChannel(channelToDelete.id)
      toast({ title: '删除成功' })
      router.refresh()
      setChannels(channelsState.filter(c => c.id !== channelToDelete.id))
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting channel:', error)
      toast({
        title: '删除失败',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadgeClass = (status: Channel["status"]) => {
    return status === "active"
      ? "inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
      : "inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
  }

  const getStatusText = (status: Channel["status"]) => {
    return status === "active" ? "正常" : "禁用"
  }

  const getChannelText = (type: Channel["type"]) => {
    return CHANNEL_LABELS[type]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="搜索渠道的名称、链接或备注..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ChannelDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChannels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? "未找到匹配的渠道" : "暂无渠道"}
                </TableCell>
              </TableRow>
            ) : (
              filteredChannels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-mono">{channel.id}</TableCell>
                  <TableCell>{channel.name}</TableCell>
                  <TableCell>{getChannelText(channel.type)}</TableCell>
                  <TableCell>
                    <span className={getStatusBadgeClass(channel.status)}>
                      {getStatusText(channel.status)}
                    </span>
                  </TableCell>
                  <TableCell>{channel.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ChannelDialog
                          mode="edit"
                          channel={channel}
                        />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setChannelToDelete(channel)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除渠道 {channelToDelete?.name} 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
