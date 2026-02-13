import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import api from '../api';

const getLevelLabel = (def) => {
    if (def >= 7) return 'High';
    if (def >= 4) return 'Medium';
    return 'Low';
};

const formatArea = (v) => {
    if (!v) return '0 m²';
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k m²`;
    return `${v.toFixed(0)} m²`;
};

const formatDist = (v) => {
    if (!v) return '0 m';
    if (v >= 1000) return `${(v / 1000).toFixed(1)} km`;
    return `${v.toFixed(0)} m`;
};

const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const rm = m % 60;
        return `${h}h ${rm}m`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TerritoryCard = ({ item, onLaunch }) => {
    const defLabel = getLevelLabel(item.defenseLevel);
    const cap = item.capture || {};
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.cardTop} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
                <View style={styles.mapThumb}>
                    <MaterialCommunityIcons name="map-marker-radius" size={28} color="rgba(91,99,211,0.5)" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardArea}>Area: {formatArea(item.area)}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, defLabel === 'High' ? styles.badgeHigh : defLabel === 'Medium' ? styles.badgeMed : styles.badgeLow]}>
                            <Text style={styles.badgeText}>{defLabel}</Text>
                        </View>
                        <Text style={styles.contestedText}>Lvl {item.defenseLevel}</Text>
                        {item.gameMode && (
                            <View style={styles.modeBadge}>
                                <Text style={styles.modeBadgeText}>{item.gameMode}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
            </TouchableOpacity>

            {/* Capture date/time row */}
            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={13} color="#7C83ED" />
                <Text style={styles.dateText}>{formatDate(item.capturedAt || cap.capturedAt)}</Text>
                <Ionicons name="time-outline" size={13} color="#7C83ED" style={{ marginLeft: 10 }} />
                <Text style={styles.dateText}>{formatTime(item.capturedAt || cap.capturedAt)}</Text>
            </View>

            {/* Expanded capture details */}
            {expanded && cap && (
                <View style={styles.captureDetails}>
                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="run-fast" size={16} color="#E8A838" />
                            <Text style={styles.detailValue}>{formatDist(cap.distance)}</Text>
                            <Text style={styles.detailLabel}>Distance</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="timer-outline" size={16} color="#5B63D3" />
                            <Text style={styles.detailValue}>{formatDuration(cap.duration)}</Text>
                            <Text style={styles.detailLabel}>Duration</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="speedometer" size={16} color="#2dd06e" />
                            <Text style={styles.detailValue}>{(cap.avgSpeed || 0).toFixed(1)}</Text>
                            <Text style={styles.detailLabel}>Avg km/h</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="speedometer-medium" size={16} color="#E53935" />
                            <Text style={styles.detailValue}>{(cap.maxSpeed || 0).toFixed(1)}</Text>
                            <Text style={styles.detailLabel}>Max km/h</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="fire" size={16} color="#FF6B35" />
                            <Text style={styles.detailValue}>{cap.calories || 0}</Text>
                            <Text style={styles.detailLabel}>Calories</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="shoe-print" size={16} color="#9C27B0" />
                            <Text style={styles.detailValue}>{cap.pace || '--:--'}</Text>
                            <Text style={styles.detailLabel}>Pace</Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.cardMid}>
                <View style={styles.midItem}>
                    <Text style={styles.midLabel}>Owner</Text>
                    <Text style={styles.midValue}>You</Text>
                </View>
                <View style={styles.midItem}>
                    <Text style={styles.midLabel}>Durability</Text>
                    <View style={styles.durabilityBarBg}>
                        <View style={[styles.durabilityBarFill, { width: `${item.durability}%`, backgroundColor: item.durability > 70 ? '#2dd06e' : item.durability > 40 ? '#E8A838' : '#E53935' }]} />
                    </View>
                    <Text style={styles.midValue}>{item.durability}%</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8}>
                    <Ionicons name="time-outline" size={16} color="#7C83ED" />
                    <Text style={styles.historyBtnText}>View History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.launchBtn} onPress={() => onLaunch(item)} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="run-fast" size={16} color="#fff" />
                    <Text style={styles.launchBtnText}>Launch Run</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function TerritoryOverviewScreen({ navigation }) {
    const [territories, setTerritories] = useState([]);
    const [loading, setLoading] = useState(true);
    const listRef = useRef(null);

    useScrollToTop(listRef);

    const fetchTerritories = useCallback(async () => {
        try {
            const res = await api.get('/territories');
            setTerritories(res.data.territories || []);
        } catch (e) {
            console.log('Territories fetch error:', e.message);
            setTerritories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTerritories();
    }, [fetchTerritories]);

    // Summary stats
    const totalArea = territories.reduce((acc, t) => acc + (t.area || 0), 0);
    const totalCount = territories.length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Territories</Text>
                <TouchableOpacity onPress={fetchTerritories} activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="earth" size={22} color="#5B63D3" />
                    <Text style={styles.summaryValue}>{totalCount}</Text>
                    <Text style={styles.summaryLabel}>{totalCount === 1 ? 'Territory' : 'Territories'}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <MaterialCommunityIcons name="vector-polygon" size={22} color="#2dd06e" />
                    <Text style={styles.summaryValue}>{formatArea(totalArea)}</Text>
                    <Text style={styles.summaryLabel}>Total Area</Text>
                </View>
            </View>

            <Text style={styles.listTitle}>Territory List</Text>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#5B63D3" />
                </View>
            ) : territories.length > 0 ? (
                <FlatList
                    ref={listRef}
                    data={territories}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TerritoryCard
                            item={item}
                            onLaunch={() => navigation.navigate('StartCapture')}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="map-marker-off-outline" size={50} color="rgba(91,99,211,0.3)" />
                    <Text style={{ color: '#666', marginTop: 12, fontSize: 14 }}>
                        No territories yet. Go capture some!
                    </Text>
                </View>
            )}
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
        flexDirection: 'row', marginHorizontal: 18, borderRadius: 16, backgroundColor: '#111528',
        paddingVertical: 16, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    summaryItem: { alignItems: 'center', flex: 1, gap: 4 },
    summaryValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
    summaryLabel: { fontSize: 11, color: '#888daf' },
    summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(91,99,211,0.2)' },
    listTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 10 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    cardTop: { flexDirection: 'row', gap: 14, marginBottom: 8, alignItems: 'center' },
    mapThumb: {
        width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(91,99,211,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
    cardArea: { fontSize: 13, color: '#888daf', marginBottom: 6 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    badgeHigh: { backgroundColor: 'rgba(45,208,110,0.15)' },
    badgeMed: { backgroundColor: 'rgba(232,168,56,0.15)' },
    badgeLow: { backgroundColor: 'rgba(229,57,53,0.15)' },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#ccc' },
    contestedText: { fontSize: 11, color: '#666' },
    modeBadge: {
        backgroundColor: 'rgba(91,99,211,0.12)', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 2,
    },
    modeBadgeText: { fontSize: 10, fontWeight: '600', color: '#7C83ED', textTransform: 'uppercase' },
    dateRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        marginBottom: 10, paddingLeft: 4,
    },
    dateText: { fontSize: 11, color: '#888daf' },
    captureDetails: {
        backgroundColor: 'rgba(91,99,211,0.04)', borderRadius: 12,
        padding: 12, marginBottom: 10,
    },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
    detailItem: {
        width: '30%', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingVertical: 10,
    },
    detailValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
    detailLabel: { fontSize: 10, color: '#888daf' },
    cardMid: { marginBottom: 12 },
    midItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6,
    },
    midLabel: { color: '#888', fontSize: 12, fontWeight: '500', width: 80 },
    midValue: { color: '#ccc', fontSize: 13, fontWeight: '600' },
    durabilityBarBg: {
        flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3, marginHorizontal: 8,
    },
    durabilityBarFill: { height: 5, borderRadius: 3 },
    cardActions: { flexDirection: 'row', gap: 10 },
    historyBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.3)',
    },
    historyBtnText: { color: '#7C83ED', fontSize: 13, fontWeight: '600' },
    launchBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#5B63D3',
    },
    launchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
