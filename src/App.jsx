import React, { useState } from 'react';
import { Layout, Card, Button, Upload, Select, Statistic, Row, Col, Table, Typography, Space, message, Menu, Tabs } from 'antd';
import { 
  UploadOutlined, 
  CalendarOutlined, 
  FileExcelOutlined, 
  FileWordOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  BarChartOutlined,
  DashboardOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { parseCadenceExcel, generateOutputExcel, downloadExcel } from './utils/excelParser';
import { generateSchedule } from './utils/scheduleEngine';
import { generateReport, downloadReport } from './utils/reportGenerator';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  const quarters = [
    { value: 'Q1', label: 'Q1 (Apr-Jun)' },
    { value: 'Q2', label: 'Q2 (Jul-Sep)' },
    { value: 'Q3', label: 'Q3 (Oct-Dec)' },
    { value: 'Q4', label: 'Q4 (Jan-Mar)' },
  ];

  const currentYear = new Date().getFullYear();
  const financialYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear + i;
    return {
      value: year,
      label: `${year}-${String(year + 1).slice(-2)}`
    };
  });

  const handleFileUpload = (info) => {
    const uploadedFile = info.file.originFileObj || info.file;
    setFile(uploadedFile);
    message.success(`${uploadedFile.name} uploaded successfully`);
  };

  const handleGenerateSchedule = async () => {
    if (!file) {
      message.error('Please upload a cadence file');
      return;
    }
    if (!selectedQuarter || !selectedYear) {
      message.error('Please select both quarter and year');
      return;
    }

    setLoading(true);
    try {
      const courses = await parseCadenceExcel(file);
      const result = generateSchedule(courses, selectedQuarter, selectedYear);
      
      setScheduledSessions(result.scheduledSessions);
      setCalendarData(result.calendarData);
      setStatistics(result.statistics);
      
      message.success('Schedule generated successfully!');
      setActiveTab('schedule');
    } catch (error) {
      message.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!scheduledSessions.length) {
      message.warning('No schedule to download');
      return;
    }

    const blob = generateOutputExcel(scheduledSessions, calendarData, selectedQuarter, selectedYear);
    const filename = `LEL_Schedule_${selectedQuarter}_${selectedYear}.xlsx`;
    downloadExcel(blob, filename);
    message.success('Excel file downloaded');
  };

  const handleDownloadReport = () => {
    if (!statistics) {
      message.warning('No statistics to download');
      return;
    }

    const blob = generateReport(statistics, selectedQuarter, selectedYear);
    const filename = `LEL_Report_${selectedQuarter}_${selectedYear}.docx`;
    downloadReport(blob, filename);
    message.success('Report downloaded');
  };

  const tableColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => format(date, 'EEE, MMM dd, yyyy'),
      sorter: (a, b) => a.date - b.date,
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      filters: [...new Set(scheduledSessions.map(s => s.courseName))].map(name => ({ text: name, value: name })),
      onFilter: (value, record) => record.courseName === value,
    },
    {
      title: 'Session',
      dataIndex: 'sessionNumber',
      key: 'sessionNumber',
      width: 100,
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
  ];

  const renderDashboard = () => (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* Configuration Card */}
      <Card 
        title={<Space><UploadOutlined /><span>Schedule Configuration</span></Space>}
        className="dashboard-card"
      >
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              Upload Cadence File
            </Text>
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={() => false}
              onChange={handleFileUpload}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} size="large">
                Select Excel File
              </Button>
            </Upload>
            {file && (
              <Text type="secondary" style={{ marginLeft: '12px' }}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Text>
            )}
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Quarter</Text>
              <Select
                placeholder="Select Quarter"
                style={{ width: '100%' }}
                size="large"
                value={selectedQuarter || undefined}
                onChange={setSelectedQuarter}
              >
                {quarters.map(q => (
                  <Option key={q.value} value={q.value}>{q.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Financial Year</Text>
              <Select
                placeholder="Select Year"
                style={{ width: '100%' }}
                size="large"
                value={selectedYear || undefined}
                onChange={setSelectedYear}
              >
                {financialYears.map(fy => (
                  <Option key={fy.value} value={fy.value}>{fy.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                onClick={handleGenerateSchedule}
                loading={loading}
                block
                style={{ height: '40px' }}
              >
                Generate Schedule
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Card 
          title={<Space><BarChartOutlined /><span>Statistics Overview</span></Space>}
          className="dashboard-card"
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Total Slots"
                  value={statistics.totalAvailableSlots}
                  prefix={<ClockCircleOutlined />}
                  styles={{ content: { color: '#ff6b35', fontSize: '28px' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Sessions Scheduled"
                  value={statistics.totalScheduledSessions}
                  prefix={<CheckCircleOutlined />}
                  styles={{ content: { color: '#52c41a', fontSize: '28px' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Remaining Slots"
                  value={statistics.slotsAfterScheduling}
                  styles={{ content: { color: '#faad14', fontSize: '28px' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Utilization"
                  value={statistics.utilizationPercentage}
                  suffix="%"
                  precision={2}
                  styles={{ content: { color: '#1890ff', fontSize: '28px' } }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </Space>
  );

  const renderSchedule = () => (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {scheduledSessions.length > 0 ? (
        <>
          <Card 
            title={<Space><CalendarOutlined /><span>Scheduled Sessions ({scheduledSessions.length} total)</span></Space>}
            extra={
              <Space>
                <Button icon={<FileExcelOutlined />} onClick={handleDownloadExcel} style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                  Download Excel
                </Button>
                <Button icon={<FileWordOutlined />} onClick={handleDownloadReport} type="primary">
                  Download Report
                </Button>
              </Space>
            }
            className="dashboard-card"
          >
            <Table
              columns={tableColumns}
              dataSource={scheduledSessions.map((session, idx) => ({ ...session, key: idx }))}
              pagination={{ 
                pageSize: 20, 
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total) => `Total ${total} sessions` 
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </>
      ) : (
        <Card className="empty-state-card">
          <CalendarOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={4} type="secondary">No Schedule Generated</Title>
          <Text type="secondary">Go to Dashboard to generate a schedule</Text>
        </Card>
      )}
    </Space>
  );

  const renderReports = () => (
    <Card className="empty-state-card">
      <FileTextOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
      <Title level={4} type="secondary">Reports</Title>
      <Text type="secondary">Download reports from the Schedule tab after generating a schedule</Text>
    </Card>
  );

  const renderSettings = () => (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* Application Settings */}
      <Card 
        title={<Space><SettingOutlined /><span>Application Settings</span></Space>}
        className="dashboard-card"
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Default Financial Year</Text>
            <Select
              placeholder="Select default year"
              style={{ width: '100%', maxWidth: '300px' }}
              size="large"
              defaultValue={currentYear}
            >
              {financialYears.map(fy => (
                <Option key={fy.value} value={fy.value}>{fy.label}</Option>
              ))}
            </Select>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
              This will be pre-selected when you open the application
            </Text>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Default Quarter</Text>
            <Select
              placeholder="Select default quarter"
              style={{ width: '100%', maxWidth: '300px' }}
              size="large"
              defaultValue="Q1"
            >
              {quarters.map(q => (
                <Option key={q.value} value={q.value}>{q.label}</Option>
              ))}
            </Select>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
              This will be pre-selected when you open the application
            </Text>
          </div>
        </Space>
      </Card>

      {/* Export Settings */}
      <Card 
        title={<Space><FileExcelOutlined /><span>Export Settings</span></Space>}
        className="dashboard-card"
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Excel File Naming</Text>
            <Select
              placeholder="Select naming format"
              style={{ width: '100%', maxWidth: '400px' }}
              size="large"
              defaultValue="quarter_year"
            >
              <Option value="quarter_year">LEL_Schedule_Q1_2025.xlsx</Option>
              <Option value="year_quarter">LEL_Schedule_2025_Q1.xlsx</Option>
              <Option value="date">LEL_Schedule_2025-04-01.xlsx</Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Include Instructor Names</Text>
            <Select
              placeholder="Select option"
              style={{ width: '100%', maxWidth: '400px' }}
              size="large"
              defaultValue="blank"
            >
              <Option value="blank">Leave blank (default)</Option>
              <Option value="placeholder">Use placeholder text</Option>
              <Option value="tbd">Mark as "TBD"</Option>
            </Select>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
              How to handle instructor names in exported files
            </Text>
          </div>
        </Space>
      </Card>

      {/* Display Settings */}
      <Card 
        title={<Space><BarChartOutlined /><span>Display Settings</span></Space>}
        className="dashboard-card"
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Table Page Size</Text>
            <Select
              placeholder="Select default page size"
              style={{ width: '100%', maxWidth: '300px' }}
              size="large"
              defaultValue="20"
            >
              <Option value="10">10 rows per page</Option>
              <Option value="20">20 rows per page</Option>
              <Option value="50">50 rows per page</Option>
              <Option value="100">100 rows per page</Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Date Format</Text>
            <Select
              placeholder="Select date format"
              style={{ width: '100%', maxWidth: '300px' }}
              size="large"
              defaultValue="long"
            >
              <Option value="long">Mon, Jan 06, 2025</Option>
              <Option value="short">01/06/2025</Option>
              <Option value="iso">2025-01-06</Option>
            </Select>
          </div>
        </Space>
      </Card>

      {/* About */}
      <Card 
        title={<Space><FileTextOutlined /><span>About</span></Space>}
        className="dashboard-card"
      >
        <Space orientation="vertical" size="small">
          <Text><Text strong>Application:</Text> LEL Course Scheduler</Text>
          <Text><Text strong>Version:</Text> 1.0.0</Text>
          <Text><Text strong>Purpose:</Text> Automated course scheduling for Leadership Edge Learning</Text>
          <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
            This application helps schedule courses across quarters while respecting time slots, cadences, and special dates.
          </Text>
        </Space>
      </Card>
    </Space>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        width={240}
        className="app-sider"
      >
        <div className="sider-logo">
          {!collapsed ? (
            <>
              <CalendarOutlined style={{ fontSize: '28px', color: '#667eea' }} />
              <Text strong style={{ color: 'white', fontSize: '18px', marginLeft: '12px' }}>LEL Scheduler</Text>
            </>
          ) : (
            <CalendarOutlined style={{ fontSize: '28px', color: '#667eea' }} />
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => setActiveTab(key)}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'schedule', icon: <CalendarOutlined />, label: 'Schedule' },
            { key: 'reports', icon: <FileTextOutlined />, label: 'Reports' },
            { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
          ]}
        />
      </Sider>
      
      <Layout className="app-layout">
        <Header className="app-header">
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'schedule' && 'Course Schedule'}
            {activeTab === 'reports' && 'Reports'}
            {activeTab === 'settings' && 'Settings'}
          </Title>
          <Space>
            <Text style={{ color: 'white', fontSize: '14px' }}>
              {selectedQuarter && selectedYear ? `${selectedQuarter} FY ${selectedYear}-${String(selectedYear + 1).slice(-2)}` : 'No Quarter Selected'}
            </Text>
          </Space>
        </Header>

        <Content className="app-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'schedule' && renderSchedule()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'settings' && renderSettings()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
