import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Route, Stop } from '../../models/types.js';
import { config } from '../../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadStaticRoutes(): Route[] {
  const routesPath = path.join(__dirname, 'mombasa-routes.json');
  const raw = fs.readFileSync(routesPath, 'utf-8');
  return JSON.parse(raw) as Route[];
}

export function getAllStops(): Stop[] {
  const routes = loadStaticRoutes();
  const stopMap = new Map<string, Stop>();

  for (const route of routes) {
    for (const stop of route.stops) {
      if (!stopMap.has(stop.stopId)) {
        stopMap.set(stop.stopId, stop);
      }
    }
  }

  return Array.from(stopMap.values());
}

export function generateGtfsCsvFiles(): { [filename: string]: string } {
  const routes = loadStaticRoutes();
  const stops = getAllStops();

  // agency.txt
  const agencyTxt = [
    'agency_id,agency_name,agency_url,agency_timezone,agency_lang,agency_phone',
    `sacco-mombasa,"${config.gtfsAgencyName}","${config.gtfsAgencyUrl}","${config.gtfsAgencyTimezone}",sw,+254700000000`
  ].join('\n');

  // routes.txt
  const routesHeader = 'route_id,agency_id,route_short_name,route_long_name,route_type,route_color,route_text_color';
  const routesRows = routes.map(r =>
    `${r.routeId},sacco-mombasa,"${r.routeShortName}","${r.routeLongName}",3,${r.routeColor},FFFFFF`
  );
  const routesTxt = [routesHeader, ...routesRows].join('\n');

  // stops.txt
  const stopsHeader = 'stop_id,stop_name,stop_lat,stop_lon,location_type';
  const stopsRows = stops.map(s =>
    `${s.stopId},"${s.stopName}",${s.latitude},${s.longitude},0`
  );
  const stopsTxt = [stopsHeader, ...stopsRows].join('\n');

  // calendar.txt
  const calendarTxt = [
    'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
    'daily_service,1,1,1,1,1,1,1,20260101,20271231'
  ].join('\n');

  // trips.txt & stop_times.txt (sample base trips for static validation)
  const tripsHeader = 'route_id,service_id,trip_id,trip_headsign,direction_id';
  const stopTimesHeader = 'trip_id,arrival_time,departure_time,stop_id,stop_sequence';

  const tripRows: string[] = [];
  const stopTimesRows: string[] = [];

  for (const route of routes) {
    const tripId = `trip-${route.routeId}-regular`;
    const lastStop = route.stops[route.stops.length - 1];
    tripRows.push(`${route.routeId},daily_service,${tripId},"${lastStop.stopName}",0`);

    let currentMinute = 360; // 06:00 AM
    route.stops.forEach((stop, index) => {
      const hours = Math.floor(currentMinute / 60).toString().padStart(2, '0');
      const mins = (currentMinute % 60).toString().padStart(2, '0');
      const timeStr = `${hours}:${mins}:00`;
      stopTimesRows.push(`${tripId},${timeStr},${timeStr},${stop.stopId},${index + 1}`);
      currentMinute += 5; // ~5 mins between stages
    });
  }

  const tripsTxt = [tripsHeader, ...tripRows].join('\n');
  const stopTimesTxt = [stopTimesHeader, ...stopTimesRows].join('\n');

  return {
    'agency.txt': agencyTxt,
    'routes.txt': routesTxt,
    'stops.txt': stopsTxt,
    'calendar.txt': calendarTxt,
    'trips.txt': tripsTxt,
    'stop_times.txt': stopTimesTxt,
  };
}
