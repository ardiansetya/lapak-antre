import { BellRingIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

/** Static, real-component preview of a customer's ticket. Used on the landing page. */
export function TicketPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <Card className="shadow-xl shadow-primary/10">
        <CardHeader>
          <CardDescription>Klinik Pratama Kasih Ibu, Poli Umum</CardDescription>
          <CardTitle className="font-mono text-6xl font-semibold tracking-tighter">A-017</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Posisi Anda</span>
            <Badge variant="secondary">2 orang lagi</Badge>
          </div>
          <Progress value={72} aria-label="Kemajuan antrean" />
          <Separator />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Sedang dilayani</dt>
              <dd className="font-mono text-lg font-medium">A-015</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Perkiraan</dt>
              <dd className="text-lg font-medium">5-10 menit</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Item
        variant="outline"
        size="sm"
        className="absolute top-[calc(100%-0.75rem)] -left-4 w-64 bg-popover shadow-lg md:-left-14"
      >
        <ItemMedia variant="icon">
          <BellRingIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Giliran Anda sudah dekat</ItemTitle>
          <ItemDescription>Tinggal 2 orang lagi. Silakan menuju klinik.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}
