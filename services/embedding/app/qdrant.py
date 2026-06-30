from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid5, NAMESPACE_URL
import httpx


@dataclass(frozen=True)
class VectorPoint:
    id: str
    vector: list[float]
    payload: dict


class QdrantIndex:
    def __init__(self, base_url: str, collection: str, dimensions: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.collection = collection
        self.dimensions = dimensions
        self.client = httpx.Client(timeout=10.0)

    def point_id_for_chunk(self, chunk_id: str) -> str:
        return str(uuid5(NAMESPACE_URL, f"grounded:qdrant:{chunk_id}"))

    def ensure_collection(self) -> None:
        response = self.client.get(f"{self.base_url}/collections/{self.collection}")
        if response.status_code == 200:
            return
        if response.status_code != 404:
            response.raise_for_status()

        create_response = self.client.put(
            f"{self.base_url}/collections/{self.collection}",
            json={
                "vectors": {
                    "size": self.dimensions,
                    "distance": "Cosine",
                }
            },
        )
        create_response.raise_for_status()

    def upsert(self, points: list[VectorPoint]) -> None:
        if not points:
            return

        self.ensure_collection()
        response = self.client.put(
            f"{self.base_url}/collections/{self.collection}/points",
            params={"wait": "true"},
            json={
                "points": [
                    {
                        "id": point.id,
                        "vector": point.vector,
                        "payload": point.payload,
                    }
                    for point in points
                ]
            },
        )
        response.raise_for_status()
