import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    StatusBar, ActivityIndicator, Dimensions, Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Polyline, Polygon } from 'react-native-svg';
import { useScrollToTop } from '@react-navigation/native';
import api from '../api';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────────
const formatArea = v => {
    if (!v) return '0 m²';
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k m²`;
    return `${v.toFixed(0)} m²`;
};
const formatDist = v => {
    if (!v) return '0 m';
    if (v >= 1000) return `${(v / 1000).toFixed(1)} km`;
    return `${v.toFixed(0)} m`;
};
const formatDuration = sec => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};
const formatDate = d => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatTime = d => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ─── Mini SVG Path Preview ───────────────────────────────────────────────────────
// Renders a small scaled-down path or polygon preview from raw coordinates
const MiniMap = ({ capture, size = 60, isAttempted }) => {
    // Extract coordinates from path (LineString) OR territory polygon
    let rawCoords = null;
    if (!isAttempted && capture.territory?.coordinates?.coordinates?.[0]) {
        rawCoords = capture.territory.coordinates.coordinates[0]; // [[lng,lat],...]
    } else if (capture.path?.coordinates) {
        rawCoords = capture.path.coordinates; // [[lng,lat],...]
    }

    if (!rawCoords || rawCoords.length < 2) {
        return (
            <View style={[styles.mapThumb, { width: size, height: size, backgroundColor: isAttempted ? 'rgba(229,57,53,0.08)' : 'rgba(91,99,211,0.08)' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={28} color={isAttempted ? 'rgba(229,57,53,0.5)' : 'rgba(91,99,211,0.5)'} />
            </View>
        );
    }

    const lngs = rawCoords.map(c => c[0]);
    const lats = rawCoords.map(c => c[1]);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const rangeX = maxLng - minLng || 0.00001;
    const rangeY = maxLat - minLat || 0.00001;
    const pad = 6;
    const drawSize = size - pad * 2;

    const points = rawCoords.map(c => {
        const x = pad + ((c[0] - minLng) / rangeX) * drawSize;
        const y = pad + ((maxLat - c[1]) / rangeY) * drawSize; // flip Y
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const color = isAttempted ? '#E53935' : '#7C83ED';

    return (
        <View style={[styles.mapThumb, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {isAttempted ? (
                    <Polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeDasharray="3,2" strokeOpacity={0.85} />
                ) : (
                    <Polygon points={points} fill={`${color}33`} stroke={color} strokeWidth="2" />
                )}
            </Svg>
        </View>
    );
};

// ─── Territory Card ────────────────────────────────────────────────────────────
const TerritoryCard = ({ item, onLaunch, onRequestDelete }) => {
    const isAttempted = !item.territory;
    const territoryData = item.territory || {};
    const area = territoryData.area || item.area || 0;
    const name = territoryData.name || `Run on ${formatDate(item.capturedAt)}`;
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={[styles.card, isAttempted && { borderColor: 'rgba(229,57,53,0.35)' }]}>
            {/* Top Row: Mini Map + Info + Expand + Delete */}
            <View style={styles.cardTop}>
                <MiniMap capture={item} size={66} isAttempted={isAttempted} />
                <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, isAttempted && { color: '#E57373' }]} numberOfLines={1}>
                        {isAttempted ? '⚠ Attempted Capture' : name}
                    </Text>
                    {!isAttempted && (
                        <Text style={styles.cardArea}>Area: {formatArea(area)}</Text>
                    )}
                    <View style={styles.badgeRow}>
                        {item.gameMode && (
                            <View style={styles.modeBadge}>
                                <Text style={styles.modeBadgeText}>{item.gameMode}</Text>
                            </View>
                        )}
                        <Text style={styles.cardDist}>{formatDist(item.distance)}</Text>
                        <Text style={styles.cardDur}>{formatDuration(item.duration)}</Text>
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onRequestDelete(item._id, isAttempted ? 'Attempted Capture' : name)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color="#E53935" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Row */}
            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={isAttempted ? '#E57373' : '#7C83ED'} />
                <Text style={styles.dateText}>{formatDate(item.capturedAt)}</Text>
                <Ionicons name="time-outline" size={12} color={isAttempted ? '#E57373' : '#7C83ED'} style={{ marginLeft: 8 }} />
                <Text style={styles.dateText}>{formatTime(item.capturedAt)}</Text>
            </View>

            {/* Expanded Stats */}
            {expanded && (
                <View style={styles.captureDetails}>
                    <View style={styles.detailGrid}>
                        {[
                            { icon: 'run-fast', color: '#E8A838', value: formatDist(item.distance), label: 'Distance' },
                            { icon: 'timer-outline', color: '#5B63D3', value: formatDuration(item.duration), label: 'Duration', useIonicon: true },
                            { icon: 'speedometer', color: '#2dd06e', value: `${(item.avgSpeed || 0).toFixed(1)}`, label: 'Avg km/h' },
                            { icon: 'speedometer-medium', color: '#E53935', value: `${(item.maxSpeed || 0).toFixed(1)}`, label: 'Max km/h' },
                            { icon: 'fire', color: '#FF6B35', value: `${item.calories || 0}`, label: 'Calories' },
                            { icon: 'shoe-print', color: '#9C27B0', value: item.pace || '--:--', label: 'Pace' },
                        ].map((s, idx) => (
                            <View key={idx} style={styles.detailItem}>
                                <MaterialCommunityIcons name={s.icon} size={15} color={s.color} />
                                <Text style={styles.detailValue}>{s.value}</Text>
                                <Text style={styles.detailLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                    {!isAttempted && (
                        <TouchableOpacity style={styles.launchBtn} onPress={() => onLaunch(item)} activeOpacity={0.85}>
                            <MaterialCommunityIcons name="run-fast" size={14} color="#fff" />
                            <Text style={styles.launchBtnText}>Launch Run</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TerritoryOverviewScreen({ navigation }) {
    const [captures, setCaptures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);
    const listRef = useRef(null);
    useScrollToTop(listRef);

    // Custom popup state
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', onConfirm: null });

    const showPopup = (title, message, onConfirm) => setPopup({ visible: true, title, message, onConfirm });
    const hidePopup = () => setPopup({ visible: false, title: '', message: '', onConfirm: null });

    const fetchCaptures = useCallback(async () => {
        try {
            const res = await api.get('/captures');
            setCaptures(res.data.captures || []);
        } catch (e) {
            console.log('Captures fetch error:', e.message);
            setCaptures([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCaptures(); }, [fetchCaptures]);

    const requestDeleteCapture = (captureId, captureName) => {
        showPopup(
            'Delete Activity',
            `Are you sure you want to delete "${captureName}"? This action cannot be undone.`,
            async () => {
                setDeletingId(captureId);
                hidePopup();
                try {
                    await api.delete(`/captures/${captureId}`);
                    setCaptures(prev => prev.filter(c => c._id !== captureId));
                } catch (e) {
                    showPopup('Error', e.response?.data?.error || 'Failed to delete activity', null);
                } finally {
                    setDeletingId(null);
                }
            }
        );
    };

    const filteredCaptures = captures.filter(cap => {
        if (filter === 'captured') return !!cap.territory;
        if (filter === 'attempted') return !cap.territory;
        return true;
    });

    const totalTerritories = captures.filter(c => !!c.territory).length;
    const totalRuns = captures.length;
    const totalDistance = captures.reduce((a, c) => a + (c.distance || 0), 0);
    const totalCalories = captures.reduce((a, c) => a + (c.calories || 0), 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Activity</Text>
                <TouchableOpacity onPress={() => { setLoading(true); fetchCaptures(); }} activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="run-fast" size={20} color="#E8A838" />
                    <Text style={styles.summaryValue}>{totalRuns}</Text>
                    <Text style={styles.summaryLabel}>Runs</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="earth" size={20} color="#5B63D3" />
                    <Text style={styles.summaryValue}>{totalTerritories}</Text>
                    <Text style={styles.summaryLabel}>Territories</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={20} color="#2dd06e" />
                    <Text style={styles.summaryValue}>{formatDist(totalDistance)}</Text>
                    <Text style={styles.summaryLabel}>Distance</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
                    <Text style={styles.summaryValue}>{totalCalories}</Text>
                    <Text style={styles.summaryLabel}>Calories</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.sectionHeader}>
                <Text style={styles.listTitle}>All Activity</Text>
                <View style={styles.filterRow}>
                    {['all', 'captured', 'attempted'].map(f => (
                        <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#5B63D3" />
                </View>
            ) : filteredCaptures.length > 0 ? (
                <FlatList
                    ref={listRef}
                    data={filteredCaptures}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <TerritoryCard
                            item={item}
                            onLaunch={() => navigation.navigate('StartCapture')}
                            onRequestDelete={requestDeleteCapture}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="map-marker-off-outline" size={50} color="rgba(91,99,211,0.3)" />
                    <Text style={{ color: '#666', marginTop: 12, fontSize: 14 }}>
                        {filter === 'all' ? 'No activities yet. Go capture some!' : `No ${filter} activities found.`}
                    </Text>
                </View>
            )}

            {/* Custom Popup Modal */}
            <Modal visible={popup.visible} transparent animationType="fade" onRequestClose={hidePopup}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{popup.title}</Text>
                        <Text style={styles.modalMessage}>{popup.message}</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={hidePopup} activeOpacity={0.8}>
                                <Text style={styles.modalCancelText}>{popup.onConfirm ? 'Cancel' : 'OK'}</Text>
                            </TouchableOpacity>
                            {popup.onConfirm && (
                                <TouchableOpacity style={styles.modalDeleteBtn} onPress={popup.onConfirm} activeOpacity={0.85}>
                                    <Ionicons name="trash-outline" size={14} color="#fff" />
                                    <Text style={styles.modalDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 50, paddingHorizontal: 20, paddingBottom: 12,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    summaryRow: {
        flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, backgroundColor: '#111528',
        paddingVertical: 14, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
        alignItems: 'center',
    },
    summaryItem: { alignItems: 'center', flex: 1, gap: 3 },
    summaryValue: { fontSize: 17, fontWeight: '800', color: '#fff' },
    summaryLabel: { fontSize: 10, color: '#888daf' },
    summaryDivider: { width: 1, height: 38, backgroundColor: 'rgba(91,99,211,0.2)' },
    sectionHeader: { marginBottom: 14 },
    listTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 10 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
    filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterBtnActive: { backgroundColor: 'rgba(91,99,211,0.15)', borderColor: '#5B63D3' },
    filterText: { color: '#888', fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#7C83ED' },
    listContent: { paddingHorizontal: 14, paddingBottom: 110 },
    card: {
        backgroundColor: '#111528', borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    cardTop: { flexDirection: 'row', gap: 12, marginBottom: 6, alignItems: 'flex-start' },
    mapThumb: {
        width: 66, height: 66, borderRadius: 14, backgroundColor: 'rgba(91,99,211,0.08)',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
    cardArea: { fontSize: 12, color: '#888daf', marginBottom: 4 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    modeBadge: {
        backgroundColor: 'rgba(91,99,211,0.12)', borderRadius: 6,
        paddingHorizontal: 7, paddingVertical: 2,
    },
    modeBadgeText: { fontSize: 10, fontWeight: '700', color: '#7C83ED', textTransform: 'uppercase' },
    cardDist: { fontSize: 12, color: '#E8A838', fontWeight: '600' },
    cardDur: { fontSize: 12, color: '#888daf' },
    cardActions: { flexDirection: 'column', gap: 6, paddingTop: 2 },
    expandBtn: {
        width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    deleteBtn: {
        width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(229,57,53,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, paddingLeft: 2 },
    dateText: { fontSize: 11, color: '#666' },
    captureDetails: {
        backgroundColor: 'rgba(91,99,211,0.04)', borderRadius: 12,
        padding: 12, marginTop: 4,
    },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', marginBottom: 10 },
    detailItem: {
        width: '31%', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingVertical: 9,
    },
    detailValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
    detailLabel: { fontSize: 10, color: '#888daf' },
    launchBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#5B63D3',
    },
    launchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    // Custom Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', padding: 30,
    },
    modalCard: {
        backgroundColor: '#1a1e32', borderRadius: 20, padding: 24,
        width: '100%', maxWidth: 340,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.2)',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 10 },
    modalMessage: { fontSize: 14, color: '#aaa', lineHeight: 20, marginBottom: 22 },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalCancelBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    modalCancelText: { color: '#aaa', fontWeight: '700', fontSize: 14 },
    modalDeleteBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#E53935', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    modalDeleteText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
