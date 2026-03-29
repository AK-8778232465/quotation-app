import { useMemo } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { formatCurrency } from '../utils/quotationHelpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function buildLineData(groupedEntries) {
  return {
    labels: groupedEntries.map((group) => group.label),
    datasets: [
      {
        label: 'Amount by date',
        data: groupedEntries.map((group) => group.total),
        borderColor: '#c95f2d',
        backgroundColor: 'rgba(201, 95, 45, 0.18)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
}

function buildBarData(entries) {
  const usageMap = entries.reduce((accumulator, entry) => {
    accumulator[entry.equipment] = (accumulator[entry.equipment] || 0) + Number(entry.quantity || 0);
    return accumulator;
  }, {});

  const topEquipment = Object.entries(usageMap)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 6);

  return {
    labels: topEquipment.map(([equipment]) => equipment),
    datasets: [
      {
        label: 'Equipment usage',
        data: topEquipment.map(([, quantity]) => quantity),
        backgroundColor: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#c95f2d', '#8a5a44'],
        borderRadius: 12,
      },
    ],
  };
}

function getMonthlyTotal(entries) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  return entries
    .filter((entry) => entry.date.startsWith(thisMonth))
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
}

function AnalyticsDashboard({ entries, groupedEntries }) {
  const monthlyTotal = getMonthlyTotal(entries);
  const sharedOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 200,
      animation: false,
      plugins: {
        legend: { display: false },
      },
    }),
    []
  );
  const lineData = useMemo(() => buildLineData(groupedEntries), [groupedEntries]);
  const barData = useMemo(() => buildBarData(entries), [entries]);

  return (
    <div className="dashboard-grid">
      <section className="panel chart-box">
        <h2>Trend by date</h2>
        <p className="panel-subtitle">Track how quotation value moves across your work days.</p>
        {groupedEntries.length ? (
          <div className="chart-stage">
            <Line data={lineData} options={sharedOptions} redraw={false} />
          </div>
        ) : (
          <div className="chart-empty">Add entries to see the daily amount trend.</div>
        )}
      </section>

      <section className="panel chart-box">
        <h2>Equipment usage</h2>
        <p className="panel-subtitle">Top equipment based on entered quantity.</p>
        {entries.length ? (
          <div className="chart-stage">
            <Bar data={barData} options={sharedOptions} redraw={false} />
          </div>
        ) : (
          <div className="chart-empty">Usage analytics will appear once entries are saved.</div>
        )}
      </section>

      <section className="panel">
        <h2>Monthly total</h2>
        <p className="panel-subtitle">Current month quotation amount.</p>
        <strong style={{ fontSize: '2rem', display: 'block' }}>{formatCurrency(monthlyTotal)}</strong>
      </section>

      <section className="panel">
        <h2>Quick help</h2>
        <p className="panel-subtitle">
          Repeat the same equipment name to reuse the earlier rate and description with much less typing.
        </p>
      </section>
    </div>
  );
}

export default AnalyticsDashboard;
