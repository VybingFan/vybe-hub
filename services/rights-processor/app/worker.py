from __future__ import annotations

import hashlib
import json
import os
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

import httpx

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PROCESSOR_VERSION = os.getenv("PROCESSOR_VERSION", "vybe-rights-processor-v1")
POLL_SECONDS = max(5, int(os.getenv("POLL_SECONDS", "15")))

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}


def rpc(client: httpx.Client, name: str, payload: dict[str, Any]) -> Any:
    response = client.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{name}", headers=HEADERS, json=payload
    )
    response.raise_for_status()
    return response.json() if response.content else None


def download_track(client: httpx.Client, audio_path: str, destination: Path) -> None:
    # Track audio_url is the object path in the private `music-audio` bucket.
    response = client.get(
        f"{SUPABASE_URL}/storage/v1/object/music-audio/{audio_path}",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
    )
    response.raise_for_status()
    destination.write_bytes(response.content)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run_json(command: list[str]) -> dict[str, Any]:
    result = subprocess.run(
        command, check=True, capture_output=True, text=True, timeout=300
    )
    return json.loads(result.stdout)


def inspect_audio(path: Path) -> dict[str, Any]:
    probe = run_json(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_format",
            "-show_streams",
            "-of",
            "json",
            str(path),
        ]
    )
    fingerprint = run_json(["fpcalc", "-json", str(path)])
    audio_stream = next(
        (stream for stream in probe.get("streams", []) if stream.get("codec_type") == "audio"),
        {},
    )
    file_format = probe.get("format", {})
    tags = {str(k).lower(): v for k, v in file_format.get("tags", {}).items()}
    return {
        "sha256": sha256_file(path),
        "chromaprint": fingerprint.get("fingerprint"),
        "algorithm": fingerprint.get("algorithm"),
        "duration": float(file_format.get("duration") or fingerprint.get("duration") or 0),
        "sample_rate": int(audio_stream.get("sample_rate") or 0) or None,
        "bitrate": int(file_format.get("bit_rate") or audio_stream.get("bit_rate") or 0) or None,
        "file_type": file_format.get("format_name"),
        "metadata": {
            "title": tags.get("title"),
            "artist": tags.get("artist"),
            "album": tags.get("album"),
            "isrc": tags.get("isrc"),
            "upc": tags.get("upc") or tags.get("barcode"),
            "raw_tags": tags,
        },
    }


def fetch_track(client: httpx.Client, track_id: str) -> dict[str, Any]:
    response = client.get(
        f"{SUPABASE_URL}/rest/v1/tracks",
        headers=HEADERS,
        params={"id": f"eq.{track_id}", "select": "id,audio_url", "limit": "1"},
    )
    response.raise_for_status()
    rows = response.json()
    if not rows:
        raise RuntimeError("Track no longer exists")
    return rows[0]


def process_one(client: httpx.Client, job: dict[str, Any]) -> None:
    job_id = job["id"]
    try:
        track = fetch_track(client, job["track_id"])
        with tempfile.TemporaryDirectory(prefix="vybe-rights-") as temp_dir:
            audio_file = Path(temp_dir) / "upload"
            download_track(client, track["audio_url"], audio_file)
            result = inspect_audio(audio_file)
        rpc(
            client,
            "complete_audio_processing_job",
            {
                "target_job_id": job_id,
                "file_sha256": result["sha256"],
                "audio_chromaprint": result["chromaprint"],
                "audio_chromaprint_algorithm": result["algorithm"],
                "measured_duration": result["duration"],
                "measured_sample_rate": result["sample_rate"],
                "measured_bitrate": result["bitrate"],
                "measured_file_type": result["file_type"],
                "embedded_metadata": result["metadata"],
                "worker_version": PROCESSOR_VERSION,
            },
        )
    except Exception as exc:
        rpc(
            client,
            "fail_audio_processing_job",
            {"target_job_id": job_id, "failure": f"{type(exc).__name__}: {exc}"},
        )


def main() -> None:
    with httpx.Client(timeout=300) as client:
        while True:
            jobs = rpc(
                client,
                "claim_audio_processing_job",
                {"worker_version": PROCESSOR_VERSION},
            )
            if jobs:
                process_one(client, jobs[0])
            else:
                time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
