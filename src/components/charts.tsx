"use client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#4b82c3", "#4fd290", "#f59e0b", "#94a3b8"];

export function HoursLine({ data }: { data: { fecha: string; horas: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf2" />
        <XAxis dataKey="fecha" fontSize={11} />
        <YAxis fontSize={11} />
        <Tooltip />
        <Line type="monotone" dataKey="horas" stroke="#4b82c3" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HoursBars({ data }: { data: { name: string; horas: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf2" />
        <XAxis dataKey="name" fontSize={11} />
        <YAxis fontSize={11} />
        <Tooltip />
        <Bar dataKey="horas" fill="#4b82c3" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BillablePie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
