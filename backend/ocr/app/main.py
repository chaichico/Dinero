import io
import os
import re
from datetime import date

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image

app = FastAPI(title="Dinero OCR Service", version="0.2.0")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "10000000"))

try:
    from paddleocr import PaddleOCR
    try:
        OCR = PaddleOCR(lang="th", use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=True)
    except TypeError:
        OCR = PaddleOCR(lang="th", use_angle_cls=True)
except Exception:
    OCR = None

def extract_text(raw: bytes) -> tuple[str, float]:
    if OCR is None:
        raise RuntimeError("OCR engine is not available")
    pixels = np.asarray(Image.open(io.BytesIO(raw)).convert("RGB"))
    if max(pixels.shape[:2]) < 2200:
        scale = 2200 / max(pixels.shape[:2])
        pixels = cv2.resize(pixels, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    lines, scores = [], []
    if hasattr(OCR, "predict"):
        pages = OCR.predict(pixels)
        for page in pages:
            data = page if isinstance(page, dict) else page.json
            lines.extend(str(item).strip() for item in data.get("rec_texts", []) if str(item).strip())
            scores.extend(float(item) for item in data.get("rec_scores", []))
    else:
        pages = OCR.ocr(pixels, cls=True) or []
        for page in pages:
            for item in page or []:
                if len(item) >= 2:
                    lines.append(str(item[1][0]).strip())
                    scores.append(float(item[1][1]))
    return "\n".join(lines), sum(scores) / len(scores) if scores else 0.0

def extract_amount(text: str) -> float | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    labels = ("จำนวนเงินที่ชำระ", "จำนวนเงิน", "ยอดชำระ", "ยอดรวม", "total", "amount")
    for index, line in enumerate(lines):
        if any(label in line.lower().replace(" ", "") for label in labels):
            matches = re.findall(r"(?<!\d)(\d{1,7}(?:[,.]\d{1,2})?)(?:\s*(?:บาท|thb))?", " ".join(lines[index:index + 3]), re.I)
            if matches:
                return float(matches[-1].replace(",", ""))
    matches = re.findall(r"(?<!\d)(\d{1,7}[,.]\d{2})(?:\s*(?:บาท|thb))?", text, re.I)
    return float(matches[-1].replace(",", "")) if matches else None

def extract_datetime(text: str) -> tuple[str | None, str | None]:
    match = re.search(r"(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?", text)
    if not match:
        return None, None
    day, month, year = map(int, match.group(1, 2, 3))
    if year > 2400: year -= 543
    elif year < 100: year += 2000
    try: parsed = date(year, month, day)
    except ValueError: return None, None
    return parsed.isoformat(), (f"{int(match.group(4)):02d}:{match.group(5)}" if match.group(4) else None)

def extract_merchant(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for index, line in enumerate(lines):
        if any(token in line for token in ("จำนวน", "รายการ", "สินค้า")) and index:
            return lines[index - 1]
    return next((line for line in lines if any(token in line.upper() for token in ("CO.,", "LTD", "ร้าน", "JAMPHA"))), None)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ocr", "engine": "paddleocr" if OCR else "unavailable"}

@app.post("/extract/slip")
async def extract_slip(file: UploadFile = File(...)) -> dict:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are supported")
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large")
    try:
        text, ocr_confidence = extract_text(raw)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"OCR engine unavailable: {error}") from error
    transaction_date, transaction_time = extract_datetime(text)
    amount = extract_amount(text)
    return {"documentType": "bank_slip", "amount": amount, "transactionDate": transaction_date, "transactionTime": transaction_time, "merchant": extract_merchant(text), "source": "slip_scan", "confidence": round(min(0.99, ocr_confidence * (1 if amount is not None else 0.55)), 3), "rawText": text}
