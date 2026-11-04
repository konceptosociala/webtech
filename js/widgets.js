import _ from 'lodash';
import dayjs from 'dayjs';
import { nextBirthday, sortUsers } from './users.js';

// MAP

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAP_ZOOM = 4;

export const createTeacherMap = (container, { latitude, longitude }, title) => {
  const position = [Number(latitude), Number(longitude)];
  const map = L.map(container).setView(position, MAP_ZOOM);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
  L.marker(position, { title, alt: title }).addTo(map);
  return map;
};

// PIE CHART

const SLICE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7'];
const OTHER_COLOR = '#b5b3ab';
const CHART_FONT = { family: "'PT Sans', Arial, sans-serif", size: 14 };
export const MAX_SLICES = SLICE_COLORS.length + 1;

const percent = (count, total) => Math.round((count / total) * 100);

const legendLabels = (chart) => {
  const { data } = chart.data.datasets[0];
  return Chart.overrides.pie.plugins.legend.labels.generateLabels(chart)
    .map((item) => ({ ...item, text: `${item.text} · ${data[item.index]}` }));
};

const createPieChart = (canvas) => new Chart(canvas, {
  type: 'pie',
  data: { labels: [], datasets: [{ data: [], borderColor: '#fff', borderWidth: 2, hoverOffset: 8 }] },
  options: {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: legendLabels, usePointStyle: true, pointStyle: 'circle', color: '#222', padding: 14, font: CHART_FONT,
        },
      },
      tooltip: {
        titleFont: { ...CHART_FONT, weight: 'bold' },
        bodyFont: CHART_FONT,
        callbacks: {
          label: ({ raw, dataset }) => ` ${raw} teachers (${percent(raw, _.sum(dataset.data))}%)`,
        },
      },
    },
  },
});

export const renderPieChart = (canvas, groups) => {
  const chart = Chart.getChart(canvas) ?? createPieChart(canvas);
  const [dataset] = chart.data.datasets;
  chart.data.labels = _.map(groups, 'label');
  dataset.data = _.map(groups, 'count');
  dataset.backgroundColor = groups.map((group, index) => (group.other ? OTHER_COLOR : SLICE_COLORS[index]));
  chart.options.plugins.legend.position = window.matchMedia('(max-width: 767px)').matches ? 'bottom' : 'right';
  chart.update();
};

// REPORTS

const REPORT_FIELDS = {
  full_name: { type: 'string', caption: 'Name' },
  course: { type: 'string', caption: 'Speciality' },
  age: { type: 'number', caption: 'Age' },
  gender: { type: 'string', caption: 'Gender' },
  country: { type: 'string', caption: 'Country' },
  city: { type: 'string', caption: 'City' },
  b_date: { type: 'date string', caption: 'Birthday' },
  birthday_in: { type: 'number', caption: 'Days to birthday' },
  email: { type: 'string', caption: 'Email' },
  phone: { type: 'string', caption: 'Phone' },
};
const FLAT_COLUMNS = ['full_name', 'course', 'age', 'gender', 'country', 'city', 'b_date', 'birthday_in', 'email', 'phone'];
const NUMBER_COLUMNS = ['age', 'birthday_in'];
const REPORT_HEIGHT = 520;
const REPORT_OPTIONS = { configuratorButton: false, showAggregationLabels: false };

const toReportRow = (teacher) => ({
  ..._.pick(teacher, _.keys(REPORT_FIELDS)),
  b_date: teacher.b_date ? dayjs(teacher.b_date).format('YYYY-MM-DD') : undefined,
  birthday_in: nextBirthday(teacher.b_date)?.days,
});

const dataSource = (teachers) => ({
  data: [REPORT_FIELDS, ..._.map(sortUsers(teachers, 'full_name'), toReportRow)],
});

const REPORTS = {
  countries: (teachers) => ({
    dataSource: dataSource(teachers),
    slice: {
      rows: [{ uniqueName: 'country' }],
      columns: [{ uniqueName: 'Measures' }],
      measures: [
        { uniqueName: 'full_name', aggregation: 'count', caption: 'Teachers' },
        { uniqueName: 'course', aggregation: 'distinctcount', caption: 'Specialities' },
        { uniqueName: 'age', aggregation: 'average', caption: 'Average age', format: 'decimal' },
      ],
    },
    formats: [{ name: 'decimal', decimalPlaces: 1 }],
    options: { ...REPORT_OPTIONS, grid: { type: 'compact', showHeaders: false } },
  }),
  teachers: (teachers) => ({
    dataSource: dataSource(teachers),
    slice: {
      rows: _.difference(FLAT_COLUMNS, NUMBER_COLUMNS).map((uniqueName) => ({ uniqueName })),
      measures: NUMBER_COLUMNS.map((uniqueName) => ({ uniqueName, aggregation: 'sum', format: 'integer' })),
      flatOrder: FLAT_COLUMNS,
    },
    formats: [{ name: 'integer', decimalPlaces: 0, thousandsSeparator: '' }],
    options: {
      ...REPORT_OPTIONS,
      datePattern: 'dd/MM/yyyy',
      grid: { type: 'flat', showHeaders: false, showTotals: 'off', showGrandTotals: 'off' },
    },
  }),
};

const reports = new WeakMap();

export const renderReport = (container, view, teachers) => {
  const current = reports.get(container);
  if (current?.view === view && current.teachers === teachers) return;

  const report = REPORTS[view](teachers);
  const pivot = current?.pivot ?? new WebDataRocks({
    container, toolbar: false, width: '100%', height: REPORT_HEIGHT, report,
  });
  if (current) pivot.setReport(report);
  reports.set(container, { pivot, view, teachers });
};
