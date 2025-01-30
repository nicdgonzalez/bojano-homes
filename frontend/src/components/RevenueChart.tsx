import { ChartData } from "chart.js";
import { Box } from "./Box";
import { LineChart } from "./ui/charts";
import { H3, Paragraph } from "./Text";

interface RevenueChartProps {
  revenue: number[];
  year: number;
}

export function RevenueChart(props: RevenueChartProps) {
  const chartData: ChartData = {
    labels: [
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
    ],
    datasets: [
      {
        label: "Revenue",
        data: props.revenue,
        fill: true,
      },
    ],
  };

  return (
    <Box>
      <H3>Revenue</H3>
      <Paragraph>
        Overview of this property's annual revenue for {props.year}.
      </Paragraph>
      <div class="max-h-96">
        <LineChart height={512} data={chartData} />
      </div>
    </Box>
  );
}
