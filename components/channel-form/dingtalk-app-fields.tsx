"use client"

import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import type { ChannelFormData } from "@/lib/db/schema/channels"

interface DingTalkAppFieldsProps {
  form: UseFormReturn<ChannelFormData>
}

export function DingTalkAppFields({ form }: DingTalkAppFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="appKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>AppKey
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="请输入钉钉应用的 AppKey" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="secret"
        render={({ field }) => (
          <FormItem>
            <FormLabel>AppSecret
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="请输入钉钉应用的 AppSecret"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="agentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>AgentId
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="请输入钉钉应用的 AgentId" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
