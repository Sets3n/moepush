"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Endpoint } from "@/lib/db/schema/endpoints"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateExampleBody } from "@/lib/generator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface EndpointExampleProps {
  endpoint: Endpoint | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EndpointExampleContentProps {
  endpoint: Endpoint
}

function EndpointExampleContent({ endpoint }: EndpointExampleContentProps) {
  const [aliyunUid, setAliyunUid] = useState("")
  const [aliyunSeed, setAliyunSeed] = useState("")
  const [origin, setOrigin] = useState("https://n.ryouok.cn")
  const { toast } = useToast()

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const exampleBody = generateExampleBody(endpoint.rule)
  const exampleJson = JSON.stringify(exampleBody, null, 6)

  const aliyunCallbackUrl = useMemo(() => {
    const url = new URL(`${origin}/api/callback/aliyun/${endpoint.id}`)
    if (aliyunUid) url.searchParams.set("uid", aliyunUid)
    if (aliyunSeed) url.searchParams.set("seed", aliyunSeed)
    return url.toString()
  }, [origin, endpoint.id, aliyunUid, aliyunSeed])

  const curlExample = `curl -X POST "${origin}/api/push/${endpoint.id}" \\
  -H "Content-Type: application/json" \\
  -d '${exampleJson}'`

  const fetchExample = `await fetch("${origin}/api/push/${endpoint.id}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(${exampleJson})
})`

  const aliyunCurlExample = `curl -X POST "${aliyunCallbackUrl}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "checksum=<阿里云生成的checksum>" \\
  -d "content=<阿里云回调content>"`

  async function copyAliyunCallbackUrl() {
    await navigator.clipboard.writeText(aliyunCallbackUrl)
    toast({ description: "阿里云回调地址已复制" })
  }

  return (
    <Tabs defaultValue="curl" className="mt-4">
      <TabsList>
        <TabsTrigger value="curl">cURL</TabsTrigger>
        <TabsTrigger value="fetch">Fetch</TabsTrigger>
        <TabsTrigger value="aliyun">阿里云回调</TabsTrigger>
      </TabsList>
      <TabsContent value="curl" className="mt-4">
        <div className="rounded-lg bg-muted p-4">
          <pre className="text-sm whitespace-pre-wrap break-all font-mono">
            {curlExample}
          </pre>
        </div>
      </TabsContent>
      <TabsContent value="fetch" className="mt-4">
        <div className="rounded-lg bg-muted p-4">
          <pre className="text-sm whitespace-pre-wrap break-all font-mono">
            {fetchExample}
          </pre>
        </div>
      </TabsContent>
      <TabsContent value="aliyun" className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="aliyun-uid">阿里云账号 UID</Label>
            <Input
              id="aliyun-uid"
              value={aliyunUid}
              onChange={(event) => setAliyunUid(event.target.value.trim())}
              placeholder="例如 123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliyun-seed">Seed</Label>
            <Input
              id="aliyun-seed"
              value={aliyunSeed}
              onChange={(event) => setAliyunSeed(event.target.value.trim())}
              placeholder="阿里云通知配置中的 seed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>回调地址</Label>
          <div className="flex gap-2">
            <Input readOnly value={aliyunCallbackUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyAliyunCallbackUrl}
              aria-label="复制阿里云回调地址"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <pre className="text-sm whitespace-pre-wrap break-all font-mono">
            {aliyunCurlExample}
          </pre>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export function EndpointExample({ endpoint, open, onOpenChange }: EndpointExampleProps) {
  if (!endpoint) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>接口示例</DialogTitle>
          <DialogDescription>
            查看接口调用示例和依赖的变量
          </DialogDescription>
        </DialogHeader>

        <EndpointExampleContent endpoint={endpoint} />
      </DialogContent>
    </Dialog>
  )
}
