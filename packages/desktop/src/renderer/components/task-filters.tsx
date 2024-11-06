import { useFilterStore } from '@/renderer/stores/task-filter-store'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'

export function TaskFilters() {
  const { 
    status, 
    search, 
    dateRange,
    setStatus, 
    setSearch, 
    setDateRange,
    getDateRangeLabel
  } = useFilterStore()

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-[200px]"
      />
      
      <Select
        value={status}
        onValueChange={(value: 'all' | 'open' | 'completed') => setStatus(value)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={dateRange}
        onValueChange={(value: typeof dateRange) => setDateRange(value)}
      >
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <SelectValue placeholder="Date range" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7-days">Last 7 days</SelectItem>
          <SelectItem value="14-days">Last 14 days</SelectItem>
          <SelectItem value="30-days">Last 30 days</SelectItem>
          <SelectItem value="3-months">Last 3 months</SelectItem>
          <SelectItem value="1-year">Last year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 