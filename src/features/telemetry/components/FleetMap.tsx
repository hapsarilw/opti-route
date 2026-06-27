'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Popup, type MapRef } from 'react-map-gl/mapbox';
import type {
  GeoJSONSource,
  Map as MapboxMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'mapbox-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { Layers, LocateFixed, Minus, Plus } from 'lucide-react';
import type { ActiveRoute, MonitoredFleet } from '@/types';
import { WAREHOUSE_ORIGIN } from '@/config/constants';
import { cn } from '@/lib/utils';
import { LEGEND_ORDER, MONITOR_STATUS } from '../lib/status';
import {
  emptyPointFC,
  toFleetFeatureCollection,
  toRouteDropoffsFeatureCollection,
  toRouteLineFeature,
} from '../lib/geo';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type AddLayer = Parameters<MapboxMap['addLayer']>[0];

const EMPTY_LINE: Feature<LineString> = {
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: [] },
  properties: {},
};

interface FleetMapProps {
  fleets: MonitoredFleet[];
  route: ActiveRoute | null;
  selectedId: string | null;
  onSelectFleet: (id: string | null) => void;
}

/** White directional chevron baked into a canvas → reused as an SDF-free icon. */
function makeArrowImage(): ImageData {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(size / 2, 3); // apex = north (heading 0)
  ctx.lineTo(size - 5, size - 6);
  ctx.lineTo(size / 2, size - 10);
  ctx.lineTo(5, size - 6);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(7,17,12,0.85)';
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

const ROUTE_LAYERS = ['route-glow', 'route-line', 'route-drop-circle', 'route-drop-label'];

/**
 * FleetMap — Mapbox GL (react-map-gl wrapper) with a Canvas/WebGL fleet layer.
 *
 * Performance (Doc 02 §4.4): vehicles live in ONE clustered GeoJSON source; every
 * telemetry tick updates it via `setData()` rather than re-creating layers, so
 * 100+ markers stay smooth. No DOM marker per vehicle.
 *
 * Memory (Doc 02 §4.4 / SDD §14): the setup effect adds sources/layers/listeners
 * once and its cleanup removes every listener + layer + source. The underlying GL
 * context (map.remove()) is owned by the react-map-gl <Map> wrapper on unmount —
 * together this guarantees nothing accumulates when /map is opened repeatedly.
 */
export default function FleetMap({ fleets, route, selectedId, onSelectFleet }: FleetMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapObj, setMapObj] = useState<MapboxMap | null>(null);
  const [showRoute, setShowRoute] = useState(true);

  // Keep the latest select handler in a ref so the (mount-once) click listener
  // never goes stale without being re-registered.
  const onSelectRef = useRef(onSelectFleet);
  useEffect(() => {
    onSelectRef.current = onSelectFleet;
  }, [onSelectFleet]);

  const fleetFC = useMemo<FeatureCollection<Point>>(() => toFleetFeatureCollection(fleets), [fleets]);
  const routeLine = useMemo<Feature<LineString>>(
    () => (route ? toRouteLineFeature(route) : EMPTY_LINE),
    [route],
  );
  const dropsFC = useMemo<FeatureCollection<Point>>(
    () => (route ? toRouteDropoffsFeatureCollection(route) : emptyPointFC()),
    [route],
  );

  // ── Setup sources/layers/listeners once per map instance, with full cleanup ──
  useEffect(() => {
    const map = mapObj;
    if (!map) return;

    if (!map.hasImage('fleet-arrow')) {
      map.addImage('fleet-arrow', makeArrowImage(), { pixelRatio: 2 });
    }

    if (!map.getSource('fleet')) {
      map.addSource('fleet', {
        type: 'geojson',
        data: fleetFC,
        cluster: true,
        clusterRadius: 46,
        clusterMaxZoom: 11,
      });
    }
    if (!map.getSource('route-line')) map.addSource('route-line', { type: 'geojson', data: routeLine });
    if (!map.getSource('route-drops')) map.addSource('route-drops', { type: 'geojson', data: dropsFC });

    const layers: AddLayer[] = [
      // Route (drawn under the vehicles)
      {
        id: 'route-glow',
        type: 'line',
        source: 'route-line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#22D3EE', 'line-width': 9, 'line-opacity': 0.22, 'line-blur': 3 },
      },
      {
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#22D3EE', 'line-width': 3, 'line-dasharray': [1.6, 1.1], 'line-opacity': 0.95 },
      },
      {
        id: 'route-drop-circle',
        type: 'circle',
        source: 'route-drops',
        paint: {
          'circle-radius': 11,
          'circle-color': '#07140E',
          'circle-stroke-color': '#22D3EE',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'route-drop-label',
        type: 'symbol',
        source: 'route-drops',
        layout: {
          'text-field': ['to-string', ['get', 'seq']],
          'text-size': 12,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#22D3EE' },
      },
      // Clusters
      {
        id: 'clusters',
        type: 'circle',
        source: 'fleet',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#1E8A63', 5, '#176B4D', 12, '#22D3EE'],
          'circle-radius': ['step', ['get', 'point_count'], 15, 5, 19, 12, 24],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(7,17,12,0.9)',
        },
      },
      {
        id: 'cluster-count',
        type: 'symbol',
        source: 'fleet',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      },
      // Unclustered vehicles: colored dot + directional arrow
      {
        id: 'fleet-dot',
        type: 'circle',
        source: 'fleet',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 9,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': 'rgba(7,17,12,0.9)',
        },
      },
      {
        id: 'fleet-arrow',
        type: 'symbol',
        source: 'fleet',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': 'fleet-arrow',
          'icon-size': 0.62,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      },
    ];
    for (const layer of layers) if (!map.getLayer(layer.id)) map.addLayer(layer);

    // ── Interaction listeners ──
    const onFleetClick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.fleet_id;
      if (id) onSelectRef.current(String(id));
    };
    const onClusterClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      const src = map.getSource('fleet') as GeoJSONSource | undefined;
      if (clusterId == null || !src) return;
      src.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        map.easeTo({ center: (feature!.geometry as Point).coordinates as [number, number], zoom, duration: 500 });
      });
    };
    const setPointer = () => { map.getCanvas().style.cursor = 'pointer'; };
    const clearPointer = () => { map.getCanvas().style.cursor = ''; };
    const onBgClick = (e: MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point, { layers: ['fleet-dot', 'clusters'] });
      if (hits.length === 0) onSelectRef.current(null); // click empty map → deselect
    };

    map.on('click', 'fleet-dot', onFleetClick);
    map.on('click', 'clusters', onClusterClick);
    map.on('click', onBgClick);
    map.on('mouseenter', 'fleet-dot', setPointer);
    map.on('mouseleave', 'fleet-dot', clearPointer);
    map.on('mouseenter', 'clusters', setPointer);
    map.on('mouseleave', 'clusters', clearPointer);

    return () => {
      // map already torn down by the <Map> wrapper → nothing to clean.
      if (!map.getStyle()) return;
      map.off('click', 'fleet-dot', onFleetClick);
      map.off('click', 'clusters', onClusterClick);
      map.off('click', onBgClick);
      map.off('mouseenter', 'fleet-dot', setPointer);
      map.off('mouseleave', 'fleet-dot', clearPointer);
      map.off('mouseenter', 'clusters', setPointer);
      map.off('mouseleave', 'clusters', clearPointer);
      [...['cluster-count', 'clusters', 'fleet-arrow', 'fleet-dot'], ...ROUTE_LAYERS].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      ['fleet', 'route-line', 'route-drops'].forEach((id) => {
        if (map.getSource(id)) map.removeSource(id);
      });
    };
    // Setup runs once per map instance; data flows in through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapObj]);

  // ── Live updates via setData() (mutate the source, never re-create layers) ──
  useEffect(() => {
    (mapObj?.getSource('fleet') as GeoJSONSource | undefined)?.setData(fleetFC);
  }, [mapObj, fleetFC]);

  useEffect(() => {
    (mapObj?.getSource('route-line') as GeoJSONSource | undefined)?.setData(routeLine);
    (mapObj?.getSource('route-drops') as GeoJSONSource | undefined)?.setData(dropsFC);
  }, [mapObj, routeLine, dropsFC]);

  // Toggle the route layers' visibility (map controls "layer" button).
  useEffect(() => {
    if (!mapObj) return;
    const vis = showRoute ? 'visible' : 'none';
    ROUTE_LAYERS.forEach((id) => {
      if (mapObj.getLayer(id)) mapObj.setLayoutProperty(id, 'visibility', vis);
    });
  }, [mapObj, showRoute]);

  // Pan to a vehicle only when the *selection* changes (not on every tick).
  useEffect(() => {
    if (!mapObj || !selectedId) return;
    const f = fleets.find((x) => x.fleet_id === selectedId);
    if (f) {
      mapObj.easeTo({
        center: [f.position.lng, f.position.lat],
        zoom: Math.max(mapObj.getZoom(), 12),
        duration: 650,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapObj, selectedId]);

  const selected = selectedId ? fleets.find((f) => f.fleet_id === selectedId) ?? null : null;

  if (!MAPBOX_TOKEN) return <MapTokenFallback />;

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: WAREHOUSE_ORIGIN.lng, latitude: WAREHOUSE_ORIGIN.lat, zoom: 10 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onLoad={(e) => setMapObj(e.target as MapboxMap)}
      >
        {selected && (
          <Popup
            longitude={selected.position.lng}
            latitude={selected.position.lat}
            anchor="bottom"
            offset={20}
            closeButton={false}
            closeOnClick={false}
            onClose={() => onSelectFleet(null)}
            maxWidth="260px"
          >
            <FleetPopupCard fleet={selected} />
          </Popup>
        )}
      </Map>

      {/* Zoom / recenter / layer controls (bottom-left) */}
      <div className="absolute bottom-5 left-4 z-[15] flex flex-col gap-1">
        <div className="glass-panel flex flex-col overflow-hidden rounded-lg border border-border">
          <button
            aria-label="Zoom in"
            onClick={() => mapObj?.zoomIn()}
            className="flex h-[34px] w-[34px] items-center justify-center text-text-secondary hover:bg-surface-2"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => mapObj?.zoomOut()}
            className="flex h-[34px] w-[34px] items-center justify-center border-t border-border text-text-secondary hover:bg-surface-2"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <button
          aria-label="Recenter on warehouse"
          onClick={() => mapObj?.easeTo({ center: [WAREHOUSE_ORIGIN.lng, WAREHOUSE_ORIGIN.lat], zoom: 10, duration: 600 })}
          className="glass-panel flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-2"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
        <button
          aria-label="Toggle route layer"
          aria-pressed={showRoute}
          onClick={() => setShowRoute((v) => !v)}
          className={cn(
            'glass-panel flex h-[34px] w-[34px] items-center justify-center rounded-lg border',
            showRoute ? 'border-route/50 text-route' : 'border-border text-text-secondary hover:bg-surface-2',
          )}
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Legend (bottom-right) */}
      <div className="glass-panel absolute bottom-[72px] right-4 z-[15] rounded-xl border border-border p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[1.2px] text-text-muted">Fleet Status</div>
        <div className="flex flex-col gap-1.5">
          {LEGEND_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: MONITOR_STATUS[s].color }} />
              <span className="text-[11px] text-text-secondary">{MONITOR_STATUS[s].label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-2">
          <span className="h-[2.5px] w-5 rounded-full bg-route" />
          <span className="text-[11px] text-route">Active AI Route</span>
        </div>
      </div>
    </div>
  );
}

// ── Marker detail popup ──────────────────────────────────────────────────────
function FleetPopupCard({ fleet }: { fleet: MonitoredFleet }) {
  const s = MONITOR_STATUS[fleet.status];
  return (
    <div className="w-[224px] overflow-hidden rounded-[10px] border border-route/40 bg-glass shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5">
        <div className="min-w-0">
          <div className="font-mono text-[12px] font-bold text-route">{fleet.fleet_id}</div>
          <div className="truncate text-[11px] text-text-secondary">{fleet.driver_name}</div>
        </div>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold"
          style={{ color: s.color, background: `${s.color}22`, border: `1px solid ${s.color}40` }}
        >
          {s.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-3">
        <div className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
          <div className="font-display text-[15px] font-bold leading-none text-text-primary">
            {fleet.speed_kmh > 0 ? fleet.speed_kmh : 'STOP'}
          </div>
          <div className="mt-1 font-mono text-[8.5px] uppercase tracking-wide text-text-muted">km/h</div>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
          <div className="font-display text-[15px] font-bold leading-none text-text-primary">{fleet.eta}</div>
          <div className="mt-1 font-mono text-[8.5px] uppercase tracking-wide text-text-muted">ETA WIB</div>
        </div>
      </div>
      <div className="border-t border-border-subtle px-3 py-2">
        <div className="flex items-center gap-1.5 font-mono text-[9.5px]" style={{ color: s.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
          ACTIVE · {fleet.manifest_id}
        </div>
        <div className="mt-1 font-mono text-[9px] text-text-muted">
          heading {Math.round(fleet.heading)}° · {fleet.driver_name.split(' ')[0]}
        </div>
      </div>
    </div>
  );
}

// ── Fallback when no Mapbox token is configured ──────────────────────────────
function MapTokenFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-0">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="glass-panel relative z-10 max-w-sm rounded-xl border border-border p-5 text-center shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="font-display text-[14px] font-bold text-text-primary">Live basemap disabled</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
          Set <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-accent-bright">NEXT_PUBLIC_MAPBOX_TOKEN</code>{' '}
          in <span className="font-mono text-[11px]">.env.local</span> to enable the Mapbox WebGL map. The fleet
          panel and alerts continue to stream live telemetry.
        </p>
      </div>
    </div>
  );
}
