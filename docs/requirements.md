# FarmerAI — requirements (MVP)

## Project name
FarmerAI

## Short goal / MVP
Single-page MERN app with a sidebar chatbot (RAG + multilingual NLP for major Indian languages) that answers user queries returning structured JSON. Sidebar has a switch to open the Social feed page that integrates chat and posts.

## Priority languages
- Hindi (hi-IN)
- English (en-IN)
- Tamil (ta-IN)
- Telugu (te-IN)
- Malayalam (ml-IN)
- Kannada (kn-IN)
- Marathi (mr-IN)
- Bengali (bn-IN)
- Gujarati (gu-IN)
- Punjabi (pa-IN)
- Odia (or-IN)

## Core features (MVP)
- RAG pipeline: upload documents → embeddings → vector search → LLM answer.
- Multilingual detection & normalization (transliteration fallback).
- Chat endpoint returns canonical JSON (QA schema).
- Social feed: posts, comments, likes, search.
- Ability to "Ask about this post" using same RAG/chat backend.
- Sidebar chatbot visible on all pages; toggle to Social main view.
- Auth: JWT sign-up/login, roles (user, moderator, admin).

## Data sources & formats
- PDF, DOCX, TXT, HTML, CSV, DB records, social posts.
- Document metadata: upload date, language, source_id.

## Non-functional requirements
- Target latency: retrieval < 3s (goal), total chat < 12s (depends on LLM).
- Prefer open-source embedding & LLM where feasible; option for managed vectordb.
- Scalability: Docker for dev; containerized prod.
- Privacy: option to opt-out of storing chat logs; PII sanitization.

## Security & compliance
- HTTPS, input sanitization, rate-limits, RBAC, JWT expiry.
- Audit logs for indexing & admin actions.

## Deployment targets
- Dev: local Docker / Docker Compose
- Prod: cloud containers (AWS/GCP/Azure) + managed MongoDB / managed vector DB (optional)

## Acceptance criteria (simple)
- Chat returns valid JSON matching project QA schema.
- Sidebar chat can open/close and switch to Social page.
- Docs can be uploaded and indexed (manual trigger).

## Notes / open decisions
- Which vector DB to use (open-source vs managed)?
- Which LLM provider (open-source local vs cloud)?
- Retention policy for uploads and chats.
