import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Typography,
  Space,
  Statistic,
} from "antd";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const COLORS = [
  "#ff6b35",
  "#f7931e",
  "#ff4757",
  "#ffa502",
  "#ff6348",
  "#ff7979",
  "#ffbe76",
  "#ff6b81",
];

const AnalyticsDashboard = ({ scheduledSessions }) => {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  // Filter sessions based on selections
  const filteredSessions = useMemo(() => {
    let filtered = [...scheduledSessions];

    if (selectedCourse !== "all") {
      filtered = filtered.filter((s) => s.courseName === selectedCourse);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const [start, end] = dateRange;
      filtered = filtered.filter((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= start.toDate() && sessionDate <= end.toDate();
      });
    }

    return filtered;
  }, [scheduledSessions, selectedCourse, dateRange]);

  // Get unique courses for filter
  const courses = useMemo(() => {
    return ["all", ...new Set(scheduledSessions.map((s) => s.courseName))];
  }, [scheduledSessions]);

  // Sessions by course (for pie chart)
  const sessionsByCourse = useMemo(() => {
    const counts = filteredSessions.reduce((acc, session) => {
      acc[session.courseName] = (acc[session.courseName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 courses
  }, [filteredSessions]);

  // Sessions by day of week (for bar chart)
  const sessionsByDayOfWeek = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const counts = filteredSessions.reduce((acc, session) => {
      const day = format(session.date, "EEEE");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return days.map((day) => ({ day, sessions: counts[day] || 0 }));
  }, [filteredSessions]);

  // Sessions over time (for line chart)
  const sessionsOverTime = useMemo(() => {
    const byDate = filteredSessions.reduce((acc, session) => {
      const dateKey = format(session.date, "MMM dd");
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(byDate)
      .map(([date, count]) => ({ date, sessions: count }))
      .slice(0, 30); // Limit to 30 data points
  }, [filteredSessions]);

  // Sessions by time slot (for bar chart)
  const sessionsByTimeSlot = useMemo(() => {
    const timeSlots = filteredSessions.reduce((acc, session) => {
      const slot = session.startTime;
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(timeSlots)
      .map(([time, count]) => ({ time, sessions: count }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredSessions]);

  // Statistics
  const stats = useMemo(() => {
    const uniqueCourses = new Set(filteredSessions.map((s) => s.courseName))
      .size;
    const uniqueDates = new Set(
      filteredSessions.map((s) => format(s.date, "yyyy-MM-dd"))
    ).size;
    const avgPerDay =
      uniqueDates > 0 ? (filteredSessions.length / uniqueDates).toFixed(1) : 0;

    return {
      totalSessions: filteredSessions.length,
      uniqueCourses,
      uniqueDates,
      avgPerDay,
    };
  }, [filteredSessions]);

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Filters */}
      <Card
        title={
          <Space>
            <FilterOutlined />
            <span>Filters</span>
          </Space>
        }
        className="dashboard-card"
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Text strong style={{ display: "block", marginBottom: "8px" }}>
              Course
            </Text>
            <Select
              style={{ width: "100%" }}
              value={selectedCourse}
              onChange={setSelectedCourse}
              size="large"
            >
              <Option value="all">All Courses</Option>
              {courses
                .filter((c) => c !== "all")
                .map((course) => (
                  <Option key={course} value={course}>
                    {course}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Text strong style={{ display: "block", marginBottom: "8px" }}>
              Date Range
            </Text>
            <RangePicker
              style={{ width: "100%" }}
              onChange={setDateRange}
              size="large"
            />
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              styles={{ content: { color: "#ff6b35", fontSize: "28px" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Unique Courses"
              value={stats.uniqueCourses}
              styles={{ content: { color: "#f7931e", fontSize: "28px" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Days with Sessions"
              value={stats.uniqueDates}
              styles={{ content: { color: "#ff4757", fontSize: "28px" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Avg Sessions/Day"
              value={stats.avgPerDay}
              styles={{ content: { color: "#ffa502", fontSize: "28px" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <PieChartOutlined />
                <span>Sessions by Course</span>
              </Space>
            }
            className="dashboard-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sessionsByCourse}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sessionsByCourse.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>Sessions by Day of Week</span>
              </Space>
            }
            className="dashboard-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionsByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#ff6b35" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                <span>Sessions Over Time</span>
              </Space>
            }
            className="dashboard-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sessionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#ff6b35"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>Sessions by Time Slot</span>
              </Space>
            }
            className="dashboard-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionsByTimeSlot}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#f7931e" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default AnalyticsDashboard;
