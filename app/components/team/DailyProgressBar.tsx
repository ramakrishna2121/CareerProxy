'use client'

interface DailyProgressBarProps {
  candidateId: string
  todayCount: number
  dailyLimit: number | null
}

export default function DailyProgressBar({
  candidateId: _candidateId,
  todayCount,
  dailyLimit,
}: DailyProgressBarProps) {
  const isUnlimited = dailyLimit === null

  const percentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((todayCount / (dailyLimit as number)) * 100))

  const barColor =
    percentage >= 100
      ? 'bg-red-500'
      : percentage >= 75
      ? 'bg-yellow-500'
      : 'bg-indigo-500'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">Today&apos;s Applications</span>
        <span className="text-xs font-semibold text-gray-700">
          {isUnlimited ? `${todayCount} / Unlimited` : `${todayCount} / ${dailyLimit}`}
        </span>
      </div>
      {isUnlimited ? (
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-300"
            style={{ width: todayCount > 0 ? '100%' : '0%' }}
          />
        </div>
      ) : (
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {!isUnlimited && percentage >= 100 && (
        <p className="text-xs text-red-600 mt-1 font-medium">Daily limit reached</p>
      )}
    </div>
  )
}
