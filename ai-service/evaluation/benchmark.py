#!/usr/bin/env python3
"""
ResearchNest Offline Recommendation Evaluation & Ablation Benchmark Suite
========================================================================
Rigorous Information Retrieval (IR) and Recommender Systems (RecSys) benchmark.
Computes industry-standard metrics:
  - NDCG@K (Normalized Discounted Cumulative Gain at K=3, K=5)
  - MRR (Mean Reciprocal Rank)
  - Precision@K & Recall@K (K=3)
  - MAP@K (Mean Average Precision at K=5)

Performs Ablation Studies across 4 Model Architectures:
  1. Baseline: Pure Unweighted TF-IDF (Cosine Similarity Only)
  2. Baseline + Citation: TF-IDF + Logarithmic Citation Normalization
  3. ResearchNest Hybrid: Domain-Weighted TF-IDF (3x Title, 2x Field, 2x TopicTag) +
                          Sublinear TF + Citation Log + Recency Exponential Decay
  4. ResearchNest Active Hybrid (Rocchio): Full Hybrid + Reading Depth Weighting
                                           (2x on deep reads) + Negative Feedback Suppression

Usage:
  python benchmark.py
"""

import os
import sys
import json
import math
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# 1. Dataset & Catalog Loader
# ---------------------------------------------------------------------------
def load_catalog() -> List[Dict[str, Any]]:
    catalog_path = os.path.join(os.path.dirname(__file__), "..", "papers_catalog.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    # Fallback to frontend mockPapers if JSON is missing
    mock_path = os.path.join(os.path.dirname(__file__), "../../frontend/src/data/mockPapers.js")
    if os.path.exists(mock_path):
        with open(mock_path, "r", encoding="utf-8") as f:
            content = f.read()
        import re
        match = re.search(r"export const mockPapers\s*=\s*(\[[\s\S]*?\]);\s*$", content)
        if match:
            return json.loads(match.group(1))

    raise FileNotFoundError("Could not locate papers catalog for evaluation.")

# ---------------------------------------------------------------------------
# 2. Ground-Truth Annotated Test Evaluation Split
# ---------------------------------------------------------------------------
# Each test case represents a realistic researcher profile / query scenario with
# graded relevance: 2 = highly relevant (direct subfield/methodology match),
# 1 = relevant (adjacent discipline/application), 0 = irrelevant.
EVALUATION_TEST_CASES = [
    {
        "id": "test-nlp-rag",
        "description": "Researcher focused on Knowledge Retrieval & RAG",
        "saved_paper_ids": ["paper-1"],  # RAG (Patrick Lewis et al.)
        "dismissed_paper_ids": [],
        "reading_durations": {"paper-1": 180.0},
        "ground_truth": {
            "paper-21": 2,  # BERT (Pre-training Deep Bidirectional)
            "paper-8": 2,   # Attention Is All You Need
            "paper-4": 2,   # Llama 2
            "paper-13": 2,  # Llama 3
            "paper-22": 2,  # Toolformer
            "paper-15": 1,  # Chain-of-Thought
            "paper-19": 1,  # LoRA
            "paper-24": 1,  # Constitutional AI
        }
    },
    {
        "id": "test-ssm-mamba",
        "description": "Researcher evaluating Next-Gen Non-Transformer Architectures",
        "saved_paper_ids": ["paper-2"],  # Mamba (Selective State Spaces)
        "dismissed_paper_ids": [],
        "reading_durations": {"paper-2": 240.0},
        "ground_truth": {
            "paper-8": 2,   # Attention Is All You Need (Core baseline compared)
            "paper-23": 2,  # FlashAttention (Hardware-aware efficiency)
            "paper-19": 1,  # LoRA
            "paper-17": 1,  # Adam Optimizer
            "paper-21": 1,  # BERT
        }
    },
    {
        "id": "test-climate-ai",
        "description": "Geospatial & Planetary Weather ML Researcher",
        "saved_paper_ids": ["paper-3"],  # GraphCast
        "dismissed_paper_ids": [],
        "reading_durations": {"paper-3": 210.0},
        "ground_truth": {
            "paper-32": 2,  # ClimaX (Foundation model for weather)
            "paper-11": 2,  # Earth system predictability
            "paper-9": 1,   # ResNet (Deep visual learning)
            "paper-25": 1,  # ViT (Vision Transformer)
        }
    },
    {
        "id": "test-structural-bio",
        "description": "Structural Biology & Protein Folding Computational Biologist",
        "saved_paper_ids": ["paper-5"],  # AlphaFold 2
        "dismissed_paper_ids": [],
        "reading_durations": {"paper-5": 300.0},
        "ground_truth": {
            "paper-29": 2,  # AlphaFold 3 (Biomolecular interactions)
            "paper-31": 2,  # ESMFold (Evolutionary scale prediction)
            "paper-30": 2,  # CRISPR-Cas9
            "paper-8": 1,   # Attention (Evoformer basis)
        }
    },
    {
        "id": "test-quantum-supremacy",
        "description": "Quantum Computing & Quantum Algorithms Researcher",
        "saved_paper_ids": ["paper-6"],  # Quantum supremacy using Sycamore
        "dismissed_paper_ids": [],
        "reading_durations": {"paper-6": 150.0},
        "ground_truth": {
            "paper-33": 2,  # Suppressing quantum errors by scaling
            "paper-12": 2,  # Surface code quantum computation
            "paper-34": 2,  # Quantum advantage in learning
        }
    },
    {
        "id": "test-multimodal-cv",
        "description": "Computer Vision & Generative Multimodal Researcher",
        "saved_paper_ids": ["paper-26", "paper-20"],  # CLIP + Segment Anything
        "dismissed_paper_ids": [],
        "reading_durations": {"paper-26": 200.0, "paper-20": 190.0},
        "ground_truth": {
            "paper-25": 2,  # Vision Transformer (ViT)
            "paper-27": 2,  # Latent Diffusion / Stable Diffusion
            "paper-28": 2,  # NeRF
            "paper-9": 2,   # ResNet
            "paper-18": 1,  # GANs
        }
    },
    {
        "id": "test-active-feedback",
        "description": "Active Learning Stress Test: Saved LLM & Dismissed Vision Models",
        "saved_paper_ids": ["paper-8", "paper-4"],  # Attention + Llama 2
        "dismissed_paper_ids": ["paper-9", "paper-28"],  # Dismissed ResNet & NeRF
        "reading_durations": {"paper-4": 250.0, "paper-8": 90.0},
        "ground_truth": {
            "paper-13": 2,  # Llama 3
            "paper-19": 2,  # LoRA
            "paper-1": 2,   # RAG
            "paper-16": 2,  # DPO
            "paper-21": 2,  # BERT
            "paper-15": 1,  # Chain of Thought
            "paper-9": 0,   # ResNet (Strict negative)
            "paper-28": 0,  # NeRF (Strict negative)
        }
    }
]

# ---------------------------------------------------------------------------
# 3. Model Implementations for Ablation
# ---------------------------------------------------------------------------
class ModelA_PureTfidf:
    """Baseline 1: Standard TF-IDF on concatenated raw text with Cosine Similarity."""
    def __init__(self, papers: List[Dict[str, Any]]):
        self.papers = papers
        self.id_to_idx = {p["id"]: i for i, p in enumerate(papers)}
        corpus = [f"{p.get('title','')} {p.get('abstract','')}" for p in papers]
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.matrix = self.vectorizer.fit_transform(corpus)

    def rank(self, saved_ids: List[str], dismissed_ids: List[str], durations: Dict[str, float], top_k: int = 5):
        indices = [self.id_to_idx[sid] for sid in saved_ids if sid in self.id_to_idx]
        if not indices:
            return []
        query_vec = np.asarray(self.matrix[indices].mean(axis=0))
        sims = cosine_similarity(query_vec, self.matrix).flatten()
        ranked_indices = np.argsort(sims)[::-1]
        results = [self.papers[idx]["id"] for idx in ranked_indices if idx not in indices][:top_k]
        return results

class ModelB_TfidfCitations:
    """Baseline 2: TF-IDF + Logarithmic Citation Normalization."""
    def __init__(self, papers: List[Dict[str, Any]]):
        self.papers = papers
        self.id_to_idx = {p["id"]: i for i, p in enumerate(papers)}
        self.max_cites = max([int(p.get("citations", 1) or 1) for p in papers] + [100])
        corpus = [f"{p.get('title','')} {p.get('abstract','')}" for p in papers]
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.matrix = self.vectorizer.fit_transform(corpus)

    def rank(self, saved_ids: List[str], dismissed_ids: List[str], durations: Dict[str, float], top_k: int = 5):
        indices = [self.id_to_idx[sid] for sid in saved_ids if sid in self.id_to_idx]
        if not indices:
            return []
        query_vec = np.asarray(self.matrix[indices].mean(axis=0))
        sims = cosine_similarity(query_vec, self.matrix).flatten()
        scores = []
        for idx in range(len(self.papers)):
            if idx in indices:
                continue
            sim = sims[idx]
            cites = int(self.papers[idx].get("citations", 0) or 0)
            norm_cites = math.log1p(cites) / math.log1p(self.max_cites)
            score = 0.80 * sim + 0.20 * norm_cites
            scores.append((self.papers[idx]["id"], score))
        scores.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scores[:top_k]]

class ModelC_ResearchNestHybrid:
    """
    ResearchNest Core Hybrid Recommender:
    - Domain Weighted Text: Title (3x), Field (2x), TopicTag (2x), Venue (1x), Abstract (1x)
    - Sublinear TF scaling + Bigrams (1, 2)
    - Hybrid Scoring: 75% Semantic Similarity + 15% Log Citation Impact + 10% Recency Decay
    """
    def __init__(self, papers: List[Dict[str, Any]]):
        self.papers = papers
        self.id_to_idx = {p["id"]: i for i, p in enumerate(papers)}
        self.max_cites = max([int(p.get("citations", 1) or 1) for p in papers] + [100])
        corpus = []
        for p in papers:
            title = p.get("title", "")
            field = p.get("field", "")
            topic = p.get("topicTag", "")
            venue = p.get("venue", "")
            abstract = p.get("abstract", "")
            weighted = f"{title} {title} {title} {field} {field} {topic} {topic} {venue} {abstract}"
            corpus.append(weighted)
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            max_features=8000
        )
        self.matrix = self.vectorizer.fit_transform(corpus)

    def rank(self, saved_ids: List[str], dismissed_ids: List[str], durations: Dict[str, float], top_k: int = 5):
        indices = [self.id_to_idx[sid] for sid in saved_ids if sid in self.id_to_idx]
        if not indices:
            return []
        query_vec = np.asarray(self.matrix[indices].mean(axis=0))
        sims = cosine_similarity(query_vec, self.matrix).flatten()
        scores = []
        for idx in range(len(self.papers)):
            if idx in indices:
                continue
            sim = sims[idx]
            p = self.papers[idx]
            cites = int(p.get("citations", 0) or 0)
            norm_cites = math.log1p(cites) / math.log1p(self.max_cites)
            year = int(p.get("year", 2024) or 2024)
            recency = max(0.0, min(1.0, 1.0 - (2026 - year) / 18.0))
            score = 0.75 * sim + 0.15 * norm_cites + 0.10 * recency
            scores.append((p["id"], score))
        scores.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scores[:top_k]]

class ModelD_ActiveRocchioHybrid:
    """
    ResearchNest Active Learning Dynamic Hybrid Engine:
    - Incorporates the Rocchio Algorithm for Relevance Feedback:
        v_user = alpha * weighted_mean(v_saved) - beta * mean(v_dismissed)
    - Reading Depth Weighting: Documents read for >=120 seconds receive double anchor weight (w=2.0).
    - Dismissed papers are hard-suppressed from candidate output.
    """
    def __init__(self, papers: List[Dict[str, Any]]):
        self.papers = papers
        self.id_to_idx = {p["id"]: i for i, p in enumerate(papers)}
        self.max_cites = max([int(p.get("citations", 1) or 1) for p in papers] + [100])
        corpus = []
        for p in papers:
            title = p.get("title", "")
            field = p.get("field", "")
            topic = p.get("topicTag", "")
            venue = p.get("venue", "")
            abstract = p.get("abstract", "")
            weighted = f"{title} {title} {title} {field} {field} {topic} {topic} {venue} {abstract}"
            corpus.append(weighted)
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            max_features=8000
        )
        self.matrix = self.vectorizer.fit_transform(corpus)

    def rank(self, saved_ids: List[str], dismissed_ids: List[str], durations: Dict[str, float], top_k: int = 5):
        saved_indices = [self.id_to_idx[sid] for sid in saved_ids if sid in self.id_to_idx]
        if not saved_indices:
            return []

        # 1. Reading Depth Weighted Centroid (Rocchio Positive component)
        weights = []
        vectors = []
        for sid in saved_ids:
            if sid in self.id_to_idx:
                idx = self.id_to_idx[sid]
                dur = durations.get(sid, 0.0)
                # 2x weight bonus if researcher spent >= 120s deep reading
                w = 2.0 if dur >= 120.0 else 1.0
                weights.append(w)
                vectors.append(self.matrix[idx].toarray())

        weights_arr = np.array(weights).reshape(-1, 1)
        weighted_pos_vec = np.sum(np.array(vectors).squeeze(axis=1) * weights_arr, axis=0) / np.sum(weights_arr)

        # 2. Rocchio Negative Feedback component
        dismissed_indices = set([self.id_to_idx[did] for did in dismissed_ids if did in self.id_to_idx])
        if dismissed_indices:
            neg_vecs = self.matrix[list(dismissed_indices)].toarray()
            mean_neg_vec = np.mean(neg_vecs, axis=0)
            # Rocchio formula: v_user = 1.0 * v_pos - 0.35 * v_neg
            user_vec = weighted_pos_vec - (0.35 * mean_neg_vec)
            # Vector space non-negativity constraint
            user_vec = np.maximum(0.0, user_vec)
        else:
            user_vec = weighted_pos_vec

        user_vec = user_vec.reshape(1, -1)
        sims = cosine_similarity(user_vec, self.matrix).flatten()

        saved_set = set(saved_indices)
        scores = []
        for idx in range(len(self.papers)):
            # Never recommend saved or dismissed items
            if idx in saved_set or idx in dismissed_indices:
                continue
            sim = sims[idx]
            p = self.papers[idx]
            cites = int(p.get("citations", 0) or 0)
            norm_cites = math.log1p(cites) / math.log1p(self.max_cites)
            year = int(p.get("year", 2024) or 2024)
            recency = max(0.0, min(1.0, 1.0 - (2026 - year) / 18.0))
            score = 0.75 * sim + 0.15 * norm_cites + 0.10 * recency
            scores.append((p["id"], score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scores[:top_k]]

# ---------------------------------------------------------------------------
# 4. Metric Computation Functions
# ---------------------------------------------------------------------------
def compute_dcg(relevances: List[int], k: int) -> float:
    dcg = 0.0
    for i, rel in enumerate(relevances[:k]):
        dcg += (math.pow(2, rel) - 1.0) / math.log2(i + 2)
    return dcg

def compute_ndcg(retrieved_ids: List[str], ground_truth: Dict[str, int], k: int) -> float:
    retrieved_rels = [ground_truth.get(pid, 0) for pid in retrieved_ids[:k]]
    actual_dcg = compute_dcg(retrieved_rels, k)
    ideal_rels = sorted(ground_truth.values(), reverse=True)[:k]
    idcg = compute_dcg(ideal_rels, k)
    if idcg <= 0.0:
        return 0.0
    return actual_dcg / idcg

def compute_mrr(retrieved_ids: List[str], ground_truth: Dict[str, int]) -> float:
    for rank, pid in enumerate(retrieved_ids):
        if ground_truth.get(pid, 0) >= 1:
            return 1.0 / (rank + 1)
    return 0.0

def compute_precision_at_k(retrieved_ids: List[str], ground_truth: Dict[str, int], k: int) -> float:
    if k <= 0:
        return 0.0
    hits = sum(1 for pid in retrieved_ids[:k] if ground_truth.get(pid, 0) >= 1)
    return hits / k

def compute_recall_at_k(retrieved_ids: List[str], ground_truth: Dict[str, int], k: int) -> float:
    total_relevant = sum(1 for rel in ground_truth.values() if rel >= 1)
    if total_relevant == 0:
        return 0.0
    hits = sum(1 for pid in retrieved_ids[:k] if ground_truth.get(pid, 0) >= 1)
    return hits / total_relevant

def compute_map(retrieved_ids: List[str], ground_truth: Dict[str, int], k: int) -> float:
    total_relevant = sum(1 for rel in ground_truth.values() if rel >= 1)
    if total_relevant == 0:
        return 0.0
    running_hits = 0
    precision_sum = 0.0
    for i, pid in enumerate(retrieved_ids[:k]):
        if ground_truth.get(pid, 0) >= 1:
            running_hits += 1
            precision_sum += running_hits / (i + 1)
    return precision_sum / min(k, total_relevant)

# ---------------------------------------------------------------------------
# 5. Benchmark Execution & Evaluation Pipeline
# ---------------------------------------------------------------------------
def run_ablation_benchmark():
    papers = load_catalog()
    print("=" * 80)
    print(f"🔬 RESEARCHNEST OFFLINE EVALUATION & ABLATION BENCHMARK")
    print(f"Catalog Size: {len(papers)} papers | Test Scenarios: {len(EVALUATION_TEST_CASES)} queries")
    print("=" * 80)

    models = {
        "Baseline (Pure TF-IDF)": ModelA_PureTfidf(papers),
        "Baseline + Citations": ModelB_TfidfCitations(papers),
        "ResearchNest Hybrid": ModelC_ResearchNestHybrid(papers),
        "Active Rocchio Hybrid": ModelD_ActiveRocchioHybrid(papers),
    }

    results = {}
    for model_name, model in models.items():
        ndcg3_list, ndcg5_list = [], []
        mrr_list = []
        p3_list, r3_list = [], []
        map5_list = []

        for case in EVALUATION_TEST_CASES:
            ranked = model.rank(
                case["saved_paper_ids"],
                case.get("dismissed_paper_ids", []),
                case.get("reading_durations", {}),
                top_k=5
            )
            gt = case["ground_truth"]
            ndcg3_list.append(compute_ndcg(ranked, gt, k=3))
            ndcg5_list.append(compute_ndcg(ranked, gt, k=5))
            mrr_list.append(compute_mrr(ranked, gt))
            p3_list.append(compute_precision_at_k(ranked, gt, k=3))
            r3_list.append(compute_recall_at_k(ranked, gt, k=3))
            map5_list.append(compute_map(ranked, gt, k=5))

        results[model_name] = {
            "NDCG@3": np.mean(ndcg3_list),
            "NDCG@5": np.mean(ndcg5_list),
            "MRR": np.mean(mrr_list),
            "P@3": np.mean(p3_list),
            "R@3": np.mean(r3_list),
            "MAP@5": np.mean(map5_list),
        }

    # Format ASCII Output Table
    headers = ["Model Architecture", "NDCG@3", "NDCG@5", "MRR", "Precision@3", "Recall@3", "MAP@5"]
    print("\n" + f"{headers[0]:<25} | {headers[1]:<8} | {headers[2]:<8} | {headers[3]:<6} | {headers[4]:<11} | {headers[5]:<8} | {headers[6]:<6}")
    print("-" * 88)

    baseline_ndcg5 = results["Baseline (Pure TF-IDF)"]["NDCG@5"]
    baseline_mrr = results["Baseline (Pure TF-IDF)"]["MRR"]

    for name, m in results.items():
        print(f"{name:<25} | {m['NDCG@3']:<8.4f} | {m['NDCG@5']:<8.4f} | {m['MRR']:<6.4f} | {m['P@3']:<11.4f} | {m['R@3']:<8.4f} | {m['MAP@5']:<6.4f}")

    print("-" * 88)
    hybrid_ndcg5 = results["ResearchNest Hybrid"]["NDCG@5"]
    hybrid_mrr = results["ResearchNest Hybrid"]["MRR"]
    gain_ndcg5 = ((hybrid_ndcg5 - baseline_ndcg5) / baseline_ndcg5) * 100
    gain_mrr = ((hybrid_mrr - baseline_mrr) / baseline_mrr) * 100

    active_ndcg5 = results["Active Rocchio Hybrid"]["NDCG@5"]
    gain_active = ((active_ndcg5 - baseline_ndcg5) / baseline_ndcg5) * 100

    print(f"\n📊 Key Ablation Takeaways:")
    print(f"  • Baseline + Citations achieves high precision (P@3: {results['Baseline + Citations']['P@3']:.4f}) by prioritizing authoritative foundational papers.")
    print(f"  • Active Rocchio Hybrid achieves NDCG@5: {active_ndcg5:.4f} and MAP@5: {results['Active Rocchio Hybrid']['MAP@5']:.4f}.")
    print(f"  • Negative feedback suppression successfully excludes 100% of dismissed papers from recommendations.")

    # Export to JSON
    out_dir = os.path.dirname(__file__)
    json_path = os.path.join(out_dir, "ablation_benchmark_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Saved structured benchmark results to: {json_path}")

    # Generate Markdown Documentation Report
    md_path = os.path.join(out_dir, "EVALUATION_REPORT.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# ResearchNest AI Recommendation Engine - Offline Benchmark & Ablation Study\n\n")
        f.write("This document summarizes offline evaluation results conducted across 4 architectural configurations on the scholarly catalog.\n\n")
        f.write("### Benchmark Results Table\n\n")
        f.write("| Model Architecture | NDCG@3 | NDCG@5 | MRR | Precision@3 | Recall@3 | MAP@5 |\n")
        f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n")
        for name, m in results.items():
            f.write(f"| **{name}** | `{m['NDCG@3']:.4f}` | `{m['NDCG@5']:.4f}` | `{m['MRR']:.4f}` | `{m['P@3']:.4f}` | `{m['R@3']:.4f}` | `{m['MAP@5']:.4f}` |\n")
        f.write("\n### Mathematical Formulation\n")
        f.write("- **Hybrid Formula**: $S_{\\text{hybrid}} = 0.75 \\cdot S_{\\text{cosine}} + 0.15 \\cdot \\log(1 + C) / \\log(1 + C_{\\max}) + 0.10 \\cdot \\text{Recency}$\n")
        f.write("- **Rocchio Formulation**: $\\vec{v}_{\\text{user}} = 1.0 \\cdot \\frac{\\sum w_i \\vec{v}_i}{\\sum w_i} - 0.35 \\cdot \\frac{1}{|NR|} \\sum_{j \\in NR} \\vec{v}_j$\n")
        f.write(f"\n*Benchmark generated on: {len(papers)} peer-reviewed papers across 8 core domains.*\n")
    print(f"📑 Generated Markdown report at: {md_path}\n")

if __name__ == "__main__":
    run_ablation_benchmark()
