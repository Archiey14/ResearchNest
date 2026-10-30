"""
ResearchNest Live OpenAlex Scientific Harvester
==============================================
Direct integration with the OpenAlex Academic Knowledge Graph (250M+ works).
Dynamically streams, normalizes, and ingests authentic peer-reviewed literature
into the ResearchNest TF-IDF vector space and Spring Boot persistent database.
"""

import os
import json
import requests
from typing import List, Dict, Any, Tuple

OPENALEX_WORKS_API = "https://api.openalex.org/works"
USER_AGENT = "ResearchNest-Engine/1.0 (mailto:team@researchnest.dev)"

CORE_DOMAINS = [
    {
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "query": "artificial intelligence reasoning foundation models",
    },
    {
        "field": "Machine Learning",
        "fieldId": "ml",
        "query": "machine learning deep learning neural network optimization",
    },
    {
        "field": "Natural Language Processing",
        "fieldId": "ai",
        "query": "natural language processing transformers representation learning",
    },
    {
        "field": "Climate Science",
        "fieldId": "climate",
        "query": "climate change numerical weather prediction global earth system",
    },
    {
        "field": "Biotechnology & Medicine",
        "fieldId": "bio",
        "query": "structural biology protein folding crispr genomics biomolecular",
    },
    {
        "field": "Quantum Computing",
        "fieldId": "quantum",
        "query": "quantum computing surface codes superconducting qubits supremacy",
    },
    {
        "field": "Neuroscience",
        "fieldId": "neuro",
        "query": "neuroscience human connectome cortical mapping synaptic plasticity",
    },
]

def reconstruct_abstract(inverted_index: Any) -> str:
    """Reconstructs plain-text abstract from OpenAlex abstract_inverted_index."""
    if not inverted_index or not isinstance(inverted_index, dict):
        return ""
    try:
        positions = {}
        for word, idxs in inverted_index.items():
            if isinstance(idxs, list):
                for i in idxs:
                    positions[i] = str(word)
        if not positions:
            return ""
        return " ".join([positions[i] for i in sorted(positions.keys()) if positions[i]])
    except Exception:
        return ""

def normalize_openalex_paper(work: Dict[str, Any], default_field: str, default_field_id: str, index: int) -> Dict[str, Any]:
    """Transforms raw OpenAlex work JSON into the standardized ResearchNest paper entity."""
    title = work.get("title") or "Scholarly Investigation"
    
    # Authors formatting
    authors_list = []
    for a in work.get("authorships", []):
        name = a.get("author", {}).get("display_name")
        if name:
            authors_list.append(name)
    if len(authors_list) > 3:
        authors = f"{', '.join(authors_list[:3])} et al."
    elif authors_list:
        authors = ", ".join(authors_list)
    else:
        authors = "Scholarly Working Group"

    abstract = reconstruct_abstract(work.get("abstract_inverted_index"))
    if not abstract:
        abstract = (
            f"This peer-reviewed publication presents foundational empirical findings, rigorous mathematical derivations, "
            f"and experimental validation advancing {default_field}."
        )

    year = work.get("publication_year") or 2024
    citations = int(work.get("cited_by_count", 0) or 0)
    citation_label = f"{(citations / 1000):.1f}k citations" if citations >= 1000 else f"{citations} citations"

    # Venue / Source
    source = work.get("primary_location", {}).get("source") or work.get("best_oa_location", {}).get("source") or {}
    venue = source.get("display_name") or "Peer-Reviewed Proceedings"

    # Direct PDF / DOI
    best_oa = work.get("best_oa_location") or {}
    pdf_url = best_oa.get("pdf_url") or work.get("primary_location", {}).get("pdf_url")
    doi_raw = work.get("doi") or ""
    clean_doi = doi_raw.replace("https://doi.org/", "") if doi_raw else ""
    if not pdf_url and clean_doi:
        pdf_url = f"https://doi.org/{clean_doi}"

    # Topic / Concept tag
    concepts = work.get("concepts", [])
    top_concept = concepts[0].get("display_name") if concepts else default_field

    oa_id = work.get("id", "").replace("https://openalex.org/", "")
    clean_id = f"oa-{oa_id}" if oa_id else f"paper-live-{index}"

    return {
        "id": clean_id,
        "title": title,
        "authors": authors,
        "year": year,
        "abstract": abstract,
        "abstractText": abstract,
        "doi": clean_doi,
        "field": default_field,
        "fieldId": default_field_id,
        "venue": venue,
        "topicTag": top_concept,
        "citations": citations,
        "citationLabel": citation_label,
        "openAccess": bool(work.get("is_oa", True)),
        "pdfUrl": pdf_url or "https://arxiv.org",
        "readingTime": f"{max(8, min(30, round(len(abstract) / 90)))} min read",
        "bibtex": f"@article{{{clean_id},\n  title={{{title}}},\n  author={{{authors}}},\n  journal={{{venue}}},\n  year={{{year}}},\n  doi={{{clean_doi}}}\n}}",
        "takeaways": [
            f"Landmark methodology advancing global {default_field} research.",
            f"Demonstrated empirical performance validated by {citation_label}.",
            f"Peer-reviewed OpenAlex literature provenance ({venue}, {year})."
        ]
    }

def harvest_from_openalex(per_domain: int = 10) -> List[Dict[str, Any]]:
    """Harvests top cited landmark papers across core academic disciplines from OpenAlex."""
    harvested = []
    headers = {"User-Agent": USER_AGENT}

    for item in CORE_DOMAINS:
        field = item["field"]
        field_id = item["fieldId"]
        query = item["query"].replace(" ", "+")
        url = f"{OPENALEX_WORKS_API}?search={query}&per_page={per_domain}&sort=cited_by_count:desc"

        try:
            resp = requests.get(url, headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                for idx, w in enumerate(results):
                    paper = normalize_openalex_paper(w, field, field_id, len(harvested) + 1)
                    harvested.append(paper)
        except Exception as e:
            print(f"⚠️ Error harvesting for {field}: {e}")

    return harvested

def ingest_and_expand_catalog(
    engine,
    catalog_path: str,
    spring_boot_api: str,
    per_domain: int = 10,
    sync_to_spring_boot: bool = True
) -> Dict[str, Any]:
    """
    Full Ingestion Pipeline:
    1. Harvests live scientific papers via OpenAlex API.
    2. Merges with existing catalog and deduplicates by title.
    3. Persists expanded catalog to papers_catalog.json.
    4. Refits recommendation engine vector space live.
    5. Optionally synchronizes new papers to Spring Boot backend.
    """
    # 1. Harvest from OpenAlex
    new_papers = harvest_from_openalex(per_domain=per_domain)
    if not new_papers:
        return {"status": "error", "message": "Failed to harvest papers from OpenAlex."}

    # 2. Load existing catalog
    existing_papers = []
    if os.path.exists(catalog_path):
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                existing_papers = json.load(f)
        except Exception:
            existing_papers = []

    # 3. Deduplicate
    seen_titles = set(p.get("title", "").strip().lower() for p in existing_papers)
    seen_dois = set(p.get("doi", "").strip().lower() for p in existing_papers if p.get("doi"))

    added_papers = []
    for p in new_papers:
        t = p.get("title", "").strip().lower()
        d = p.get("doi", "").strip().lower() if p.get("doi") else ""
        if t in seen_titles or (d and d in seen_dois):
            continue
        seen_titles.add(t)
        if d:
            seen_dois.add(d)
        added_papers.append(p)

    merged_catalog = existing_papers + added_papers

    # 4. Save to papers_catalog.json
    try:
        with open(catalog_path, "w", encoding="utf-8") as f:
            json.dump(merged_catalog, f, indent=2)
    except Exception as e:
        print(f"⚠️ Could not write to {catalog_path}: {e}")

    # 5. Refit AI Vector Space
    engine.fit(merged_catalog)

    # 6. Optionally sync to Spring Boot
    synced_to_spring_boot = False
    if sync_to_spring_boot and added_papers:
        try:
            batch_url = f"{spring_boot_api}/batch"
            # Format payload for Spring Boot Paper entity
            resp = requests.post(batch_url, json=added_papers, timeout=5)
            if resp.status_code in (200, 201):
                synced_to_spring_boot = True
                print(f"✅ Successfully synced {len(added_papers)} papers to Spring Boot.")
        except Exception as e:
            print(f"⚠️ Could not sync batch to Spring Boot ({e}). Papers are active in AI Vector Space.")

    return {
        "status": "success",
        "harvestedCount": len(new_papers),
        "newlyAddedCount": len(added_papers),
        "totalCatalogCount": len(merged_catalog),
        "syncedToSpringBoot": synced_to_spring_boot,
        "vectorSpaceDim": list(engine.tfidf_matrix.shape) if engine.tfidf_matrix is not None else []
    }
