/** Artificial Analysis 托管的厂商 logo */
export const VENDOR_LOGO_BASE =
  "https://artificialanalysis.ai/img/logos";

/** OpenRouter provider id → AA logo 文件名 */
const PROVIDER_LOGO: Record<string, string> = {
  allenai: "ai2_small.svg",
  amazon: "aws_small.svg",
  anthropic: "anthropic_small.svg",
  "arcee-ai": "arcee_small.svg",
  baidu: "baidu_small.svg",
  bytedance: "bytedance_small.svg",
  "bytedance-seed": "bytedance_small.svg",
  cohere: "cohere_small.svg",
  deepseek: "deepseek_small.svg",
  google: "google_small.svg",
  "ibm-granite": "ibm_small.svg",
  inception: "inceptionlabs_small.svg",
  inclusionai: "inclusionai_small.jpg",
  liquid: "liquidai_small.svg",
  meituan: "longcat_small.svg",
  meta: "meta_small.svg",
  "meta-llama": "meta_small.svg",
  microsoft: "microsoft_small.svg",
  minimax: "minimax_small.svg",
  mistralai: "mistral_small.png",
  moonshotai: "kimi.jpg",
  nex: "nex_small.svg",
  "nex-agi": "nex_small.svg",
  nousresearch: "nousresearch_small.jpg",
  nvidia: "nvidia_small.svg",
  openai: "openai_small.svg",
  perplexity: "perplexity_small.png",
  qwen: "alibaba_small.svg",
  rekaai: "reka_small.svg",
  tencent: "tencent_small.svg",
  "x-ai": "spacexai.svg",
  xai: "spacexai.svg",
  xiaomi: "xiaomi_small.svg",
  zai: "zai_small.svg",
  "z-ai": "zai_small.svg",
};

/** 厂商显示名 → logo（排行兜底） */
const CREATOR_NAME_LOGO: Record<string, string> = {
  "AI21 Labs": "ai21_small.svg",
  AI9Stars: "ai9stars.svg",
  Alibaba: "alibaba_small.svg",
  "Allen Institute for AI": "ai2_small.svg",
  Amazon: "aws_small.svg",
  Anthropic: "anthropic_small.svg",
  "Arcee AI": "arcee_small.svg",
  Baidu: "baidu_small.svg",
  "ByteDance Seed": "bytedance_small.svg",
  Cohere: "cohere_small.svg",
  DeepSeek: "deepseek_small.svg",
  Google: "google_small.svg",
  IBM: "ibm_small.svg",
  Inception: "inceptionlabs_small.svg",
  InclusionAI: "inclusionai_small.jpg",
  Kimi: "kimi.jpg",
  "Liquid AI": "liquidai_small.svg",
  LongCat: "longcat_small.svg",
  Meta: "meta_small.svg",
  Microsoft: "microsoft_small.svg",
  MiniMax: "minimax_small.svg",
  Mistral: "mistral_small.png",
  NVIDIA: "nvidia_small.svg",
  "Nex AGI": "nex_small.svg",
  "Nous Research": "nousresearch_small.jpg",
  OpenAI: "openai_small.svg",
  Perplexity: "perplexity_small.png",
  "Reka AI": "reka_small.svg",
  SpaceXAI: "spacexai.svg",
  Tencent: "tencent_small.svg",
  Xiaomi: "xiaomi_small.svg",
  "Z AI": "zai_small.svg",
};

export function vendorLogoUrl(logoFile: string | null | undefined): string | null {
  if (!logoFile) return null;
  return `${VENDOR_LOGO_BASE}/${logoFile}`;
}

export function logoForProvider(provider: string): string | null {
  const key = provider.trim().toLowerCase();
  return vendorLogoUrl(PROVIDER_LOGO[key]);
}

export function logoForCreator(
  creator: string,
  logoFile?: string | null,
): string | null {
  if (logoFile) return vendorLogoUrl(logoFile);
  return vendorLogoUrl(CREATOR_NAME_LOGO[creator] ?? null);
}
