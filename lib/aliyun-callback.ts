type AliyunCallbackConfig = {
  uid: string
  seed: string
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
