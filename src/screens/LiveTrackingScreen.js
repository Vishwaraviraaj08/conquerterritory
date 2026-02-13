import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import * as turf from '@turf/turf';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import { useTracking } from '../context/TrackingContext';

const TOMTOM_API_KEY = 'AoGGy9rY3zDH74BIUOIvpreylbkzKSAA';

const getTrackingMapHtml = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'>
    <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0a0e1a; }
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
        .user-marker { width: 48px; height: 48px; position: relative; }
        .marker-pulse {
            position: absolute; width: 48px; height: 48px; border-radius: 50%;
            background: radial-gradient(circle, rgba(0,200,255,0.35) 0%, transparent 70%);
            left: 50%; top: 50%; animation: pulse 2.5s ease-out infinite;
        }
        .marker-ring {
            position: absolute; width: 30px; height: 30px; border-radius: 50%;
            border: 2px solid rgba(0,200,255,0.5); background: rgba(0,200,255,0.08);
            left: 50%; top: 50%; transform: translate(-50%, -50%);
        }
        .marker-dot {
            position: absolute; width: 14px; height: 14px; border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #00e5ff, #0088cc);
            border: 2.5px solid #fff; left: 50%; top: 50%; transform: translate(-50%, -50%);
            z-index: 2; animation: glow 2s ease-in-out infinite;
        }
        .marker-arrow {
            position: absolute; left: 50%; top: 0px; transform: translateX(-50%);
            width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
            border-bottom: 12px solid #00c8ff; filter: drop-shadow(0 0 3px rgba(0,200,255,0.6));
            z-index: 3; transition: transform 0.3s ease;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map, userMarker;
        function initMap() {
            try {
                if (!window.tt) { setTimeout(initMap, 500); return; }
                tt.setProductInfo('GeoConquest', '1.0.0');
                map = tt.map({
                    key: '${TOMTOM_API_KEY}', container: 'map',
                    style: 'https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json',
                    center: [0, 0], zoom: 17, margin: 50
                });
                map.on('load', function() {
                    var el = document.createElement('div');
                    el.className = 'user-marker';
                    el.innerHTML = '<div class="marker-pulse"></div><div class="marker-ring"></div><div class="marker-dot"></div><div class="marker-arrow" id="heading-arrow"></div>';
                    userMarker = new tt.Marker({ element: el, anchor: 'center' }).setLngLat([0, 0]).addTo(map);
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                });
            } catch (e) {}
        }
        function updateLocation(lat, lng, heading) {
            if (!map) return;
            userMarker.setLngLat([lng, lat]);
            var arrow = document.getElementById('heading-arrow');
            if (arrow && heading !== null && heading !== undefined) {
                arrow.style.transform = 'translateX(-50%) rotate(' + heading + 'deg)';
            }
            map.easeTo({ center: [lng, lat], zoom: 17, bearing: heading || 0, duration: 400, pitch: 50 });
        }
        function updatePath(coords) {
            if (!map || !coords || coords.length < 2) return;
            try {
                if (map.getSource('track-line')) {
                    map.getSource('track-line').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
                } else {
                    map.addSource('track-line', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } });
                    map.addLayer({ id: 'track-line-bg', type: 'line', source: 'track-line', paint: { 'line-color': 'rgba(91,99,211,0.3)', 'line-width': 8 } });
                    map.addLayer({ id: 'track-line-main', type: 'line', source: 'track-line', paint: { 'line-color': '#5B63D3', 'line-width': 4, 'line-dasharray': [2, 1] } });
                }
            } catch(e) {}
        }
        function showArea(coords) {
            if (!map || !coords || coords.length < 3) return;
            try {
                var closed = coords.slice(); closed.push(coords[0]);
                if (map.getSource('area-fill')) {
                    map.getSource('area-fill').setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [closed] } });
                } else {
                    map.addSource('area-fill', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [closed] } } });
                    map.addLayer({ id: 'area-fill-layer', type: 'fill', source: 'area-fill', paint: { 'fill-color': 'rgba(91,99,211,0.2)', 'fill-outline-color': '#5B63D3' } });
                    map.addLayer({ id: 'area-line-layer', type: 'line', source: 'area-fill', paint: { 'line-color': '#7C83ED', 'line-width': 2 } });
                }
            } catch(e) {}
        }
        document.addEventListener('message', function(e) { handleMsg(e.data); });
        window.addEventListener('message', function(e) { handleMsg(e.data); });
        function handleMsg(str) {
            try {
                var d = JSON.parse(str);
                if (d.type === 'UPDATE_LOCATION') updateLocation(d.lat, d.lng, d.heading);
                else if (d.type === 'UPDATE_PATH') updatePath(d.coordinates);
                else if (d.type === 'SHOW_AREA') showArea(d.coordinates);
            } catch(e) {}
        }
        initMap();
    </script>
</body>
</html>
`;

export default function LiveTrackingScreen({ navigation, route }) {
    const { isTracking, isPaused, elapsedTime, distance, currentSpeed, avgSpeed, maxSpeed, area, path, sessionData, startSession, pauseSession, resumeSession, stopSession, cancelSession } = useTracking();
    const routeParams = route.params || {};

    const [mapReady, setMapReady] = useState(false);
    const [showFinishAlert, setShowFinishAlert] = useState(false);
    const [showCancelAlert, setShowCancelAlert] = useState(false);
    const [heading, setHeading] = useState(0);

    const webViewRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Compass
    useEffect(() => {
        let sub;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            Magnetometer.setUpdateInterval(100);
            sub = Magnetometer.addListener(data => {
                let { x, y } = data;
                let angle = Math.atan2(y, x) * (180 / Math.PI);
                angle = (angle + 90) >= 0 ? angle + 90 : angle + 450;
                setHeading(Math.floor(angle));
            });
        })();
        return () => { if (sub) sub.remove(); };
    }, []);

    // Start Session on Mount if not already tracking or if params provided
    useEffect(() => {
        if (!isTracking && (routeParams.gameMode || routeParams.teamId)) {
            startSession({
                gameMode: routeParams.gameMode || 'solo',
                isPublic: routeParams.isPublic ?? true,
                teamId: routeParams.teamId,
                partnerIds: routeParams.partnerIds
            });
        }
    }, []);

    // Initial Path Load - for when returning to screen
    useEffect(() => {
        if (mapReady && webViewRef.current && path.length > 0) {
            webViewRef.current.postMessage(JSON.stringify({ type: 'UPDATE_PATH', coordinates: path }));
            const last = path[path.length - 1];
            webViewRef.current.postMessage(JSON.stringify({ type: 'UPDATE_LOCATION', lat: last[1], lng: last[0], heading: heading }));
        }
    }, [mapReady]);

    // Update Map Realtime
    useEffect(() => {
        if (mapReady && webViewRef.current && path.length > 0) {
            const last = path[path.length - 1];
            webViewRef.current.postMessage(JSON.stringify({ type: 'UPDATE_LOCATION', lat: last[1], lng: last[0], heading: heading }));
            webViewRef.current.postMessage(JSON.stringify({ type: 'UPDATE_PATH', coordinates: path }));
            if (area > 0) {
                webViewRef.current.postMessage(JSON.stringify({ type: 'SHOW_AREA', coordinates: path }));
            }
        }
    }, [path.length, heading, mapReady]);

    // Pulse Animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleCancel = () => {
        cancelSession();
        navigation.goBack();
    };

    const confirmFinish = () => {
        const stats = stopSession(); // Stop and get final stats

        const totalSeconds = stats.elapsedTime || 1;
        const distM = stats.distance;
        const paceVal = distM > 0 ? (totalSeconds / 60) / (distM / 1000) : 0;
        const paceMin = Math.floor(paceVal);
        const paceSec = Math.round((paceVal - paceMin) * 60);

        const weightKg = 70;
        const met = stats.avgSpeed > 10 ? 8.0 : stats.avgSpeed > 6 ? 6.0 : 3.5;
        const caloriesEst = Math.round(met * weightKg * (totalSeconds / 3600));
        const areaPoints = Math.round(stats.area * 0.1 + distM * 0.5 + totalSeconds * 0.2);

        const pathCoords = stats.path;
        const endCoord = pathCoords.length > 0 ? pathCoords[pathCoords.length - 1] : [0, 0];
        const hasClosedLoop = area > 0; // Or check distance to start < 20m

        navigation.replace('CaptureResults', {
            area: stats.area.toFixed(1),
            distance: distM.toFixed(0),
            time: totalSeconds,
            avgSpeed: stats.avgSpeed.toFixed(1),
            maxSpeed: stats.maxSpeed.toFixed(1),
            pace: `${paceMin}:${paceSec.toString().padStart(2, '0')}`,
            points: areaPoints,
            calories: caloriesEst,
            path: { type: 'LineString', coordinates: pathCoords },
            startLocation: stats.startLocation || { type: 'Point', coordinates: [0, 0] },
            endLocation: { type: 'Point', coordinates: endCoord },
            gameMode: sessionData?.gameMode || 'solo',
            isPublic: sessionData?.isPublic ?? true,
            isCapture: hasClosedLoop, // If loop not closed, it's just an activity
            capturedAt: new Date().toISOString(),
        });
    };

    const onFinishPress = () => {
        const startPoint = path.length > 0 ? turf.point(path[0]) : null;
        const currentPoint = path.length > 0 ? turf.point(path[path.length - 1]) : null;
        let distanceToStart = 0;
        if (startPoint && currentPoint) {
            distanceToStart = turf.distance(startPoint, currentPoint, { units: 'meters' });
        }

        let message = `Great job! You've covered ${(distance / 1000).toFixed(2)} km.`;
        let title = "Finish Activity";

        if (distanceToStart > 30) {
            title = "Incomplete Loop";
            message = `You are ${distanceToStart.toFixed(0)}m away from the start. If you finish now, this will be saved as a Run/Walk but NOT a territory capture. Continue?`;
        } else if (area > 0) {
            title = "Capture Territory";
            message = `Excellent! You've enclosed ${area.toFixed(0)} m². Ready to claim this territory?`;
        }

        setShowFinishAlert({ title, message });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: getTrackingMapHtml() }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                androidLayerType="hardware"
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#5B63D3" />
                    </View>
                )}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'MAP_READY') setMapReady(true);
                    } catch (e) { }
                }}
            />

            {/* Premium Header - Floating Timer */}
            <View style={styles.headerFloating}>
                <View style={styles.timerBadge}>
                    <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
                </View>
                {sessionData?.teamId && (
                    <View style={[styles.timerBadge, { marginTop: 8, backgroundColor: 'rgba(91,99,211,0.9)' }]}>
                        <MaterialCommunityIcons name="account-group" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={[styles.timerText, { fontSize: 14 }]}>TEAM: {sessionData.teamId}</Text>
                    </View>
                )}
            </View>

            {/* Bottom Card UI */}
            <View style={styles.bottomCardContainer}>
                {/* Stats Row */}
                <View style={styles.statsCard}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>DISTANCE</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.statValue}>{(distance / 1000).toFixed(2)}</Text>
                            <Text style={styles.statUnit}> km</Text>
                        </View>
                    </View>
                    <View style={styles.vertDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>AREA</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.statValue}>{area.toFixed(0)}</Text>
                            <Text style={styles.statUnit}> m²</Text>
                        </View>
                    </View>
                    <View style={styles.vertDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>SPEED</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.statValue}>{currentSpeed.toFixed(1)}</Text>
                            <Text style={styles.statUnit}> km/h</Text>
                        </View>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controlRow}>
                    <TouchableOpacity
                        style={[styles.controlBtn, styles.cancelBtn]}
                        onPress={() => setShowCancelAlert(true)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                        onPress={isPaused ? resumeSession : pauseSession}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.finishBtnMain}
                        onPress={onFinishPress}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.finishBtnText}>FINISH</Text>
                        <MaterialCommunityIcons name="flag-checkered" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <CustomAlert
                visible={!!showFinishAlert}
                type="confirm"
                title={showFinishAlert?.title || "Finish Activity"}
                message={showFinishAlert?.message || "Are you sure?"}
                buttons={[
                    { text: 'Resume', style: 'cancel', onPress: () => setShowFinishAlert(false) },
                    { text: 'Finish', onPress: confirmFinish },
                ]}
                onClose={() => setShowFinishAlert(false)}
            />

            <CustomAlert
                visible={showCancelAlert}
                type="confirm"
                title="Discard Activity?"
                message="This will discard all progress for this session. Are you sure?"
                buttons={[
                    { text: 'Resume', style: 'cancel', onPress: () => setShowCancelAlert(false) },
                    { text: 'Discard', style: 'destructive', onPress: handleCancel },
                ]}
                onClose={() => setShowCancelAlert(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    map: { flex: 1 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e1a' },

    headerFloating: {
        position: 'absolute', top: 50, alignSelf: 'center', alignItems: 'center',
    },
    timerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(15, 20, 35, 0.95)', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 10,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.3)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4444' },
    timerText: { fontSize: 24, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'], letterSpacing: 1 },

    bottomCardContainer: {
        position: 'absolute', bottom: 30, left: 16, right: 16,
    },
    statsCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'rgba(15, 20, 35, 0.95)', borderRadius: 20, padding: 20,
        marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    statBox: { alignItems: 'center', flex: 1 },
    statLabel: { fontSize: 11, fontWeight: '700', color: '#888daf', marginBottom: 4, letterSpacing: 0.5 },
    statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
    statUnit: { fontSize: 14, color: '#666', fontWeight: '500' },
    vertDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

    controlRow: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16,
    },
    controlBtn: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    pauseBtn: { backgroundColor: '#2a2e40', borderWidth: 1, borderColor: '#444' },
    resumeBtn: { backgroundColor: '#2dd06e' },
    cancelBtn: { backgroundColor: '#e84118', marginRight: 0 },
    finishBtnMain: {
        flex: 1, height: 64, borderRadius: 32,
        backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
        shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 6,
    },
    finishBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});
