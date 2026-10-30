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
import os
import json

SPRING_BOOT_API = "http://localhost:8081/api/papers"

class SimilarRequest(BaseModel):
    paperId: Any = Field(..., description="Target paper ID to find similar research for")
    topK: Optional[int] = Field(default=3, description="Number of similar papers to return")

class UserRecommendRequest(BaseModel):
    savedPaperIds: List[Any] = Field(default=[], description="List of paper IDs in the researcher's saved stack")
    dismissedPaperIds: Optional[List[Any]] = Field(default=[], description="List of paper IDs dismissed/hidden by researcher")
    readDurations: Optional[Dict[str, float]] = Field(default={}, description="Reading duration in seconds per paper ID")
    topK: Optional[int] = Field(default=5, description="Number of recommendations to return")

class SyncRequest(BaseModel):
    papers: Optional[List[Dict[str, Any]]] = None

def fetch_and_index_catalog():
    try:
        resp = requests.get(SPRING_BOOT_API, timeout=3)
        if resp.status_code == 200:
            papers = resp.json()
            if isinstance(papers, list) and len(papers) > 0:
                engine.fit(papers)
                print(f"✅ Successfully indexed {len(papers)} papers from Spring Boot into AI Vector Space.")
                return True
    except Exception as e:
        print(f"⚠️ Could not fetch from Spring Boot ({e}). Attempting local catalog fallback.")

    try:
        catalog_path = os.path.join(os.path.dirname(__file__), "papers_catalog.json")
        if os.path.exists(catalog_path):
            with open(catalog_path, "r", encoding="utf-8") as f:
                papers = json.load(f)
                if isinstance(papers, list) and len(papers) > 0:
                    engine.fit(papers)
                    print(f"✅ Successfully indexed {len(papers)} papers from local papers_catalog.json.")
                    return True
    except Exception as e:
        print(f"⚠️ Local catalog fallback error: {e}")

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

    results = engine.recommend_for_user(
        saved_paper_ids=req.savedPaperIds,
        dismissed_paper_ids=req.dismissedPaperIds or [],
        read_durations=req.readDurations or {},
        top_k=req.topK or 5
    )
    return {
        "userSavedPaperIds": req.savedPaperIds,
        "dismissedCount": len(req.dismissedPaperIds or []),
        "readingBoostsApplied": sum(1 for r in results if r.get("deepReadingBoost")),
        "count": len(results),
        "recommendations": results
    }

from harvester import ingest_and_expand_catalog

class HarvestRequest(BaseModel):
    perDomain: Optional[int] = Field(default=8, description="Number of papers to harvest per discipline")
    syncToSpringBoot: Optional[bool] = Field(default=True, description="Sync to Spring Boot backend")

@app.post("/harvest-openalex")
def harvest_openalex_endpoint(req: Optional[HarvestRequest] = None):
    per_domain = req.perDomain if req and req.perDomain else 8
    sync_sb = req.syncToSpringBoot if req and req.syncToSpringBoot is not None else True
    catalog_path = os.path.join(os.path.dirname(__file__), "papers_catalog.json")

    result = ingest_and_expand_catalog(
        engine=engine,
        catalog_path=catalog_path,
        spring_boot_api=SPRING_BOOT_API,
        per_domain=per_domain,
        sync_to_spring_boot=sync_sb
    )
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
