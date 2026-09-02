"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateAuction } from "@/hooks/useAuctions"
import { useAuth } from "@/hooks/useAuth"
import { CURRENCY } from "@/lib/config"

const DURATIONS = [
  { label: "1 minute (quick demo)", hours: 1 / 60 },
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
]

const schema = z.object({
  title: z.string().min(3, "Give your drop a title").max(120),
  description: z.string().min(10, "Describe the item in a sentence or two").max(2000),
  imageUrl: z.string().url("Enter a valid image URL").or(z.literal("")),
  startingPrice: z.coerce.number().positive("Starting price must be greater than 0"),
  durationHours: z.coerce.number().positive(),
})

type FormValues = z.infer<typeof schema>

export function CreateAuctionForm(): React.JSX.Element {
  const router = useRouter()
  const { user } = useAuth()
  const createAuction = useCreateAuction()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { durationHours: 24, imageUrl: "" },
  })

  const onSubmit = async (values: FormValues): Promise<void> => {
    if (!user) return
    const endsAt = new Date(Date.now() + values.durationHours * 3600 * 1000).toISOString()
    const created = await createAuction.mutateAsync({
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl,
      startingPrice: values.startingPrice,
      currency: CURRENCY,
      status: "live",
      endsAt,
      sellerId: user.id,
      sellerName: `${user.firstName} ${user.lastName}`.trim(),
    })
    router.push(`/auctions/${created._id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {createAuction.isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not create your drop. Please try again.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Vintage film camera" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} placeholder="Condition, provenance, what makes it special…" {...register("description")} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" placeholder="https://…" {...register("imageUrl")} />
        <p className="text-xs text-muted-foreground">Paste a link to a photo of the item (optional).</p>
        {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startingPrice">Starting price ({CURRENCY})</Label>
          <Input id="startingPrice" type="number" step="0.01" min="0.01" placeholder="10.00" {...register("startingPrice")} />
          {errors.startingPrice && <p className="text-xs text-destructive">{errors.startingPrice.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationHours">Runs for</Label>
          <select
            id="durationHours"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("durationHours")}
          >
            {DURATIONS.map((d) => (
              <option key={d.label} value={d.hours}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={createAuction.isPending}>
        {createAuction.isPending ? "Listing…" : "List drop"}
      </Button>
    </form>
  )
}
