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

interface FeishuAppFieldsProps {
  form: UseFormReturn<ChannelFormData>
}

export function FeishuAppFields({ form }: FeishuAppFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="appId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>App ID
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="请输入飞书应用的 App ID" {...field} />
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
            <FormLabel>App Secret
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="请输入飞书应用的 App Secret"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
