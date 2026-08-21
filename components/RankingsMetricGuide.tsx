import { BENCHMARK_GUIDE } from "@/lib/benchmarks";

export function RankingsMetricGuide() {
  return (
    <details className="metric-guide">
      <summary>指标说明</summary>
      <dl className="metric-guide-list">
        {BENCHMARK_GUIDE.map((item) => (
          <div key={item.key} className="metric-guide-item">
            <dt>{item.label}</dt>
            <dd>{item.summary}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
