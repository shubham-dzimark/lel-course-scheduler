import React, { useState, useMemo } from "react";
import { Card, Button, Space, Typography, Tag } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";

const { Title, Text } = Typography;

const COURSE_COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#a0d911",
  "#2f54eb",
];

const MonthlyCalendarView = ({ scheduledSessions }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get unique course names and assign colors
  const courseColors = useMemo(() => {
    const uniqueCourses = [
      ...new Set(scheduledSessions.map((s) => s.courseName)),
    ];
    const colorMap = {};
    uniqueCourses.forEach((course, index) => {
      colorMap[course] = COURSE_COLORS[index % COURSE_COLORS.length];
    });
    return colorMap;
  }, [scheduledSessions]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = {};
    scheduledSessions.forEach((session) => {
      const dateKey = format(session.date, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [scheduledSessions]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card className="dashboard-card">
      {/* Calendar Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {format(currentMonth, "MMMM yyyy")}
        </Title>
        <Space>
          <Button onClick={handleToday} icon={<CalendarOutlined />}>
            Today
          </Button>
          <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
          <Button icon={<RightOutlined />} onClick={handleNextMonth} />
        </Space>
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          backgroundColor: "#f0f0f0",
          border: "1px solid #f0f0f0",
        }}
      >
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            style={{
              padding: "12px",
              textAlign: "center",
              fontWeight: 600,
              backgroundColor: "#fafafa",
              borderBottom: "2px solid #d9d9d9",
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday =
            format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={index}
              style={{
                minHeight: "120px",
                padding: "8px",
                backgroundColor: isWeekend ? "#fafafa" : "white",
                opacity: isCurrentMonth ? 1 : 0.4,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Date Number */}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: isToday ? "bold" : "normal",
                  color: isToday
                    ? "#ff6b35"
                    : isCurrentMonth
                    ? "#262626"
                    : "#8c8c8c",
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{format(day, "d")}</span>
                {daySessions.length > 0 && (
                  <span style={{ fontSize: "11px", color: "#8c8c8c" }}>
                    {daySessions.length}
                  </span>
                )}
              </div>

              {/* Sessions */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                {daySessions.slice(0, 4).map((session, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      backgroundColor: courseColors[session.courseName],
                      color: "white",
                      borderRadius: "3px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                    title={`${session.courseName} - ${session.startTime}`}
                  >
                    {session.courseName}
                  </div>
                ))}
                {daySessions.length > 4 && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#8c8c8c",
                      padding: "2px 6px",
                      textAlign: "center",
                    }}
                  >
                    +{daySessions.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "#fafafa",
          borderRadius: "8px",
        }}
      >
        <Text strong style={{ marginBottom: "8px", display: "block" }}>
          Course Legend:
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.entries(courseColors)
            .slice(0, 10)
            .map(([course, color]) => (
              <Tag key={course} color={color} style={{ margin: 0 }}>
                {course}
              </Tag>
            ))}
          {Object.keys(courseColors).length > 10 && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              +{Object.keys(courseColors).length - 10} more courses
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MonthlyCalendarView;
