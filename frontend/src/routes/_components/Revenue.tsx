import { ChartData } from "chart.js";
import { LineChart } from "~/components/ui/charts";

interface RevenueProps {
  revenue: number[];
  year: number;
}

export function Revenue(props: RevenueProps) {
  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const chartData: ChartData = {
    labels,
    datasets: [{ label: "Revenue", data: props.revenue, fill: true }],
  };

  return (
    <div class="max-h-96">
      <LineChart data={chartData} />
    </div>
  );
}
