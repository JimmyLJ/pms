import * as React from "react"
import { format, addMonths, subMonths, isWeekend, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, getDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronUp, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = "年/月/日" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const selectedDate = value ? new Date(value) : undefined

  const handleSelect = (date: Date) => {
    onChange?.(format(date, "yyyy-MM-dd"))
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.("")
    setOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    onChange?.(format(today, "yyyy-MM-dd"))
    setCurrentMonth(today)
    setOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ["一", "二", "三", "四", "五", "六", "日"]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          <span className="flex-1">
            {value ? format(new Date(value), "yyyy/MM/dd") : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">
              {format(currentMonth, "yyyy年MM月", { locale: zhCN })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-accent rounded"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-accent rounded"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-sm py-1",
                  index >= 5 ? "text-blue-600" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isTodayDate = isToday(day)
              const isWeekendDay = isWeekend(day)
              const dayOfWeek = getDay(day)
              const isSaturday = dayOfWeek === 6
              const isSunday = dayOfWeek === 0

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-8 w-8 text-sm rounded flex items-center justify-center mx-auto",
                    "hover:bg-accent transition-colors",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isCurrentMonth && (isSaturday || isSunday) && "text-blue-600",
                    isTodayDate && !isSelected && "border-2 border-blue-600",
                    isSelected && "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              清除
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              今天
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
