'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function LineChart({ data, categories, height = 200 }: { data: number[]; categories: string[]; height?: number }) {
  const options: ApexOptions = {
    chart: { height, type: 'line', zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight' },
    grid: { row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
    xaxis: { categories }
  };
  const series = [{ data }];
  return <Chart options={options} series={series} type="line" height={height} />;
}

export function RadialChart({ value, height = 250 }: { value: number; height?: number }) {
  const options: ApexOptions = {
    chart: { height, type: 'radialBar' },
    plotOptions: { radialBar: { hollow: { size: '70%' }, dataLabels: { name: { show: false }, value: { formatter: (val) => `${val}%` } } } },
    labels: ['Progress']
  };
  const series = [value];
  return <Chart options={options} series={series} type="radialBar" height={height} />;
}

export function BarChart({ data, categories, height = 200 }: { data: number[]; categories: string[]; height?: number }) {
  const options: ApexOptions = {
    chart: { type: 'bar', height },
    plotOptions: { bar: { horizontal: false } },
    dataLabels: { enabled: false },
    xaxis: { categories }
  };
  const series = [{ data }];
  return <Chart options={options} series={series} type="bar" height={height} />;
}