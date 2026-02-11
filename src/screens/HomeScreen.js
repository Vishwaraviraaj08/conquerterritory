import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Switch,
    StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { requestLocationPermissions } from '../utils/location';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOMTOM_API_KEY = 'AoGGy9rY3zDH74BIUOIvpreylbkzKSAA';

const getMapHtml = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'>
    <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #1a1e2e; }
        #map { width: 100%; height: 100%; }
        .mapboxgl-ctrl-logo { display: none !important; }
        .tt-logo { display: none !important; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        window.onerror = function(msg, src, line, col, err) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR', message: 'JS: ' + msg + ' (line ' + line + ')'
                }));
            }
        };

        var map, userMarker, is3D = false, currentLat = 0, currentLng = 0;

        function initMap() {
            try {
                if (!window.tt) {
                    setTimeout(initMap, 500);
                    return;
                }
                tt.setProductInfo('GeoConquest', '1.0.0');
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
                    try {
                        var sources = map.getStyle().sources;
                        var sourceId = null;
                        if (sources.vectorTiles) sourceId = 'vectorTiles';
                        else if (sources.vector) sourceId = 'vector';
                        else if (sources.composite) sourceId = 'composite';
                        if (sourceId) {
                            map.addLayer({
                                id: '3d-buildings', source: sourceId, 'source-layer': 'building',
                                filter: ['has', 'height'], type: 'fill-extrusion', minzoom: 13,
                                paint: {
                                    'fill-extrusion-color': '#c8cdd3',
                                    'fill-extrusion-height': ['get', 'height'],
                                    'fill-extrusion-base': ['get', 'min_height'],
                                    'fill-extrusion-opacity': 0.85
                                }
                            });
                        }
                    } catch(e) {}

                    var el = document.createElement('div');
                    el.style.width = '32px';
                    el.style.height = '32px';
                    el.style.borderRadius = '50%';
                    el.style.border = '3px solid #5B63D3';
                    el.style.boxShadow = '0 0 14px rgba(91,99,211,0.5)';
                    el.style.background = 'radial-gradient(circle, #7C83ED, #5B63D3)';
                    el.innerHTML = '<div style="width:10px;height:10px;background:#2dd06e;border-radius:50%;position:absolute;bottom:-2px;right:-2px;border:2px solid #fff;"></div>';
                    el.style.position = 'relative';
                    userMarker = new tt.Marker({ element: el }).setLngLat([0, 0]).addTo(map);

                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                });
            } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
            }
        }

        function updateLocation(lat, lng, heading) {
            if (!map) return;
            currentLat = lat;
            currentLng = lng;
            var center = [lng, lat];
            userMarker.setLngLat(center);
            map.easeTo({
                center: center,
                bearing: is3D ? (heading || 0) : 0,
                pitch: is3D ? 60 : 0,
                zoom: is3D ? 18 : 16,
                duration: 600
            });
        }

        function toggle3D(enable) {
            is3D = enable;
            map.easeTo({
                pitch: is3D ? 60 : 0,
                zoom: is3D ? 18 : 16,
                bearing: is3D ? 0 : 0,
                duration: 1200
            });
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: '3D_CHANGED', is3D: is3D }));
        }

        function centerOnUser() {
            if (!map) return;
            map.flyTo({
                center: [currentLng, currentLat],
                zoom: is3D ? 18 : 16,
                pitch: is3D ? 60 : 0,
                duration: 1000
            });
        }

        document.addEventListener('message', function(e) { handleMsg(e.data); });
        window.addEventListener('message', function(e) { handleMsg(e.data); });
        function handleMsg(str) {
            try {
                var d = JSON.parse(str);
                if (d.type === 'UPDATE_LOCATION') updateLocation(d.lat, d.lng, d.heading);
                else if (d.type === 'TOGGLE_3D') toggle3D(d.enable);
                else if (d.type === 'CENTER') centerOnUser();
            } catch(e) {}
        }
        initMap();
    </script>
</body>
</html>
`;

export default function HomeScreen({ navigation }) {
    const [location, setLocation] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [publicSession, setPublicSession] = useState(true);
    const [is3D, setIs3D] = useState(false);
    const webViewRef = useRef(null);
    const locationRef = useRef(null);
    const watchRef = useRef(null);

    useEffect(() => {
        (async () => {
            const hasPermission = await requestLocationPermissions();
            if (!hasPermission) return;

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            setLocation(loc.coords);
            locationRef.current = loc.coords;

            watchRef.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
                (newLoc) => {
                    setLocation(newLoc.coords);
                    locationRef.current = newLoc.coords;
                }
            );
        })();

        return () => {
            if (watchRef.current) {
                watchRef.current.remove();
                watchRef.current = null;
            }
        };
    }, []);

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

    const handleCenter = () => {
        if (webViewRef.current && mapReady) {
            webViewRef.current.postMessage(JSON.stringify({ type: 'CENTER' }));
        }
    };

    const handleToggle3D = () => {
        const newVal = !is3D;
        setIs3D(newVal);
        if (webViewRef.current && mapReady) {
            webViewRef.current.postMessage(JSON.stringify({ type: 'TOGGLE_3D', enable: newVal }));
        }
    };

    if (!location) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B63D3" />
                <Text style={styles.loadingText}>Locating you...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: getMapHtml() }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                androidLayerType="hardware"
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.mapLoadingOverlay}>
                        <ActivityIndicator size="large" color="#5B63D3" />
                        <Text style={styles.loadingText}>Loading Map...</Text>
                    </View>
                )}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'MAP_READY') setMapReady(true);
                        else if (data.type === '3D_CHANGED') setIs3D(data.is3D);
                    } catch (e) { }
                }}
            />

            {/* Top Header */}
            <View style={styles.topHeader}>
                <View style={styles.logoSmall}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="notifications-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats Overlay */}
            <View style={styles.statsOverlay}>
                <View style={styles.statRow}>
                    <MaterialCommunityIcons name="shoe-print" size={14} color="#7C83ED" />
                    <Text style={styles.statLabel}>Steps:</Text>
                    <Text style={styles.statValue}>7890</Text>
                </View>
                <View style={styles.statRow}>
                    <MaterialCommunityIcons name="fire" size={14} color="#E88D3F" />
                    <Text style={styles.statLabel}>Streak:</Text>
                    <Text style={styles.statValue}>12 days</Text>
                </View>
                <View style={styles.statRow}>
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color="#2dd06e" />
                    <Text style={styles.statLabel}>Energy:</Text>
                    <Text style={styles.statValue}>75%</Text>
                </View>
                <View style={styles.energyBarBg}>
                    <View style={[styles.energyBarFill, { width: '75%' }]} />
                </View>
            </View>

            {/* Right side buttons */}
            <View style={styles.rightControls}>
                <TouchableOpacity style={styles.mapCtrlBtn} onPress={handleCenter}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mapCtrlBtn, is3D && styles.mapCtrlBtnActive]}
                    onPress={handleToggle3D}
                >
                    <MaterialCommunityIcons name="rotate-3d-variant" size={20} color={is3D ? '#5B63D3' : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapCtrlBtn}>
                    <MaterialCommunityIcons name="sword-cross" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapCtrlBtn}>
                    <Ionicons name="person-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                <View style={styles.bottomRow}>
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Public Session</Text>
                        <Switch
                            value={publicSession}
                            onValueChange={setPublicSession}
                            trackColor={{ false: '#3a3d50', true: '#5B63D3' }}
                            thumbColor="#fff"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => navigation.navigate('StartCapture')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.startButtonText}>START</Text>
                        <MaterialCommunityIcons name="run-fast" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.teamFilterRow}>
                    <Text style={styles.teamFilterLabel}>Team Filter</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e1a' },
    loadingText: { marginTop: 10, fontSize: 14, color: '#888', fontWeight: '500' },
    map: { flex: 1 },
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e1a',
    },
    topHeader: {
        position: 'absolute', top: 50, left: 16, right: 16,
        flexDirection: 'row', alignItems: 'center',
    },
    logoSmall: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(10, 14, 26, 0.7)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(10, 14, 26, 0.7)',
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 8,
    },
    statsOverlay: {
        position: 'absolute', top: 100, left: 16,
        backgroundColor: 'rgba(10, 14, 26, 0.85)',
        borderRadius: 14, padding: 14, minWidth: 160,
        borderWidth: 1, borderColor: 'rgba(91, 99, 211, 0.2)',
    },
    statRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
    },
    statLabel: { color: '#aaa', fontSize: 12, fontWeight: '500' },
    statValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
    energyBarBg: {
        height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: 6,
    },
    energyBarFill: {
        height: 4, backgroundColor: '#5B63D3', borderRadius: 2,
    },
    rightControls: {
        position: 'absolute', right: 16, top: 100,
        gap: 10,
    },
    mapCtrlBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(10, 14, 26, 0.75)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(91, 99, 211, 0.3)',
    },
    mapCtrlBtnActive: {
        backgroundColor: 'rgba(91, 99, 211, 0.25)',
        borderColor: '#5B63D3',
    },
    bottomControls: {
        position: 'absolute', bottom: 90, left: 16, right: 16,
    },
    bottomRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    toggleRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(10, 14, 26, 0.85)',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    toggleLabel: { color: '#ccc', fontSize: 13, fontWeight: '500' },
    startButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#5B63D3', borderRadius: 20,
        paddingHorizontal: 28, paddingVertical: 14,
        elevation: 8,
        shadowColor: '#5B63D3', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12,
    },
    startButtonText: {
        color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1,
    },
    teamFilterRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(10, 14, 26, 0.85)',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        marginTop: 8, alignSelf: 'flex-start',
    },
    teamFilterLabel: { color: '#ccc', fontSize: 13, fontWeight: '500' },
});
