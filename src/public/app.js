// Kenya Default Center Coordinates (Overlooking Nairobi & Southern transit corridors)
const DEFAULT_CENTER = [-1.2864, 36.8172];

let map;
let routePolylines = [];
let stopMarkers = [];
let vehicleMarkers = new Map();
let currentRoutes = [];
let allVehicles = [];
let regions = [];
let selectedRegion = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  await loadRegions();
  await loadRoutes();
  await loadVehicles();
  setupEventListeners();
  connectSseStream();
});

function initMap() {
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView(DEFAULT_CENTER, 8);

  // CartoDB Dark Matter tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);
}

async function loadRegions() {
  try {
    const res = await fetch('/api/v1/transit/regions');
    const data = await res.json();
    if (!data.success) return;

    regions = data.regions;
    const select = document.getElementById('region-filter');
    select.innerHTML = '';

    regions.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      select.appendChild(opt);
    });

    selectedRegion = select.value || 'all';
  } catch (err) {
    console.error('Failed to load transit regions:', err);
  }
}

async function loadRoutes() {
  try {
    const query = selectedRegion === 'all' ? '' : `?region=${selectedRegion}`;
    const res = await fetch(`/api/v1/transit/routes${query}`);
    const data = await res.json();
    if (!data.success) return;

    currentRoutes = data.routes;
    populateRouteFilter(currentRoutes);
    renderRoutesOnMap(currentRoutes);
    updateLegend(currentRoutes);
  } catch (err) {
    console.error('Failed to load transit routes:', err);
  }
}

function populateRouteFilter(routes) {
  const select = document.getElementById('route-filter');
  select.innerHTML = '<option value="ALL">All Routes in Region</option>';

  routes.forEach(route => {
    const opt = document.createElement('option');
    opt.value = route.routeId;
    opt.textContent = `${route.routeShortName} - ${route.routeLongName}`;
    select.appendChild(opt);
  });
}

function renderRoutesOnMap(routes) {
  routePolylines.forEach(layer => map.removeLayer(layer));
  stopMarkers.forEach(layer => map.removeLayer(layer));
  routePolylines = [];
  stopMarkers = [];

  routes.forEach(route => {
    const latlngs = route.stops.map(s => [s.latitude, s.longitude]);
    const color = `#${route.routeColor || '3B82F6'}`;

    const polyline = L.polyline(latlngs, {
      color,
      weight: 4,
      opacity: 0.85,
      dashArray: '2, 6'
    }).addTo(map);

    routePolylines.push(polyline);

    route.stops.forEach(stop => {
      const stopIcon = L.divIcon({
        className: 'stop-marker-icon',
        html: `<div class="stop-marker-pin" style="border-color: ${color};"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1">
            <div class="font-bold text-sm text-slate-100">${stop.stopName}</div>
            <div class="text-xs text-slate-400 mt-0.5">${route.routeShortName} · Stage #${stop.sequence}</div>
          </div>
        `);

      stopMarkers.push(marker);
    });
  });
}

function updateLegend(routes) {
  const container = document.getElementById('legend-items');
  if (!container) return;
  container.innerHTML = '';

  routes.slice(0, 5).forEach(r => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 truncate';
    div.innerHTML = `
      <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: #${r.routeColor || '3B82F6'}"></span>
      <span class="truncate">${r.routeShortName}: ${r.routeLongName}</span>
    `;
    container.appendChild(div);
  });
}

async function loadVehicles() {
  try {
    const query = selectedRegion === 'all' ? '' : `?region=${selectedRegion}`;
    const res = await fetch(`/api/v1/transit/vehicles${query}`);
    const data = await res.json();
    if (data.success) {
      allVehicles = data.vehicles;
      updateVehiclesUI();
    }
  } catch (err) {
    console.error('Failed to load vehicles:', err);
  }
}

function updateVehiclesUI() {
  const selectedRoute = document.getElementById('route-filter').value;
  let filtered = allVehicles;

  if (selectedRegion !== 'all') {
    filtered = filtered.filter(v => v.regionId === selectedRegion);
  }

  if (selectedRoute !== 'ALL') {
    filtered = filtered.filter(v => v.routeId === selectedRoute);
  }

  document.getElementById('stat-active-vehicles').textContent = `${allVehicles.length} Active Vehicles`;
  document.getElementById('vehicle-count-badge').textContent = filtered.length;

  renderVehicleList(filtered);
  renderVehicleMarkers(filtered);
}

function renderVehicleList(vehicles) {
  const listEl = document.getElementById('vehicles-list');

  if (vehicles.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-sm">
        <p>No active vehicles in this selection.</p>
        <p class="text-xs mt-1">Start the simulator to stream live telemetry across Kenya!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  vehicles.forEach(v => {
    const nextEta = v.etas && v.etas[0];
    const mins = nextEta ? Math.ceil(nextEta.etaSeconds / 60) : 0;
    const stageName = nextEta ? nextEta.stopName : 'Destination';

    const card = document.createElement('div');
    card.className = 'bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 hover:border-amber-500/60 transition cursor-pointer';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">🚐</span>
          <div>
            <span class="font-bold text-sm text-slate-200">${v.vehicleId.toUpperCase()}</span>
            <span class="text-xs text-slate-400 block">${v.routeId}</span>
          </div>
        </div>
        <span class="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium">
          ${Math.round(v.speedKmh)} km/h
        </span>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span class="text-slate-400">Next: <strong class="text-slate-200">${stageName}</strong></span>
        <span class="text-amber-400 font-semibold">${mins > 0 ? `~${mins} mins` : 'Arriving'}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      map.flyTo([v.latitude, v.longitude], 15);
      const marker = vehicleMarkers.get(v.vehicleId);
      if (marker) marker.openPopup();
    });

    listEl.appendChild(card);
  });
}

function renderVehicleMarkers(vehicles) {
  const currentIds = new Set(vehicles.map(v => v.vehicleId));

  for (const [id, marker] of vehicleMarkers.entries()) {
    if (!currentIds.has(id)) {
      map.removeLayer(marker);
      vehicleMarkers.delete(id);
    }
  }

  vehicles.forEach(v => {
    const nextEta = v.etas && v.etas[0];
    const etaText = nextEta ? `~${Math.ceil(nextEta.etaSeconds / 60)} min to ${nextEta.stopName}` : 'In transit';

    const icon = L.divIcon({
      className: 'matatu-marker-icon',
      html: `
        <div class="matatu-marker-pin">
          🚐
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const popupHtml = `
      <div class="p-1">
        <div class="font-bold text-sm text-amber-400 flex items-center justify-between">
          <span>Matatu ${v.vehicleId.toUpperCase()}</span>
          <span class="text-xs bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded">${Math.round(v.speedKmh)} km/h</span>
        </div>
        <div class="text-xs text-slate-300 mt-1">Route: <strong>${v.routeId}</strong></div>
        <div class="text-xs text-emerald-400 mt-0.5">${etaText}</div>
      </div>
    `;

    if (vehicleMarkers.has(v.vehicleId)) {
      const marker = vehicleMarkers.get(v.vehicleId);
      marker.setLatLng([v.latitude, v.longitude]);
      marker.setPopupContent(popupHtml);
    } else {
      const marker = L.marker([v.latitude, v.longitude], { icon })
        .addTo(map)
        .bindPopup(popupHtml);
      vehicleMarkers.set(v.vehicleId, marker);
    }
  });
}

function setupEventListeners() {
  document.getElementById('region-filter').addEventListener('change', async (e) => {
    selectedRegion = e.target.value;
    const reg = regions.find(r => r.id === selectedRegion);
    if (reg) {
      map.flyTo([reg.center.latitude, reg.center.longitude], reg.zoom);
    }
    await loadRoutes();
    await loadVehicles();
  });

  document.getElementById('route-filter').addEventListener('change', () => {
    updateVehiclesUI();
  });

  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadVehicles();
  });

  document.getElementById('btn-simulate').addEventListener('click', async () => {
    const btn = document.getElementById('btn-simulate');
    btn.disabled = true;
    document.getElementById('sim-btn-text').textContent = 'Pinging...';

    try {
      // Send a test ping depending on region
      let mockLat = -1.2864 + (Math.random() - 0.5) * 0.01;
      let mockLng = 36.8172 + (Math.random() - 0.5) * 0.01;
      let mockRoute = 'route-nrb-rongai-cbd';

      if (selectedRegion === 'mombasa') {
        mockLat = -4.0240 + (Math.random() - 0.5) * 0.01;
        mockLng = 39.6930 + (Math.random() - 0.5) * 0.01;
        mockRoute = 'route-bamburi-posta';
      }

      await fetch('/api/v1/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: 'kdd-demo-1',
          routeId: mockRoute,
          latitude: mockLat,
          longitude: mockLng,
          speedKmh: 40,
          occupancyStatus: 'MANY_SEATS_AVAILABLE'
        })
      });

      await loadVehicles();
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      btn.disabled = false;
      document.getElementById('sim-btn-text').textContent = 'Send Simulated Ping';
    }
  });
}

function connectSseStream() {
  const eventSource = new EventSource('/api/v1/transit/stream');

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'SNAPSHOT') {
        allVehicles = payload.vehicles || [];
        updateVehiclesUI();
      } else if (payload.type === 'VEHICLE_UPDATED') {
        const idx = allVehicles.findIndex(v => v.vehicleId === payload.vehicle.vehicleId);
        if (idx >= 0) {
          allVehicles[idx] = payload.vehicle;
        } else {
          allVehicles.push(payload.vehicle);
        }
        updateVehiclesUI();
      }
    } catch (err) {
      // Ignored
    }
  };

  eventSource.onerror = () => {
    console.warn('SSE stream disconnected, polling fallback every 5s...');
    setTimeout(loadVehicles, 5000);
  };
}
