import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface CountRecord {
  _id: string
  count: number
}

interface UserStats {
  total: number
  institution: CountRecord[]
  designation: CountRecord[]
  status: CountRecord[]
  profession: CountRecord[]
  department: CountRecord[]
  year: CountRecord[]
  gender: CountRecord[]
  age: CountRecord[]
  profileDetails: Array<{ _id: boolean; count: number }>
}

interface ChartRecord extends CountRecord {
  percentage: number
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#64748b']
const AGE_ORDER = ['6-12', '13-18', '19-25', '25-40', '41-50', '51-65', '65+', 'Blank']

const emptyStats: UserStats = {
  total: 0,
  institution: [],
  designation: [],
  status: [],
  profession: [],
  department: [],
  year: [],
  gender: [],
  age: [],
  profileDetails: []
}

const toChartData = (records: CountRecord[], total: number, labels?: string[]): ChartRecord[] => {
  const counts = new Map(records.map(({ _id, count }) => [_id || 'Blank', count]))
  const categories = labels ?? [...new Set([...counts.keys(), 'Blank'])]

  return categories.map((_id) => {
    const count = counts.get(_id) ?? 0
    return { _id, count, percentage: total ? (count / total) * 100 : 0 }
  }).sort((a, b) => {
    if (labels) return labels.indexOf(a._id) - labels.indexOf(b._id)
    if (a._id === 'Blank') return 1
    if (b._id === 'Blank') return -1
    return b.count - a.count || a._id.localeCompare(b._id)
  })
}

const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`

const ChartTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: ChartRecord }>
}) => {
  if (!active || !payload?.length) return null
  const { _id, count, percentage } = payload[0].payload

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="font-semibold text-slate-900 dark:text-white">{_id}</p>
      <p className="text-slate-600 dark:text-slate-300">{count} users ({formatPercentage(percentage)})</p>
    </div>
  )
}

const Stats = () => {
  const [stats, setStats] = useState<UserStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/General/userDemographicStats')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to load user statistics')
        setStats(result as UserStats)
      } catch (loadError) {
        console.error('Error loading user statistics:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load user statistics')
      } finally {
        setLoading(false)
      }
    }

    void loadStats()
  }, [])

  const chartData = useMemo(() => ({
    institution: toChartData(stats.institution, stats.total),
    designation: toChartData(stats.designation, stats.total),
    status: toChartData(stats.status, stats.total),
    profession: toChartData(stats.profession, stats.total),
    department: toChartData(stats.department, stats.total),
    year: toChartData(stats.year, stats.total),
    gender: toChartData(stats.gender, stats.total),
    age: toChartData(stats.age, stats.total, AGE_ORDER)
  }), [stats])

  const usersWithDetails = stats.profileDetails.find(({ _id }) => _id)?.count ?? 0
  const completedFields = [
    stats.institution,
    stats.designation,
    stats.status,
    stats.profession,
    stats.department,
    stats.year,
    stats.gender,
    stats.age
  ].reduce((sum, records) =>
    sum + records.reduce((filled, record) => filled + (record._id === 'Blank' ? 0 : record.count), 0), 0)
  const fieldCompletion = stats.total ? (completedFields / (stats.total * 8)) * 100 : 0

  const renderDonut = (title: string, description: string, data: ChartRecord[]) => (
    <section className="glass-card p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="h-56 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="_id" innerRadius="58%" outerRadius="88%" paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry._id} fill={entry._id === 'Blank' ? '#94a3b8' : COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2">
          {data.map((entry, index) => (
            <li key={entry._id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry._id === 'Blank' ? '#94a3b8' : COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{entry._id}</span>
              </span>
              <span className="shrink-0 font-medium text-slate-900 dark:text-white">
                {entry.count} <span className="text-slate-500 dark:text-slate-400">({formatPercentage(entry.percentage)})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )

  const renderBar = (title: string, description: string, data: ChartRecord[]) => (
    <section className="glass-card p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-5" style={{ height: Math.max(220, data.length * 42) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} stroke="#64748b" />
            <YAxis
              type="category"
              dataKey="_id"
              width={170}
              tick={{ fill: '#64748b', fontSize: 12 }}
              interval={0}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="percentage" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {data.map((entry) => (
                <Cell key={entry._id} fill={entry._id === 'Blank' ? '#94a3b8' : '#4f46e5'} />
              ))}
              <LabelList
                dataKey="percentage"
                position="right"
                formatter={(value) => typeof value === 'number' ? formatPercentage(value) : ''}
                fill="#64748b"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <header className="space-y-4 text-center">
        <h1 className="section-header">Statistics</h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
          An overview of the optional profile information shared by our users.
        </p>
      </header>

      {error ? (
        <div role="alert" className="glass-card p-8 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : loading ? (
        <div className="glass-card p-8 text-center text-slate-600 dark:text-slate-300" role="status">
          Loading user statistics...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total users</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All registered accounts are included.</p>
            </div>
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Users with profile details</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {usersWithDetails.toLocaleString()}
                <span className="ml-2 text-base font-medium text-slate-500 dark:text-slate-400">
                  ({formatPercentage(stats.total ? (usersWithDetails / stats.total) * 100 : 0)})
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">At least one optional profile field is filled.</p>
            </div>
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Optional fields completed</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatPercentage(fieldCompletion)}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Across institution, role, status, profession, department, year, gender and age.</p>
            </div>
          </section>

          {stats.total === 0 ? (
            <div className="glass-card p-8 text-center text-slate-600 dark:text-slate-300">
              No user data is available yet.
            </div>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-2">
                {renderDonut('Designation', 'Distribution across all users, including blank profiles.', chartData.designation)}
                {renderDonut('Gender', 'Distribution across all users, including blank profiles.', chartData.gender)}
              </section>
              <section className="grid gap-6 lg:grid-cols-2">
                {renderBar('Department', 'Share of all users by department. Blank values are included.', chartData.department)}
                {renderBar('Institution', 'Share of all users by institution. Blank values are included.', chartData.institution)}
                {chartData.profession.some(({ _id }) => _id !== 'Blank') &&
                  renderBar('Profession', 'Share of all users by profession. Blank values are included.', chartData.profession)}
                {renderBar('Year', 'Share of all users by year. Blank values are included.', chartData.year)}
                {renderBar('Age', 'Share of all users by age range. Blank values are included.', chartData.age)}
                {renderBar('Status', 'Share of all users by profile status. Blank values are included.', chartData.status)}
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Stats
