/**
 * ResearchNest Mock Data (Stage 1 Dashboard Visual Prototype)
 *
 * NOTE: These sample papers represent real, landmark scientific publications
 * used strictly for visual prototype demonstration. Metrics (such as citation
 * counts and progress indicators) are sample values for layout review and are
 * not live telemetry or connected to real backend APIs.
 */

export const DEMO_DISCLAIMER =
  "Prototype preview · Sample curated papers and activity metrics for layout evaluation.";

export const trendingTopics = [
  { id: "ai", label: "Artificial Intelligence", color: "purple" },
  { id: "ml", label: "Machine Learning", color: "blue" },
  { id: "climate", label: "Climate Science", color: "green" },
  { id: "neuro", label: "Neuroscience", color: "peach" },
  { id: "quantum", label: "Quantum Computing", color: "lavender" },
];

export const mockPapers = [
  {
    id: "paper-1",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    field: "Natural Language Processing",
    fieldId: "ai",
    authors: "Patrick Lewis, Ethan Perez, et al.",
    venue: "NeurIPS",
    year: 2020,
    abstract:
      "Combines pre-trained language models with external knowledge retrieval to produce more factual, specific, and informative responses.",
    topicTag: "Dense retrieval for open-domain NLP",
    citations: 3200,
    citationLabel: "3.2k citations",
    openAccess: true,
  },
  {
    id: "paper-2",
    title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
    field: "Machine Learning",
    fieldId: "ml",
    authors: "Albert Gu, Tri Dao",
    venue: "CoRR",
    year: 2024,
    abstract:
      "A selective state space architecture that scales linearly with sequence length, bringing efficient inference to context modeling.",
    topicTag: "State space models in foundation models",
    citations: 1100,
    citationLabel: "1.1k citations",
    openAccess: true,
  },
  {
    id: "paper-3",
    title: "Learning skillful medium-range global weather forecasting",
    field: "Climate Science",
    fieldId: "climate",
    authors: "Remi Lam, Alvaro Sanchez-Gonzalez, et al.",
    venue: "Science",
    year: 2023,
    abstract:
      "GraphCast uses graph neural networks to deliver accurate ten-day global weather predictions in under a minute.",
    topicTag: "Graph neural networks for weather",
    citations: 750,
    citationLabel: "750+ citations",
    openAccess: true,
  },
  {
    id: "paper-4",
    title: "Llama 2: Open Foundation and Fine-Tuned Chat Models",
    field: "Artificial Intelligence",
    fieldId: "ai",
    authors: "Hugo Touvron, Louis Martin, et al.",
    venue: "arXiv",
    year: 2023,
    abstract:
      "An open collection of large language models, with detailed insights into fine-tuning, safety, and human-aligned dialogue.",
    topicTag: "Open LLM development and alignment",
    citations: 15400,
    citationLabel: "15.4k citations",
    openAccess: true,
  },
];

export const mockPulseStats = {
  isSampleData: true,
  papersReadThisWeek: 12,
  papersSaved: 24,
  streakDays: 4,
  streakMessage: "4-day streak! 3 days to a milestone",
  interests: [
    { name: "Machine Learning", percentage: 70 },
    { name: "Natural Language Processing", percentage: 55 },
    { name: "Climate Science", percentage: 30 },
  ],
  recentResume: {
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    year: 2017,
    progress: 75,
  },
};
