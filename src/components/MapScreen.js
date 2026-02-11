import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as turf from '@turf/turf';
import StatsCard from './StatsCard';
import { requestLocationPermissions } from '../utils/location';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOMTOM_API_KEY = 'AoGGy9rY3zDH74BIUOIvpreylbkzKSAA';

// =============================================================================
// HTML CONTENT FOR WEBVIEW (self-contained, no React Native code here!)
// =============================================================================
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>TomTom Map</title>
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'>
    <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8ecf1; }
        #map { width: 100%; height: 100%; }
        .mapboxgl-ctrl-logo { display: none !important; }
        .tt-logo { display: none !important; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Global error handler
        window.onerror = function(msg, src, line, col, err) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR', message: 'JS: ' + msg + ' (line ' + line + ')'
                }));
            }
        };

        var map, userMarker, is3D = false;

        function initMap() {
            try {
                if (!window.tt) {
                    throw new Error('TomTom SDK not loaded');
                }

                tt.setProductInfo('TomTomTracker', '1.0.0');

                map = tt.map({
                    key: '${TOMTOM_API_KEY}',
                    container: 'map',
                    style: 'https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json',
                    center: [0, 0],
                    zoom: 2,
                    pitch: 0,
                    bearing: 0,
                    dragRotate: true,
                    touchPitch: true
                });

                map.on('load', function() {
                    // Try to add 3D buildings
                    try {
                        var sources = map.getStyle().sources;
                        var sourceId = null;
                        if (sources.vectorTiles) sourceId = 'vectorTiles';
                        else if (sources.vector) sourceId = 'vector';
                        else if (sources.composite) sourceId = 'composite';

                        if (sourceId) {
                            map.addLayer({
                                id: '3d-buildings',
                                source: sourceId,
                                'source-layer': 'building',
                                filter: ['has', 'height'],
                                type: 'fill-extrusion',
                                minzoom: 13,
                                paint: {
                                    'fill-extrusion-color': '#c8cdd3',
                                    'fill-extrusion-height': ['get', 'height'],
                                    'fill-extrusion-base': ['get', 'min_height'],
                                    'fill-extrusion-opacity': 0.85
                                }
                            });
                        }
                    } catch(e) {
                        // 3D buildings optional, don't block
                    }

                    // Route source + layers
                    map.addSource('route', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });

                    // Territory source (for conquered area)
                    map.addSource('territory', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });

                    // Create stripe pattern for territory fill
                    var canvas = document.createElement('canvas');
                    canvas.width = 16;
                    canvas.height = 16;
                    var ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'rgba(29, 114, 184, 0.15)';
                    ctx.fillRect(0, 0, 16, 16);
                    ctx.strokeStyle = 'rgba(29, 114, 184, 0.35)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 16);
                    ctx.lineTo(16, 0);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(-4, 4);
                    ctx.lineTo(4, -4);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(12, 20);
                    ctx.lineTo(20, 12);
                    ctx.stroke();
                    var img = new Image();
                    img.src = canvas.toDataURL();
                    img.onload = function() {
                        if (!map.hasImage('stripe-pattern')) {
                            map.addImage('stripe-pattern', img);
                        }
                    };

                    // Territory fill layer
                    map.addLayer({
                        id: 'territory-fill',
                        type: 'fill',
                        source: 'territory',
                        paint: {
                            'fill-color': 'rgba(29, 114, 184, 0.2)',
                            'fill-outline-color': 'rgba(29, 114, 184, 0.5)'
                        }
                    });

                    // Territory pattern overlay
                    map.addLayer({
                        id: 'territory-pattern',
                        type: 'fill',
                        source: 'territory',
                        paint: {
                            'fill-pattern': 'stripe-pattern',
                            'fill-opacity': 0.6
                        }
                    });

                    // Territory border (bold)
                    map.addLayer({
                        id: 'territory-border',
                        type: 'line',
                        source: 'territory',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: {
                            'line-color': '#0D47A1',
                            'line-width': 4,
                            'line-dasharray': [2, 1]
                        }
                    });

                    // Route line layers (on top of territory)
                    map.addLayer({
                        id: 'route-line-shadow',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: { 'line-color': 'rgba(0, 30, 80, 0.15)', 'line-width': 16 }
                    });

                    map.addLayer({
                        id: 'route-line-casing',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: { 'line-color': '#0D3B66', 'line-width': 10 }
                    });

                    map.addLayer({
                        id: 'route-line-inner',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: { 'line-color': '#42A5F5', 'line-width': 6 }
                    });

                    // User marker
                    var el = document.createElement('div');
                    el.style.width = '24px';
                    el.style.height = '24px';
                    el.style.backgroundColor = '#1D72B8';
                    el.style.borderRadius = '50%';
                    el.style.border = '3px solid white';
                    el.style.boxShadow = '0 0 10px rgba(29,114,184,0.5)';

                    userMarker = new tt.Marker({ element: el }).setLngLat([0, 0]).addTo(map);

                    // Signal ready to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                });

            } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR', message: e.toString()
                }));
            }
        }

        function updateLocation(lat, lng, heading) {
            if (!map) return;
            var center = [lng, lat];
            userMarker.setLngLat(center);
            map.easeTo({
                center: center,
                bearing: is3D ? (heading || 0) : 0,
                pitch: is3D ? 60 : 0,
                zoom: is3D ? 18 : 16,
                duration: 400
            });
        }

        function updatePath(geoJson) {
            if (!map || !map.getSource('route')) return;
            map.getSource('route').setData(geoJson);
        }

        function showTerritory(geoJson) {
            if (!map || !map.getSource('territory')) return;
            map.getSource('territory').setData(geoJson);
        }

        function clearTerritory() {
            if (!map || !map.getSource('territory')) return;
            map.getSource('territory').setData({ type: 'FeatureCollection', features: [] });
        }

        function setMode(enable3D) {
            is3D = enable3D;
            map.easeTo({
                pitch: is3D ? 60 : 0,
                zoom: is3D ? 18 : 16,
                duration: 1500
            });
        }

        // Listen for messages from React Native
        document.addEventListener('message', function(e) { handleMsg(e.data); });
        window.addEventListener('message', function(e) { handleMsg(e.data); });

        function handleMsg(str) {
            try {
                var d = JSON.parse(str);
                if (d.type === 'UPDATE_LOCATION') updateLocation(d.lat, d.lng, d.heading);
                else if (d.type === 'UPDATE_PATH') updatePath(d.geoJson);
                else if (d.type === 'SET_MODE') setMode(d.enable3D);
                else if (d.type === 'SHOW_TERRITORY') showTerritory(d.geoJson);
                else if (d.type === 'CLEAR_TERRITORY') clearTerritory();
            } catch(e) {}
        }

        initMap();
    </script>
</body>
</html>
`;


// =============================================================================
// REACT NATIVE COMPONENT
// =============================================================================

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [stats, setStats] = useState({ area: 0, distance: 0, perimeter: 0 });
  const [is3DMode, setIs3DMode] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const webViewRef = useRef(null);
  const pathRef = useRef([]);
  const subscription = useRef(null);

  // 1. Initial Location & Permission
  useEffect(() => {
    (async () => {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please enable location permissions.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // 2. Sync location with WebView
  useEffect(() => {
    if (location && mapReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'UPDATE_LOCATION',
        lat: location.latitude,
        lng: location.longitude,
        heading: location.heading || 0
      }));
    }
  }, [location, mapReady]);

  // 3. Toggle 3D
  const toggle3DMode = () => {
    const newMode = !is3DMode;
    setIs3DMode(newMode);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'SET_MODE', enable3D: newMode }));
    }
  };

  // 4. Start Tracking
  const startTracking = async () => {
    setTracking(true);
    pathRef.current = [];
    setStats({ area: 0, distance: 0, perimeter: 0 });

    setIs3DMode(true);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'SET_MODE', enable3D: true }));
    }

    // Clear any previous territory when starting new tracking
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'CLEAR_TERRITORY' }));
    }

    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 3 },
      (newLoc) => {
        const { latitude, longitude, speed, accuracy, heading } = newLoc.coords;
        const newPoint = { latitude, longitude };

        // Always update marker position
        setLocation(newLoc.coords);

        // --- GPS Jitter Filter ---
        let shouldAdd = true;

        // 1. Skip if accuracy is poor
        if (accuracy && accuracy > 25) shouldAdd = false;

        // 2. Skip if speed is near-zero (standing still)
        if (speed !== null && speed !== undefined && speed < 0.5 && pathRef.current.length > 0) {
          shouldAdd = false;
        }

        // 3. Skip if distance from last point < 5m
        if (shouldAdd && pathRef.current.length > 0) {
          const last = pathRef.current[pathRef.current.length - 1];
          const from = turf.point([last.longitude, last.latitude]);
          const to = turf.point([longitude, latitude]);
          const dist = turf.distance(from, to, { units: 'meters' });
          if (dist < 5) shouldAdd = false;
        }

        if (shouldAdd) {
          pathRef.current.push(newPoint);

          // Calculate distance
          if (pathRef.current.length > 1) {
            const line = turf.lineString(pathRef.current.map(p => [p.longitude, p.latitude]));
            const totalDist = turf.length(line, { units: 'meters' });
            setStats(prev => ({ ...prev, distance: totalDist.toFixed(2) }));
          }

          // Send path to WebView
          if (webViewRef.current && pathRef.current.length > 1) {
            const geoJson = {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: pathRef.current.map(p => [p.longitude, p.latitude])
                }
              }]
            };
            webViewRef.current.postMessage(JSON.stringify({ type: 'UPDATE_PATH', geoJson }));
          }
        }
      }
    );
  };

  // 5. Stop Tracking
  const stopTracking = () => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
    setTracking(false);
    calculateFinalStats();
  };

  // 6. Calculate Area/Perimeter + Show Territory
  const calculateFinalStats = () => {
    const cp = pathRef.current;
    if (cp.length < 3) {
      Alert.alert('Info', 'Path too short for area calculation.');
      return;
    }
    // Close the polygon
    const coords = [...cp.map(p => [p.longitude, p.latitude]), [cp[0].longitude, cp[0].latitude]];
    try {
      const poly = turf.polygon([coords]);
      const areaVal = turf.area(poly);
      const perimVal = turf.length(turf.lineString(coords), { units: 'meters' });
      setStats(prev => ({
        ...prev,
        area: areaVal.toFixed(2),
        perimeter: perimVal.toFixed(2)
      }));

      // Send territory polygon to WebView for "conquest" visualization
      if (webViewRef.current) {
        const territoryGeoJson = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coords]
            },
            properties: {}
          }]
        };
        webViewRef.current.postMessage(JSON.stringify({
          type: 'SHOW_TERRITORY',
          geoJson: territoryGeoJson
        }));
      }
    } catch (error) {
      console.warn('Turf calc error:', error);
    }
  };

  // Loading screen
  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D72B8" />
        <Text style={styles.loadingText}>Locating you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: MAP_HTML }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        androidLayerType="hardware"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'MAP_READY') {
              console.log('MAP RENDERED');
              setMapReady(true);
            } else if (data.type === 'ERROR') {
              console.error('MAP ERROR:', data.message);
            }
          } catch (e) { }
        }}
        onError={(e) => console.warn('WebView error:', e.nativeEvent)}
      />

      {/* Map loading overlay */}
      {!mapReady && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color="#1D72B8" />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}

      {/* Top Controls */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.modeBtn, is3DMode && styles.modeBtnActive]}
          onPress={toggle3DMode}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnLabel, is3DMode && styles.modeBtnLabelActive]}>
            {is3DMode ? '3D' : '2D'}
          </Text>
        </TouchableOpacity>
      </View>

      <StatsCard
        stats={stats}
        tracking={tracking}
        onStart={startTracking}
        onStop={stopTracking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fb' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555', fontWeight: '500' },
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: '#e8ecf1' },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  topBar: {
    position: 'absolute', top: 50, right: 16,
    flexDirection: 'column', gap: 12
  },
  modeBtn: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  modeBtnActive: { backgroundColor: '#1D72B8' },
  modeBtnLabel: { fontWeight: '900', fontSize: 15, color: '#333' },
  modeBtnLabelActive: { color: '#fff' },
});
