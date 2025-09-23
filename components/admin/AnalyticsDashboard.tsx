// components/admin/AnalyticsDashboard.tsx
'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsDashboard() {
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [departmentStats, setDepartmentStats] = useState<any[]>([])
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    // Fetch attendance trends
    const { data: trends } = await supabase
      .from('attendance')
      .select(`
        marked_at,
        students!inner(department)
      `)
      .gte('marked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Process data for charts
    const dailyData = processDailyAttendance(trends || [])
    setAttendanceData(dailyData)

    // Department statistics
    const deptStats = calculateDepartmentStats(trends || [])
    setDepartmentStats(deptStats)

    // At-risk students (<75% attendance)
    const riskStudents = await findAtRiskStudents()
    setAtRiskStudents(riskStudents)
  }

  const processDailyAttendance = (data: any[]) => {
    // Implementation for processing daily attendance data
    return [] // Simplified for brevity
  }

  const calculateDepartmentStats = (data: any[]) => {
    // Implementation for department statistics
    return [] // Simplified for brevity
  }

  const findAtRiskStudents = async () => {
    const { data } = await supabase
      .rpc('get_at_risk_students', { threshold: 75 })
    return data || []
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-semibold mb-4">Attendance Trends (30 days)</h4>
          <LineChart width={400} height={300} data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="present" stroke="#0088FE" />
          </LineChart>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-semibold mb-4">Department Distribution</h4>
          <PieChart width={400} height={300}>
            <Pie data={departmentStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
              {departmentStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4">At-Risk Students (&lt;75% Attendance)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {atRiskStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600">{student.attendance_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}