from __future__ import annotations

from dataclasses import dataclass
import httpx


@dataclass(frozen=True)
class SearchHit:
    point_id: str
    score: float
    chunk_id: str


class QdrantSearch:
    def __init__(self, base_url: str, collection: str, limit: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.collection = collection
        self.limit = limit
        self.client = httpx.Client(timeout=10.0)

    def search(self, tenant_id: str, vector: list[float]) -> list[SearchHit]:
        response = self.client.post(
            f"{self.base_url}/collections/{self.collection}/points/search",
            json={
                "vector": vector,
                "limit": self.limit,
                "with_payload": True,
                "filter": {
                    "must": [
                        {
                            "key": "tenantId",
                            "match": {
                                "value": tenant_id,
                            },
                        }
                    ]
                },
            },
        )
        response.raise_for_status()
        payload = response.json()
        return [
            SearchHit(point_id=str(item["id"]), score=float(item["score"]), chunk_id=item["payload"]["chunkId"])
            for item in payload.get("result", [])
            if item.get("payload", {}).get("chunkId")
        ]
