import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "../utils";

interface RecoveryChartProps {
  data: TrendPoint[];
}

export function RecoveryChart({ data }: RecoveryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Log a few daily entries to see your pain and mobility trends.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            yAxisId="pain"
            domain={[0, 10]}
            tick={{ fontSize: 11 }}
            label={{
              value: "Pain",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="rom"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            label={{
              value: "ROM %",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="pain"
            type="monotone"
            dataKey="pain"
            name="Pain (0–10)"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="rom"
            type="monotone"
            dataKey="romPercent"
            name="ROM exercises %"
            stroke="hsl(160 70% 45%)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
