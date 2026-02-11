import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const DUMMY_TERRITORIES = [
    {
        id: '1',
        name: 'Downtown Park Zone',
        area: '5.2k m²',
        defenseLevel: 'High',
        contested: '2h ago',
        owner: 'ConquestMaster',
        durability: 85,
        decayRate: '-2%/day',
    },
    {
        id: '2',
        name: 'Riverside Trail',
        area: '3.8k m²',
        defenseLevel: 'Medium',
        contested: '5h ago',
        owner: 'ConquestMaster',
        durability: 65,
        decayRate: '-3%/day',
    },
    {
        id: '3',
        name: 'University Campus',
        area: '8.1k m²',
        defenseLevel: 'High',
        contested: '1d ago',
        owner: 'ConquestMaster',
        durability: 92,
        decayRate: '-1%/day',
    },
    {
        id: '4',
        name: 'Market Square',
        area: '2.4k m²',
        defenseLevel: 'Low',
        contested: '30m ago',
        owner: 'ConquestMaster',
        durability: 40,
        decayRate: '-5%/day',
    },
    {
        id: '5',
        name: 'Stadium District',
        area: '12.0k m²',
        defenseLevel: 'High',
        contested: '3d ago',
        owner: 'ConquestMaster',
        durability: 95,
        decayRate: '-1%/day',
    },
];

const TerritoryCard = ({ item, onLaunch }) => (
    <View style={styles.card}>
        <View style={styles.cardTop}>
            {/* Map thumbnail placeholder */}
            <View style={styles.mapThumb}>
                <MaterialCommunityIcons name="map-marker-radius" size={28} color="rgba(91,99,211,0.5)" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardArea}>Area: {item.area}</Text>
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, item.defenseLevel === 'High' ? styles.badgeHigh : item.defenseLevel === 'Medium' ? styles.badgeMed : styles.badgeLow]}>
                        <Text style={styles.badgeText}>{item.defenseLevel}</Text>
                    </View>
                    <Text style={styles.contestedText}>Contested {item.contested}</Text>
                </View>
            </View>
        </View>

        <View style={styles.cardMid}>
            <View style={styles.midItem}>
                <Text style={styles.midLabel}>Owner</Text>
                <Text style={styles.midValue}>{item.owner}</Text>
            </View>
            <View style={styles.midItem}>
                <Text style={styles.midLabel}>Durability</Text>
                <View style={styles.durabilityBarBg}>
                    <View style={[styles.durabilityBarFill, { width: `${item.durability}%`, backgroundColor: item.durability > 70 ? '#2dd06e' : item.durability > 40 ? '#E8A838' : '#E53935' }]} />
                </View>
                <Text style={styles.midValue}>{item.durability}%</Text>
            </View>
            <View style={styles.midItem}>
                <Text style={styles.midLabel}>Decay Rate</Text>
                <Text style={[styles.midValue, { color: '#E53935' }]}>{item.decayRate}</Text>
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

export default function TerritoryOverviewScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Territories</Text>
                <Ionicons name="filter-outline" size={22} color="#fff" />
            </View>

            {/* World map overview placeholder */}
            <View style={styles.worldMap}>
                <MaterialCommunityIcons name="earth" size={50} color="rgba(91,99,211,0.3)" />
                <Text style={styles.worldMapText}>Territory Overview Map</Text>
            </View>

            <Text style={styles.listTitle}>Territory List</Text>

            <FlatList
                data={DUMMY_TERRITORIES}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TerritoryCard
                        item={item}
                        onLaunch={() => navigation.navigate('StartCapture')}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
    worldMapText: { color: '#555', fontSize: 12, marginTop: 6 },
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
