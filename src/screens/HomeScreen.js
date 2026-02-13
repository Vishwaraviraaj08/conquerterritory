import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Switch,
    StatusBar,
    Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { requestLocationPermissions } from '../utils/location';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import api from '../api';

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

        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            50% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 6px rgba(0,200,255,0.5); }
            50% { box-shadow: 0 0 16px rgba(0,200,255,0.8); }
        }

        .user-marker {
            width: 48px; height: 48px; position: relative;
        }
        .marker-pulse {
            position: absolute; width: 48px; height: 48px; border-radius: 50%;
            background: radial-gradient(circle, rgba(0,200,255,0.35) 0%, transparent 70%);
            left: 50%; top: 50%;
            animation: pulse 2.5s ease-out infinite;
        }
        .marker-ring {
            position: absolute; width: 30px; height: 30px; border-radius: 50%;
            border: 2px solid rgba(0,200,255,0.5);
            background: rgba(0,200,255,0.08);
            left: 50%; top: 50%; transform: translate(-50%, -50%);
        }
        .marker-dot {
            position: absolute; width: 14px; height: 14px; border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #00e5ff, #0088cc);
            border: 2.5px solid #fff;
            left: 50%; top: 50%; transform: translate(-50%, -50%);
            z-index: 2;
            animation: glow 2s ease-in-out infinite;
        }
        .marker-arrow {
            position: absolute;
            left: 50%; top: 0px;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 12px solid #00c8ff;
            filter: drop-shadow(0 0 3px rgba(0,200,255,0.6));
            z-index: 3;
            transition: transform 0.3s ease;
        }
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
        var territoryLayers = [];
        var territoryData = {};

        function initMap() {
            try {
                if (!window.tt) { setTimeout(initMap, 500); return; }
                tt.setProductInfo('GeoConquest', '1.0.0');
                map = tt.map({
                    key: '${TOMTOM_API_KEY}',
                    container: 'map',
                    style: 'https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json',
                    center: [0, 0],
                    zoom: 2,
                    pitch: 0, bearing: 0,
                    dragRotate: true, touchPitch: true
                });
                map.on('load', function() {
                    try {
                        var sources = map.getStyle().sources;
                        var sourceId = sources.vectorTiles ? 'vectorTiles' : sources.vector ? 'vector' : sources.composite ? 'composite' : null;
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
                    el.className = 'user-marker';
                    el.innerHTML = '<div class="marker-pulse"></div>'
                        + '<div class="marker-ring"></div>'
                        + '<div class="marker-dot"></div>'
                        + '<div class="marker-arrow" id="heading-arrow"></div>';
                    userMarker = new tt.Marker({ element: el, anchor: 'center' }).setLngLat([0, 0]).addTo(map);

                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                });
            } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
            }
        }

        function updateLocation(lat, lng, heading) {
            if (!map) return;
            currentLat = lat; currentLng = lng;
            var center = [lng, lat];
            userMarker.setLngLat(center);
            var arrow = document.getElementById('heading-arrow');
            if (arrow && heading !== null && heading !== undefined) {
                arrow.style.transform = 'translateX(-50%) rotate(' + heading + 'deg)';
                arrow.style.display = 'block';
            }
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
            map.easeTo({ pitch: is3D ? 60 : 0, zoom: is3D ? 18 : 16, bearing: 0, duration: 1200 });
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: '3D_CHANGED', is3D: is3D }));
        }

        function centerOnUser() {
            if (!map) return;
            map.flyTo({ center: [currentLng, currentLat], zoom: is3D ? 18 : 16, pitch: is3D ? 60 : 0, duration: 1000 });
        }

        function addTerritories(territories) {
            // Remove old layers/sources
            territoryLayers.forEach(function(id) {
                if (map.getLayer(id + '-fill')) map.removeLayer(id + '-fill');
                if (map.getLayer(id + '-line')) map.removeLayer(id + '-line');
                if (map.getSource(id)) map.removeSource(id);
            });
            territoryLayers = [];
            territoryData = {};

            territories.forEach(function(t, i) {
                var srcId = 'territory-' + i;
                territoryLayers.push(srcId);
                territoryData[srcId] = t;

                var coords = t.coordinates && t.coordinates.coordinates ? t.coordinates.coordinates : t.polygon;
                if (!coords || !coords[0] || coords[0].length < 3) return;

                map.addSource(srcId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: { id: srcId },
                        geometry: { type: 'Polygon', coordinates: coords }
                    }
                });

                map.addLayer({
                    id: srcId + '-fill', type: 'fill', source: srcId,
                    paint: {
                        'fill-color': t.isMine ? 'rgba(91,99,211,0.3)' : 'rgba(232,168,56,0.2)',
                        'fill-outline-color': t.isMine ? '#5B63D3' : '#E8A838'
                    }
                });
                map.addLayer({
                    id: srcId + '-line', type: 'line', source: srcId,
                    paint: {
                        'line-color': t.isMine ? '#7C83ED' : '#E8A838',
                        'line-width': 2
                    }
                });

                map.on('click', srcId + '-fill', function(e) {
                    var td = territoryData[srcId];
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'TERRITORY_TAP',
                        territory: {
                            id: td._id || srcId,
                            name: td.name || 'Territory',
                            area: td.area || 0,
                            capturedAt: td.capturedAt || '',
                            gameMode: td.gameMode || 'solo',
                            owner: td.ownerName || 'You',
                            distance: td.captureDistance || 0,
                            duration: td.captureDuration || 0,
                            avgSpeed: td.captureAvgSpeed || 0,
                        }
                    }));
                });
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
                else if (d.type === 'ADD_TERRITORIES') addTerritories(d.territories);
            } catch(e) {}
        }
        initMap();
    </script>
</body>
</html>
`;

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const { isTracking } = useTracking();
    const [location, setLocation] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [publicSession, setPublicSession] = useState(true);
    const [is3D, setIs3D] = useState(false);
    const webViewRef = useRef(null);
    const locationRef = useRef(null);
    const watchRef = useRef(null);

    const [stats, setStats] = useState({ steps: 0, streak: 0, energy: 75 });
    const [territories, setTerritories] = useState([]);
    const [selectedTerritory, setSelectedTerritory] = useState(null);

    // Fetch stats from server
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/users/profile');
                const s = res.data.user?.stats || {};
                setStats({
                    steps: s.steps || (s.totalCaptures ? s.totalCaptures * 1200 : 0),
                    streak: s.streak || 0,
                    energy: s.energy || s.healthScore || 75,
                });
            } catch (e) { }
        })();
    }, []);

    // Fetch territories from server
    const loadTerritories = useCallback(async () => {
        try {
            const res = await api.get('/territories');
            const terrs = (res.data.territories || []).map(t => ({
                ...t,
                isMine: true,
                ownerName: user?.username || 'You',
                captureDistance: t.capture?.distance || 0,
                captureDuration: t.capture?.duration || 0,
                captureAvgSpeed: t.capture?.avgSpeed || 0,
            }));
            setTerritories(terrs);
        } catch (e) { }
    }, [user]);

    useEffect(() => {
        loadTerritories();
    }, [loadTerritories]);

    // Send territories to map when ready
    useEffect(() => {
        if (mapReady && webViewRef.current && territories.length > 0) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'ADD_TERRITORIES',
                territories: territories,
            }));
        }
    }, [mapReady, territories]);

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

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '--';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
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
                        else if (data.type === 'TERRITORY_TAP') {
                            setSelectedTerritory(data.territory);
                        }
                    } catch (e) { }
                }}
            />

            {/* Top Header */}
            <View style={styles.topHeader}>
                <View style={styles.logoSmall}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    style={styles.headerIcon}
                    onPress={() => navigation.navigate('Settings')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="notifications-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerIcon}
                    onPress={() => navigation.navigate('Settings')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats Overlay */}
            <View style={styles.statsOverlay}>
                <View style={styles.statRow}>
                    <MaterialCommunityIcons name="shoe-print" size={14} color="#7C83ED" />
                    <Text style={styles.statLabel}>Steps:</Text>
                    <Text style={styles.statValue}>{stats.steps.toLocaleString()}</Text>
                </View>
                <View style={styles.statRow}>
                    <MaterialCommunityIcons name="fire" size={14} color="#E88D3F" />
                    <Text style={styles.statLabel}>Streak:</Text>
                    <Text style={styles.statValue}>{stats.streak} days</Text>
                </View>
                <View style={styles.statRow}>
                    <MaterialCommunityIcons name="lightning-bolt" size={14} color="#2dd06e" />
                    <Text style={styles.statLabel}>Energy:</Text>
                    <Text style={styles.statValue}>{stats.energy}%</Text>
                </View>
                <View style={styles.energyBarBg}>
                    <View style={[styles.energyBarFill, { width: `${stats.energy}%` }]} />
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
                <TouchableOpacity
                    style={styles.mapCtrlBtn}
                    onPress={() => navigation.navigate('Territories')}
                >
                    <MaterialCommunityIcons name="sword-cross" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.mapCtrlBtn}
                    onPress={() => navigation.navigate('Profile')}
                >
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
                        onPress={() => navigation.navigate('StartCapture', { isPublic: publicSession })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.startButtonText}>START</Text>
                        <MaterialCommunityIcons name="run-fast" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Active Session Indicator */}
            {isTracking && (
                <TouchableOpacity
                    style={styles.activeSessionBtn}
                    onPress={() => navigation.navigate('LiveTracking')}
                    activeOpacity={0.9}
                >
                    <View style={styles.pulseDot} />
                    <Text style={styles.activeSessionText}>Return to Capture</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Territory Popup Modal */}
            <Modal
                visible={!!selectedTerritory}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedTerritory(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedTerritory(null)}
                >
                    <View style={styles.popupCard}>
                        <View style={styles.popupHeader}>
                            <MaterialCommunityIcons name="vector-polygon" size={22} color="#5B63D3" />
                            <Text style={styles.popupTitle}>{selectedTerritory?.name || 'Territory'}</Text>
                            <TouchableOpacity onPress={() => setSelectedTerritory(null)}>
                                <Ionicons name="close" size={22} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.popupDivider} />

                        <View style={styles.popupRow}>
                            <Ionicons name="calendar-outline" size={16} color="#7C83ED" />
                            <Text style={styles.popupLabel}>Date</Text>
                            <Text style={styles.popupValue}>{formatDate(selectedTerritory?.capturedAt)}</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <Ionicons name="time-outline" size={16} color="#7C83ED" />
                            <Text style={styles.popupLabel}>Time</Text>
                            <Text style={styles.popupValue}>{formatTime(selectedTerritory?.capturedAt)}</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <MaterialCommunityIcons name="vector-square" size={16} color="#2dd06e" />
                            <Text style={styles.popupLabel}>Area</Text>
                            <Text style={styles.popupValue}>{(selectedTerritory?.area || 0).toFixed(1)} m²</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <MaterialCommunityIcons name="map-marker-distance" size={16} color="#E88D3F" />
                            <Text style={styles.popupLabel}>Distance</Text>
                            <Text style={styles.popupValue}>{((selectedTerritory?.distance || 0) / 1000).toFixed(2)} km</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <MaterialCommunityIcons name="timer-outline" size={16} color="#7C83ED" />
                            <Text style={styles.popupLabel}>Duration</Text>
                            <Text style={styles.popupValue}>{formatDuration(selectedTerritory?.duration)}</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <MaterialCommunityIcons name="speedometer" size={16} color="#E8A838" />
                            <Text style={styles.popupLabel}>Avg Speed</Text>
                            <Text style={styles.popupValue}>{(selectedTerritory?.avgSpeed || 0).toFixed(1)} km/h</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <MaterialCommunityIcons name="account-outline" size={16} color="#7C83ED" />
                            <Text style={styles.popupLabel}>Owner</Text>
                            <Text style={styles.popupValue}>{selectedTerritory?.owner || 'You'}</Text>
                        </View>
                        <View style={styles.popupRow}>
                            <MaterialCommunityIcons name="gamepad-variant-outline" size={16} color="#7C83ED" />
                            <Text style={styles.popupLabel}>Mode</Text>
                            <Text style={[styles.popupValue, { textTransform: 'capitalize' }]}>{selectedTerritory?.gameMode || 'solo'}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        position: 'absolute', right: 16, top: 100, gap: 10,
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
    // Territory Popup Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    popupCard: {
        backgroundColor: '#151929', borderRadius: 20, padding: 20, width: '100%',
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.25)',
    },
    popupHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    popupTitle: {
        flex: 1, fontSize: 18, fontWeight: '700', color: '#fff',
    },
    popupDivider: {
        height: 1, backgroundColor: 'rgba(91,99,211,0.15)', marginVertical: 14,
    },
    popupRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7,
    },
    popupLabel: {
        flex: 1, fontSize: 14, color: '#888daf', fontWeight: '500',
    },
    popupValue: {
        fontSize: 14, fontWeight: '700', color: '#fff',
    },
    activeSessionBtn: {
        position: 'absolute', top: 50, alignSelf: 'center',
        backgroundColor: 'rgba(232, 65, 24, 0.9)',
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        elevation: 5, shadowColor: '#e84118', shadowOpacity: 0.4, shadowRadius: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 999,
    },
    activeSessionText: {
        color: '#fff', fontWeight: '700', fontSize: 13,
    },
    pulseDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff',
    },
});
