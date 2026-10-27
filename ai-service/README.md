# ResearchNest AI Recommendation Microservice

High-performance AI recommendation engine powering ResearchNest's literature discovery, similarity matching, and personalized research feeds.

## Technology Stack
- **Framework**: FastAPI (Asynchronous Python REST API)
- **Machine Learning**: `scikit-learn`, `numpy` (TF-IDF Vector Space Model & Cosine Similarity)
- **Integration**: Spring Boot REST Gateway (`http://localhost:8081`) orchestrates requests between frontend and AI service

## Core Capabilities
1. **Multi-Feature TF-IDF Vector Space Representation**:
   - Computes weighted feature vectors combining Paper Title ($3\times$), Field ($2\times$), Topic Tag ($2\times$), and Abstract text ($1\times$).
   - Generates normalized TF-IDF matrix ($N$ papers $\times$ $M$ n-gram vocabulary features).
2. **Pairwise Cosine Similarity**:
   - Calculates semantic similarity metric between all literature items in the catalog.
   - Proportional match percentage scoring ($70\% - 98\%$) with human-readable explainability reasoning.
3. **Personalized User Centroid Recommendations**:
   - Calculates dynamic centroid embedding from the researcher's saved stack.
   - Computes cosine distance against unsaved papers to rank novel, highly relevant papers.
   - Includes transparent explainability: identifies which saved paper triggered the recommendation.

## Running Locally

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the microservice (runs on port 8000)
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## API Endpoints
- `GET /health`: Healthcheck, catalog count, and vector space dimensions.
- `POST /sync-catalog`: Syncs catalog directly from Spring Boot MySQL database.
- `POST /recommend/similar`: Returns top-$K$ similar papers for a given paper ID.
- `POST /recommend/user`: Returns personalized recommendations based on saved paper IDs.
