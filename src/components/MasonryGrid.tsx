import { useState, useEffect, useRef, useMemo } from 'react';
import type { GalleryImage } from '@/lib/useGallery';
import PhotoCard from './PhotoCard';

const ratioCache = new Map<string, number>();
const DEFAULT_RATIO = 3 / 2;
const GAP = 12;
const PADDING = 20;

interface Pos {
  left: number;
  top: number;
  width: number;
  height: number;
}

function calcLayout(
  images: GalleryImage[],
  ratios: Map<string, number>,
  columns: number,
  innerWidth: number,
): { positions: Pos[]; height: number } {
  if (images.length === 0 || innerWidth <= 0 || columns === 0)
    return { positions: [], height: 0 };

  const colW = (innerWidth - (columns - 1) * GAP) / columns;
  const colH = new Array(columns).fill(0);
  const positions: Pos[] = [];

  for (const img of images) {
    const ratio = ratios.get(img.key) ?? DEFAULT_RATIO;
    const h = colW / ratio;
    const col = colH.indexOf(Math.min(...colH));
    positions.push({
      left: col * (colW + GAP),
      top: colH[col],
      width: colW,
      height: h,
    });
    colH[col] += h + GAP;
  }

  return { positions, height: Math.max(...colH, 0) };
}

interface MasonryGridProps {
  images: GalleryImage[];
  onImageClick: (img: GalleryImage) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ images, onImageClick }) => {
  const [columns, setColumns] = useState(4);
  const [innerWidth, setInnerWidth] = useState(1200);
  const [cacheVer, setCacheVer] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const knownKeys = useRef(new Set<string>());

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 640) setColumns(1);
      else if (w < 768) setColumns(2);
      else if (w < 1024) setColumns(3);
      else if (w < 1280) setColumns(4);
      else setColumns(5);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setInnerWidth(el.clientWidth - PADDING * 2);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const newImgs = images.filter((img) => !knownKeys.current.has(img.key));
    if (newImgs.length === 0) return;
    for (const img of newImgs) knownKeys.current.add(img.key);

    const uncached = newImgs.filter((img) => !ratioCache.has(img.key));
    if (uncached.length === 0) return;

    let loaded = 0;
    for (const img of uncached) {
      const el = new Image();
      el.onload = () => {
        ratioCache.set(img.key, el.naturalWidth / el.naturalHeight);
        loaded++;
        if (loaded >= uncached.length) setCacheVer((v) => v + 1);
      };
      el.onerror = () => {
        ratioCache.set(img.key, DEFAULT_RATIO);
        loaded++;
        if (loaded >= uncached.length) setCacheVer((v) => v + 1);
      };
      el.src = img.url;
    }
  }, [images]);

  const layout = useMemo(
    () => calcLayout(images, ratioCache, columns, innerWidth),
    // cacheVer triggers recalculation when preloads finish
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, columns, innerWidth, cacheVer],
  );

  return (
    <div
      ref={containerRef}
      className="relative p-5"
      style={{ height: layout.height }}
    >
      {images.map((img, i) => {
        const p = layout.positions[i];
        const known = ratioCache.has(img.key);
        return (
          <div
            key={img.key}
            className={known ? '' : 'animate-pulse'}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.width,
              height: p.height,
            }}
          >
            {known ? (
              <PhotoCard
                image={img}
                onClick={() => onImageClick(img)}
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg w-full h-full" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MasonryGrid;
