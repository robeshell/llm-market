import { BENCHMARK_GUIDE } from "@/lib/benchmarks";

export function RankingsMetricGuide() {
  return (
    <details className="metric-guide">
      <summary>综合分和指标说明</summary>
      <p className="metric-guide-intro">
        “AA 综合”不是本站自算分，而是 Artificial Analysis 的 Intelligence Index；它不是简单平均，而是按不同能力加权得到。
        <a
          href="https://artificialanalysis.ai/methodology/intelligence-benchmarking"
          target="_blank"
          rel="noreferrer"
        >
          查看评测方法 →
        </a>
      </p>
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
