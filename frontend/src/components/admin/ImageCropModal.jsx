import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";

const MAX_ZOOM = 3;
const FRAME_MAX_W = 440;
const FRAME_MAX_H = 360;

function outputSize(aspect) {
  const maxW = 1200;
  const maxH = 800;
  let w = maxW;
  let h = Math.round(maxW / aspect);
  if (h > maxH) {
    h = maxH;
    w = Math.round(maxH * aspect);
  }
  return { w, h };
}

function clampOffset(ox, oy, scale, nW, nH, frameW, frameH) {
  const dw = nW * scale;
  const dh = nH * scale;
  return {
    x: Math.min(0, Math.max(frameW - dw, ox)),
    y: Math.min(0, Math.max(frameH - dh, oy)),
  };
}

function ImageCropModal({
  src,
  aspect = 1.5,
  shape = "rect",
  onCancel,
  onApply,
}) {
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);

  offsetRef.current = offset;
  zoomRef.current = zoom;

  const frame = useMemo(() => {
    let w = FRAME_MAX_W;
    let h = Math.round(w / aspect);
    if (h > FRAME_MAX_H) {
      h = FRAME_MAX_H;
      w = Math.round(h * aspect);
    }
    return { w, h };
  }, [aspect]);

  const minScale =
    natural.w && natural.h
      ? Math.max(frame.w / natural.w, frame.h / natural.h)
      : 1;
  const scale = minScale * zoom;

  const applyOffset = useCallback(
    (ox, oy, nextScale = scale) => {
      setOffset(
        clampOffset(ox, oy, nextScale, natural.w, natural.h, frame.w, frame.h),
      );
    },
    [scale, natural.w, natural.h, frame.w, frame.h],
  );

  const changeZoom = useCallback(
    (nextZoom) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
      const oldScale = minScale * zoomRef.current;
      const newScale = minScale * z;
      const cx = frame.w / 2;
      const cy = frame.h / 2;
      const { x: ox, y: oy } = offsetRef.current;
      const ix = (cx - ox) / oldScale;
      const iy = (cy - oy) / oldScale;
      setZoom(z);
      applyOffset(cx - ix * newScale, cy - iy * newScale, newScale);
    },
    [minScale, frame.w, frame.h, applyOffset],
  );

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const nW = img.naturalWidth;
      const nH = img.naturalHeight;
      setNatural({ w: nW, h: nH });
      const cover = Math.max(frame.w / nW, frame.h / nH);
      setZoom(1);
      setOffset({
        x: (frame.w - nW * cover) / 2,
        y: (frame.h - nH * cover) / 2,
      });
      setReady(true);
      setError("");
    };
    img.onerror = () => {
      setError("Không tải được ảnh. Hãy chọn ảnh khác.");
    };
    img.src = src;
  }, [src, frame.w, frame.h]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      changeZoom(zoomRef.current + (e.deltaY > 0 ? -0.12 : 0.12));
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [changeZoom, ready]);

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    applyOffset(
      dragRef.current.ox + (e.clientX - dragRef.current.x),
      dragRef.current.oy + (e.clientY - dragRef.current.y),
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleApply = async () => {
    const img = imgRef.current;
    if (!img || applying) return;
    setApplying(true);
    try {
      const { w, h } = outputSize(aspect);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(
        img,
        -offset.x / scale,
        -offset.y / scale,
        frame.w / scale,
        frame.h / scale,
        0,
        0,
        w,
        h,
      );
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Không tạo được ảnh"))),
          "image/jpeg",
          0.92,
        );
      });
      try {
        await onApply(blob);
      } catch {
        setApplying(false);
      }
    } catch {
      setError("Không áp dụng được khung ảnh. Hãy thử lại.");
      setApplying(false);
    }
  };

  return createPortal(
    <div className="image-crop-overlay" role="dialog" aria-modal="true">
      <div className="image-crop-modal">
        <h3>Điều chỉnh ảnh</h3>
        <p className="image-crop-hint">
          Kéo ảnh để chọn phần hiển thị, dùng thanh zoom để phóng to / thu nhỏ.
        </p>

        {error ? <p className="image-crop-error">{error}</p> : null}

        <div className="image-crop-board">
          {ready ? (
            <div
              ref={stageRef}
              className={`image-crop-stage${shape === "circle" ? " is-circle" : ""}`}
              style={{ width: frame.w, height: frame.h }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  width: natural.w * scale,
                  height: natural.h * scale,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            </div>
          ) : (
            <p className="image-crop-loading">Đang tải ảnh...</p>
          )}
        </div>

        <div className="image-crop-zoom">
          <button
            type="button"
            className="image-crop-zoom-btn"
            onClick={() => changeZoom(zoom - 0.15)}
            disabled={!ready || zoom <= 1}
            aria-label="Thu nhỏ"
          >
            <Minus size={16} />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!ready}
            onChange={(e) => changeZoom(Number(e.target.value))}
          />
          <button
            type="button"
            className="image-crop-zoom-btn"
            onClick={() => changeZoom(zoom + 0.15)}
            disabled={!ready || zoom >= MAX_ZOOM}
            aria-label="Phóng to"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="image-crop-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onCancel}
            disabled={applying}
          >
            Hủy
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleApply}
            disabled={!ready || Boolean(error) || applying}
          >
            {applying ? "Đang lưu..." : "Áp dụng"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ImageCropModal;
