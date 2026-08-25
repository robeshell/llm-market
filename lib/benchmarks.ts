export type BenchmarkKey =
  | "intelligenceIndex"
  | "codingIndex"
  | "agenticIndex"
  | "gpqa"
  | "hle"
  | "scicode"
  | "terminalbench"
  | "lcr";

export const BENCHMARK_META: Record<
  BenchmarkKey,
  { label: string; summary: string }
> = {
  intelligenceIndex: {
    label: "AA 综合",
    summary:
      "Artificial Analysis Intelligence Index：将 Agents（34%）、编程（24%）、科学推理（24%）和通用能力（18%）加权为一项整体能力分，越高越好。",
  },
  codingIndex: {
    label: "Coding",
    summary: "编程相关能力综合分，覆盖写代码、改代码与软件工程类任务。",
  },
  agenticIndex: {
    label: "Agentic",
    summary: "智能体任务能力：多步工具调用、自主规划与完成复杂流程。",
  },
  gpqa: {
    label: "GPQA",
    summary:
      "Graduate-Level Google-Proof Q&A：研究生难度理科问答，侧重深度知识与推理。",
  },
  hle: {
    label: "HLE",
    summary:
      "Humanity's Last Exam：跨学科前沿难题，衡量接近人类专家极限的答题能力。",
  },
  scicode: {
    label: "SciCode",
    summary: "科学计算编程：用代码解决科研/数值与实验相关问题。",
  },
  terminalbench: {
    label: "Terminal",
    summary: "Terminal-Bench：在终端环境中完成命令行与系统操作类任务。",
  },
  lcr: {
    label: "LCR",
    summary:
      "Long Context Reasoning：长文档理解与推理，考察在很长上下文中抓取与综合信息。",
  },
};

export const BENCHMARK_GUIDE = (
  Object.keys(BENCHMARK_META) as BenchmarkKey[]
).map((key) => ({ key, ...BENCHMARK_META[key] }));
