// Pagina Leaflet + OpenStreetMap autonoma, caricata dentro una WebView.
// Non richiede alcuna API key. La comunicazione con React Native avviene
// tramite window.ReactNativeWebView.postMessage (WebView -> RN) e
// injectJavaScript (RN -> WebView, vedi LeafletMap.tsx).
export function buildLeafletHtml(centerLat: number, centerLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #eef1f4; }
    .parkfree-marker {
      width: 26px; height: 26px; border-radius: 50%;
      border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    .parkfree-user {
      width: 16px; height: 16px; border-radius: 50%;
      background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(37,99,235,0.25);
    }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var markers = {};
    var userMarker = null;

    function postToRN(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function colorFor(status) {
      if (status === 'free') return '#2E9E5B';
      if (status === 'occupied') return '#D64545';
      return '#B8860B';
    }

    window.setSpots = function(spots) {
      var seen = {};
      spots.forEach(function(spot) {
        seen[spot.id] = true;
        var icon = L.divIcon({
          className: '',
          html: '<div class="parkfree-marker" style="background:' + colorFor(spot.status) + '"></div>',
          iconSize: [26, 26],
        });
        if (markers[spot.id]) {
          markers[spot.id].setLatLng([spot.lat, spot.lng]);
          markers[spot.id].setIcon(icon);
        } else {
          var marker = L.marker([spot.lat, spot.lng], { icon: icon }).addTo(map);
          marker.on('click', function() {
            postToRN({ type: 'spotTap', id: spot.id });
          });
          markers[spot.id] = marker;
        }
      });
      Object.keys(markers).forEach(function(id) {
        if (!seen[id]) {
          map.removeLayer(markers[id]);
          delete markers[id];
        }
      });
    };

    window.setUserLocation = function(lat, lng) {
      var icon = L.divIcon({ className: '', html: '<div class="parkfree-user"></div>', iconSize: [16, 16] });
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
      }
    };

    window.centerOn = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || map.getZoom());
    };

    map.on('load', function() {
      postToRN({ type: 'ready' });
    });
    postToRN({ type: 'ready' });
  </script>
</body>
</html>`;
}
