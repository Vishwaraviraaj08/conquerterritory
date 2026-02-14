import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api from '../api';
import CustomAlert from '../components/CustomAlert';

const TOMTOM_API_KEY = 'AoGGy9rY3zDH74BIUOIvpreylbkzKSAA';

const getMiniMapHtml = (pathCoords) => {
    if (!pathCoords || pathCoords.length < 2) return null;
    const lngs = pathCoords.map(c => c[0]);
    const lats = pathCoords.map(c => c[1]);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const coordsStr = JSON.stringify(pathCoords);
    const closedStr = JSON.stringify([...pathCoords, pathCoords[0]]);

    return `
    <!DOCTYPE html><html><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'>
        <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
        <style>body,html{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#111528}#map{width:100%;height:100%;border-radius:18px}.mapboxgl-ctrl-logo,.tt-logo{display:none!important}</style>
    </head><body><div id="map"></div><script>
        tt.setProductInfo('GeoConquest','1.0.0');
        var map=tt.map({key:'${TOMTOM_API_KEY}',container:'map',center:[${centerLng},${centerLat}],zoom:15,interactive:false});
        map.on('load',function(){
            map.addSource('tf',{type:'geojson',data:{type:'Feature',geometry:{type:'Polygon',coordinates:[${closedStr}]}}});
            map.addLayer({id:'fill',type:'fill',source:'tf',paint:{'fill-color':'rgba(91,99,211,0.3)','fill-outline-color':'#5B63D3'}});
            map.addSource('tl',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:${coordsStr}}}});
            map.addLayer({id:'line',type:'line',source:'tl',paint:{'line-color':'#7C83ED','line-width':3}});
            var bounds=new tt.LngLatBounds();${coordsStr}.forEach(function(c){bounds.extend(c)});
            map.fitBounds(bounds,{padding:30,maxZoom:17});
        });
    </script></body></html>`;
};

export default function CaptureResultsScreen({ navigation, route }) {
    const {
        area = '0', distance = '0', time = 0, avgSpeed = '0', maxSpeed = '0',
        pace = '--:--', points = 0, calories = 0, path = null,
        startLocation = null, endLocation = null, gameMode = 'solo',
        isPublic = true, capturedAt = null, isCapture = true
    } = route.params || {};

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, type: 'info', title: '', message: '' });

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleConfirm = async () => {
        if (saved) {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            return;
        }
        setSaving(true);
        try {
            await api.post('/captures', {
                path: path || { type: 'LineString', coordinates: [[0, 0], [0.001, 0.001]] },
                distance: parseFloat(distance) || 0,
                duration: parseInt(time) || 0,
                avgSpeed: parseFloat(avgSpeed) || 0,
                maxSpeed: parseFloat(maxSpeed) || 0,
                pace: pace || '--:--',
                calories: parseInt(calories) || 0,
                area: parseFloat(area) || 0,
                points: parseInt(points) || 0,
                startLocation: startLocation || { type: 'Point', coordinates: [0, 0] },
                endLocation: endLocation || { type: 'Point', coordinates: [0, 0] },
                gameMode, isPublic,
                capturedAt: capturedAt || new Date().toISOString(),
                sessionId: route.params?.sessionId || null
            });
            setSaved(true);
            setAlertConfig({
                visible: true, type: 'success',
                title: isCapture ? 'Territory Captured!' : 'Activity Saved!',
                message: isCapture
                    ? 'Your territory has been saved and will appear on the map.'
                    : 'Your activity has been saved successfully.',
            });
        } catch (err) {
            setAlertConfig({
                visible: true, type: 'error',
                title: 'Save Failed',
                message: err.response?.data?.error || 'Failed to save capture. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const miniMapHtml = path?.coordinates ? getMiniMapHtml(path.coordinates) : null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{isCapture ? 'Capture Results' : 'Activity Summary'}</Text>
                    <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })} activeOpacity={0.7}>
                        <Ionicons name="home-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {miniMapHtml ? (
                    <View style={styles.mapPreview}>
                        <WebView source={{ html: miniMapHtml }} style={{ flex: 1, borderRadius: 18 }} javaScriptEnabled scrollEnabled={false} />
                    </View>
                ) : (
                    <View style={styles.mapPreviewPlaceholder}>
                        <MaterialCommunityIcons name="map-outline" size={60} color="rgba(91,99,211,0.3)" />
                        <Text style={styles.mapPlaceholderText}>Territory Preview</Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>{isCapture ? 'Your Captured Territory' : 'Your Route'}</Text>

                <View style={styles.mainStatsRow}>
                    <View style={[styles.mainStatCard, { borderColor: 'rgba(91,99,211,0.3)' }]}>
                        <MaterialCommunityIcons name="vector-polygon" size={24} color="#5B63D3" />
                        <Text style={styles.mainStatValue}>{area} m²</Text>
                        <Text style={styles.mainStatLabel}>Area Captured</Text>
                    </View>
                    <View style={[styles.mainStatCard, { borderColor: 'rgba(232,168,56,0.3)' }]}>
                        <MaterialCommunityIcons name="star-outline" size={24} color="#E8A838" />
                        <Text style={styles.mainStatValue}>{points} pts</Text>
                        <Text style={styles.mainStatLabel}>Total Points</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Speed Summary</Text>
                    <View style={styles.speedGrid}>
                        <View style={styles.speedItem}><Text style={styles.speedValue}>{avgSpeed}</Text><Text style={styles.speedLabel}>Avg Speed (km/h)</Text></View>
                        <View style={styles.speedItem}><Text style={styles.speedValue}>{maxSpeed}</Text><Text style={styles.speedLabel}>Max Speed (km/h)</Text></View>
                        <View style={styles.speedItem}><Text style={styles.speedValue}>{formatTime(time)}</Text><Text style={styles.speedLabel}>Time</Text></View>
                        <View style={styles.speedItem}><Text style={styles.speedValue}>{pace}</Text><Text style={styles.speedLabel}>Pace (/km)</Text></View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.caloriesRow}>
                        <MaterialCommunityIcons name="fire" size={22} color="#E8A838" />
                        <Text style={styles.caloriesValue}>{calories} kcal</Text>
                    </View>
                    <Text style={styles.caloriesLabel}>Calories Burned</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Capture Details</Text>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Mode</Text><Text style={styles.detailValue}>{gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Visibility</Text><Text style={styles.detailValue}>{isPublic ? 'Public' : 'Private'}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Distance</Text><Text style={styles.detailValue}>{(parseFloat(distance) / 1000).toFixed(2)} km</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Captured At</Text><Text style={styles.detailValue}>{capturedAt ? new Date(capturedAt).toLocaleString('en-IN') : 'Just now'}</Text></View>
                </View>

                <View style={styles.validatedRow}>
                    <Ionicons name={saved ? "checkmark-circle" : "ellipse-outline"} size={22} color={saved ? "#2dd06e" : "#888"} />
                    <Text style={[styles.validatedText, !saved && { color: '#888' }]}>
                        {saved ? (isCapture ? 'Capture Saved!' : 'Activity Saved!') : 'Pending Confirmation'}
                    </Text>
                </View>

                <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.7 }]} onPress={handleConfirm} activeOpacity={0.85} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>{saved ? 'Go Home' : (isCapture ? 'Confirm Capture' : 'Save Activity')}</Text>}
                </TouchableOpacity>

                <View style={styles.secondaryBtns}>
                    <TouchableOpacity style={styles.secBtn}><Ionicons name="lock-closed-outline" size={16} color="#ccc" /><Text style={styles.secBtnText}>Save Private</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.secBtn}><Ionicons name="share-social-outline" size={16} color="#ccc" /><Text style={styles.secBtnText}>Share</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.secBtn}><Ionicons name="flag-outline" size={16} color="#ccc" /><Text style={styles.secBtnText}>Dispute</Text></TouchableOpacity>
                </View>
            </ScrollView >

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(a => ({ ...a, visible: false }))}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 50, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    mapPreview: { height: 200, borderRadius: 18, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)' },
    mapPreviewPlaceholder: { height: 180, borderRadius: 18, backgroundColor: '#111528', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)' },
    mapPlaceholderText: { color: '#555', fontSize: 13, marginTop: 8 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 18 },
    mainStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    mainStatCard: { flex: 1, backgroundColor: '#111528', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1 },
    mainStatValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 8 },
    mainStatLabel: { fontSize: 12, color: '#888daf', marginTop: 2 },
    card: { backgroundColor: '#111528', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 14 },
    speedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    speedItem: { width: '46%', backgroundColor: 'rgba(91,99,211,0.08)', borderRadius: 12, padding: 12, alignItems: 'center' },
    speedValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
    speedLabel: { fontSize: 11, color: '#888daf', marginTop: 2 },
    caloriesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    caloriesValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
    caloriesLabel: { fontSize: 13, color: '#888daf', marginTop: 4 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(91,99,211,0.06)' },
    detailLabel: { fontSize: 13, color: '#888daf', fontWeight: '500' },
    detailValue: { fontSize: 13, fontWeight: '600', color: '#fff' },
    validatedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
    validatedText: { fontSize: 16, fontWeight: '700', color: '#2dd06e' },
    confirmBtn: { backgroundColor: '#5B63D3', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
    confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    secondaryBtns: { flexDirection: 'row', gap: 10 },
    secBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#111528', borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)' },
    secBtnText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
});
