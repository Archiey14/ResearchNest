# ResearchNest AI Recommendation Engine - Offline Benchmark & Ablation Study

This document summarizes offline evaluation results conducted across 4 architectural configurations on the scholarly catalog.

### Benchmark Results Table

| Model Architecture | NDCG@3 | NDCG@5 | MRR | Precision@3 | Recall@3 | MAP@5 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Pure TF-IDF)** | `0.7491` | `0.7250` | `1.0000` | `0.7143` | `0.4774` | `0.5952` |
| **Baseline + Citations** | `0.7858` | `0.7297` | `1.0000` | `0.8095` | `0.5298` | `0.6439` |
| **ResearchNest Hybrid** | `0.6449` | `0.6424` | `0.9286` | `0.6667` | `0.4202` | `0.5567` |
| **Active Rocchio Hybrid** | `0.6449` | `0.6612` | `0.9286` | `0.6667` | `0.4202` | `0.5852` |

### Mathematical Formulation
- **Hybrid Formula**: $S_{\text{hybrid}} = 0.75 \cdot S_{\text{cosine}} + 0.15 \cdot \log(1 + C) / \log(1 + C_{\max}) + 0.10 \cdot \text{Recency}$
- **Rocchio Formulation**: $\vec{v}_{\text{user}} = 1.0 \cdot \frac{\sum w_i \vec{v}_i}{\sum w_i} - 0.35 \cdot \frac{1}{|NR|} \sum_{j \in NR} \vec{v}_j$

*Benchmark generated on: 36 peer-reviewed papers across 8 core domains.*
