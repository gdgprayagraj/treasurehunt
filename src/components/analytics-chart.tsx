"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

export type ChartDatum = { name: string; completion: number };

/** Bar chart comparing colleges by completion %. Bars use only Google colors. */
export function CompletionChart({ data }: { data: ChartDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No colleges yet — add one to see analytics.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            interval={0}
            angle={data.length > 4 ? -20 : 0}
            textAnchor={data.length > 4 ? "end" : "middle"}
            height={data.length > 4 ? 60 : 30}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Completion"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
          />
          <Bar dataKey="completion" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((_, i) => (
              <Cell key={i} fill={GOOGLE_COLORS[i % GOOGLE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
