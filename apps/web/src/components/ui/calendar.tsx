import * as React from "react"
import { DayPicker } from "react-day-picker"
import { zhCN } from "date-fns/locale"
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={zhCN}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-start pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1 absolute right-0 z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground"
        ),
        selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
        today: "border-2 border-primary rounded-md",
        outside:
          "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        footer: "pt-3 border-t mt-3 flex justify-between",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ArrowUp className="h-4 w-4" />
          if (orientation === "right") return <ArrowDown className="h-4 w-4" />
          if (orientation === "up") return <ChevronUp className="h-4 w-4" />
          return <ChevronDown className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
