type AliyunCallbackConfig = {
  uid: string
  seed: string
}

type AliyunScanResult = {
  suggestion?: string
  taskId?: string
  dataId?: string
  url?: string
  results?: Array<{
    suggestion?: string
    label?: string
    scene?: string
    rate?: number
  }>
}

type AliyunAuditResult = {
  suggestion?: string
  taskId?: string
  dataId?: string
  labels?: string[]
}

type AliyunCallbackContent = {
  scanResult?: AliyunScanResult
  auditResult?: AliyunAuditResult
  humanAuditResult?: AliyunAuditResult
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export async function parseAliyunCallbackForm(
  form: URLSearchParams | FormData,
  config: AliyunCallbackConfig
) {
  const checksum = form.get("checksum")
  const content = form.get("content")

  if (typeof checksum !== "string" || !checksum) {
    throw new Error("Missing aliyun callback checksum")
  }

  if (typeof content !== "string" || !content) {
    throw new Error("Missing aliyun callback content")
  }

  const expectedChecksum = await sha256Hex(`${config.uid}${config.seed}${content}`)
  if (checksum.toLowerCase() !== expectedChecksum) {
    throw new Error("Invalid aliyun callback checksum")
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error("Invalid aliyun callback content JSON")
  }
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

export function formatAliyunCallbackMessage(content: unknown) {
  const callback = content as AliyunCallbackContent
  const lines = ["阿里云内容安全通知"]

  if (callback.scanResult) {
    const scan = callback.scanResult
    const suggestions = unique([
      scan.suggestion,
      ...(scan.results ?? []).map((result) => result.suggestion),
    ])
    const labels = unique([
      ...(scan.results ?? []).map((result) => result.label),
      ...(scan.results ?? []).map((result) => result.scene),
    ])

    lines.push("")
    lines.push(`扫描结果：${suggestions.join(", ") || "未知"}`)
    if (scan.taskId) lines.push(`任务ID：${scan.taskId}`)
    if (scan.dataId) lines.push(`内容ID：${scan.dataId}`)
    if (scan.url) lines.push(`URL：${scan.url}`)
    if (labels.length > 0) lines.push(`标签：${labels.join(", ")}`)
  }

  if (callback.auditResult) {
    lines.push("")
    lines.push(`自助审核：${callback.auditResult.suggestion || "未知"}`)
    if (callback.auditResult.labels?.length) {
      lines.push(`标签：${callback.auditResult.labels.join(", ")}`)
    }
  }

  if (callback.humanAuditResult) {
    lines.push("")
    lines.push(`人工审核：${callback.humanAuditResult.suggestion || "未知"}`)
    if (callback.humanAuditResult.taskId) {
      lines.push(`任务ID：${callback.humanAuditResult.taskId}`)
    }
    if (callback.humanAuditResult.dataId) {
      lines.push(`内容ID：${callback.humanAuditResult.dataId}`)
    }
    if (callback.humanAuditResult.labels?.length) {
      lines.push(`标签：${callback.humanAuditResult.labels.join(", ")}`)
    }
  }

  if (lines.length === 1) {
    lines.push("")
    lines.push(`原始内容：${JSON.stringify(content, null, 2)}`)
  }

  return lines.join("\n")
}
