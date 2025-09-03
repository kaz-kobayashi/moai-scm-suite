import React, { useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers (required for Webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
  id: number;
  name: string;
  type: 'depot' | 'customer';
}

interface RouteStep {
  type: string;
  location_index: number;
  id?: number;
  description?: string;
}

interface Route {
  vehicle: number;
  description: string;
  steps: RouteStep[];
}

interface VRPMapVisualizationProps {
  locations: Location[];
  routes: Route[];
  matrices?: {
    car: {
      durations: number[][];
      distances: number[][];
    };
  };
}

const VRPMapVisualization: React.FC<VRPMapVisualizationProps> = ({ 
  locations, 
  routes, 
  matrices 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    // Initialize map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([locations[0].lat, locations[0].lng], 13);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create custom icons
    const depotIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const customerIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Add location markers
    locations.forEach((location) => {
      const marker = L.marker([location.lat, location.lng], {
        icon: location.type === 'depot' ? depotIcon : customerIcon
      }).addTo(map);
      
      marker.bindPopup(`
        <div>
          <strong>${location.name}</strong><br/>
          タイプ: ${location.type === 'depot' ? 'デポ' : '顧客'}<br/>
          ID: ${location.id}<br/>
          座標: (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})
        </div>
      `);
    });

    // Draw routes
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    routes.forEach((route, routeIndex) => {
      const color = colors[routeIndex % colors.length];
      const routeCoords: [number, number][] = [];

      route.steps.forEach((step) => {
        const location = locations.find(loc => loc.id === step.location_index);
        if (location) {
          routeCoords.push([location.lat, location.lng]);
        }
      });

      if (routeCoords.length > 1) {
        const polyline = L.polyline(routeCoords, {
          color: color,
          weight: 4,
          opacity: 0.7
        }).addTo(map);

        // Add route popup
        polyline.bindPopup(`
          <div>
            <strong>ルート ${routeIndex + 1}</strong><br/>
            ${route.description}<br/>
            ステップ数: ${route.steps.length}
          </div>
        `);

        // Add numbered markers for route order
        route.steps.forEach((step, stepIndex) => {
          const location = locations.find(loc => loc.id === step.location_index);
          if (location) {
            const orderMarker = L.divIcon({
              html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white;">${stepIndex + 1}</div>`,
              className: 'route-order-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            L.marker([location.lat, location.lng], {
              icon: orderMarker
            }).addTo(map);
          }
        });
      }
    });

    // Fit map to show all locations
    if (locations.length > 0) {
      const group = L.featureGroup(
        locations.map(loc => L.marker([loc.lat, loc.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations, routes]);

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ color: '#27ae60', marginBottom: '15px' }}>配送ルート地図</h4>
      <div 
        ref={mapRef} 
        style={{ 
          height: '500px', 
          width: '100%', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }} 
      />
      <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
        <p>
          🔴 赤いマーカー: デポ（拠点）&nbsp;&nbsp;&nbsp;
          🔵 青いマーカー: 顧客&nbsp;&nbsp;&nbsp;
          番号付きマーカー: ルートの順序
        </p>
      </div>
    </div>
  );
};

export default VRPMapVisualization;