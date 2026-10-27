import uvicorn
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

from engine import PaperRecommendationEngine

app = FastAPI(
    title="ResearchNest AI Recommendation Engine",
    description="Content-Based & Similarity-Based Scholarly Paper Recommendation Microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = PaperRecommendationEngine()
SPRING_BOOT_API = "http://localhost:8081/api/papers"

class SimilarRequest(BaseModel):
    paperId: Any = Field(..., description="Target paper ID to find similar research for")
    topK: Optional[int] = Field(default=3, description="Number of similar papers to return")

class UserRecommendRequest(BaseModel):
    savedPaperIds: List[Any] = Field(default=[], description="List of paper IDs in the researcher's saved stack")
    topK: Optional[int] = Field(default=5, description="Number of recommendations to return")

class SyncRequest(BaseModel):
    papers: Optional[List[Dict[str, Any]]] = None

def fetch_and_index_catalog():
    try:
        resp = requests.get(SPRING_BOOT_API, timeout=5)
        if resp.status_code == 200:
            papers = resp.json()
            if isinstance(papers, list) and len(papers) > 0:
                engine.fit(papers)
                print(f"✅ Successfully indexed {len(papers)} papers from Spring Boot into AI Vector Space.")
                return True
    except Exception as e:
        print(f"⚠️ Could not fetch from Spring Boot ({e}). Will attempt on first sync.")
    return False

@app.on_event("startup")
def on_startup():
    fetch_and_index_catalog()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ResearchNest AI Recommendation Microservice",
        "indexedPapersCount": len(engine.papers),
        "vectorSpaceDim": engine.tfidf_matrix.shape if engine.tfidf_matrix is not None else None
    }

@app.post("/sync-catalog")
def sync_catalog(payload: SyncRequest = None):
    if payload and payload.papers:
        engine.fit(payload.papers)
        return {
            "message": f"Successfully indexed {len(payload.papers)} papers provided in payload.",
            "count": len(payload.papers)
        }
    
    success = fetch_and_index_catalog()
    if not success and len(engine.papers) == 0:
        raise HTTPException(status_code=503, detail="Could not retrieve papers from Spring Boot backend.")
    
    return {
        "message": f"Successfully synced and indexed {len(engine.papers)} papers from Spring Boot.",
        "count": len(engine.papers)
    }

@app.post("/recommend/similar")
def recommend_similar(req: SimilarRequest):
    if len(engine.papers) == 0:
        fetch_and_index_catalog()
    
    if len(engine.papers) == 0:
        raise HTTPException(status_code=503, detail="AI engine catalog not indexed yet.")

    results = engine.recommend_similar(req.paperId, top_k=req.topK or 3)
    return {
        "targetPaperId": req.paperId,
        "count": len(results),
        "similarPapers": results
    }

@app.post("/recommend/user")
def recommend_for_user(req: UserRecommendRequest):
    if len(engine.papers) == 0:
        fetch_and_index_catalog()

    if len(engine.papers) == 0:
        raise HTTPException(status_code=503, detail="AI engine catalog not indexed yet.")

    results = engine.recommend_for_user(req.savedPaperIds, top_k=req.topK or 5)
    return {
        "userSavedPaperIds": req.savedPaperIds,
        "count": len(results),
        "recommendations": results
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
