import React, { useState, useEffect, useCallback } from 'react';
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
import api from '../api';

const getLevelLabel = (def) => {
    if (def >= 7) return 'High';
    if (def >= 4) return 'Medium';
    return 'Low';
};

const TerritoryCard = ({ item, onLaunch }) => {
    const defLabel = getLevelLabel(item.defenseLevel);
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={styles.mapThumb}>
                    <MaterialCommunityIcons name="map-marker-radius" size={28} color="rgba(91,99,211,0.5)" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardArea}>Area: {item.area >= 1000 ? `${(item.area / 1000).toFixed(1)}k m²` : `${item.area.toFixed(0)} m²`}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, defLabel === 'High' ? styles.badgeHigh : defLabel === 'Medium' ? styles.badgeMed : styles.badgeLow]}>
                            <Text style={styles.badgeText}>{defLabel}</Text>
                        </View>
                        <Text style={styles.contestedText}>Lvl {item.defenseLevel}</Text>
                    </View>
                </View>
            </View>

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

            {/* World map overview placeholder */}
            <View style={styles.worldMap}>
                <MaterialCommunityIcons name="earth" size={50} color="rgba(91,99,211,0.3)" />
                <Text style={styles.worldMapText}>
                    {territories.length} {territories.length === 1 ? 'Territory' : 'Territories'} Claimed
                </Text>
            </View>

            <Text style={styles.listTitle}>Territory List</Text>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#5B63D3" />
                </View>
            ) : territories.length > 0 ? (
                <FlatList
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
    worldMap: {
        height: 120, marginHorizontal: 18, borderRadius: 16, backgroundColor: '#111528',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
    },
    worldMapText: { color: '#888', fontSize: 13, marginTop: 6, fontWeight: '600' },
    listTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 10 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    cardTop: { flexDirection: 'row', gap: 14, marginBottom: 12 },
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
