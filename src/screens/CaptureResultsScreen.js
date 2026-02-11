import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CaptureResultsScreen({ navigation, route }) {
    const {
        area = '12.5',
        distance = '2030',
        time = 932,
        avgSpeed = '8.5',
        maxSpeed = '15.2',
        pace = '7:03',
        points = 850,
    } = route.params || {};

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Capture Results</Text>
                    <TouchableOpacity
                        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="home-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Map Preview placeholder */}
                <View style={styles.mapPreview}>
                    <MaterialCommunityIcons name="map-outline" size={60} color="rgba(91,99,211,0.3)" />
                    <Text style={styles.mapPlaceholderText}>Territory Preview</Text>
                </View>

                <Text style={styles.sectionTitle}>Your Captured Territory</Text>

                {/* Main Stats */}
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

                {/* Speed Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Speed Summary</Text>
                    <View style={styles.speedGrid}>
                        <View style={styles.speedItem}>
                            <Text style={styles.speedValue}>{avgSpeed}</Text>
                            <Text style={styles.speedLabel}>Avg Speed (km/h)</Text>
                        </View>
                        <View style={styles.speedItem}>
                            <Text style={styles.speedValue}>{maxSpeed}</Text>
                            <Text style={styles.speedLabel}>Max Speed (km/h)</Text>
                        </View>
                        <View style={styles.speedItem}>
                            <Text style={styles.speedValue}>{formatTime(time)}</Text>
                            <Text style={styles.speedLabel}>Time</Text>
                        </View>
                        <View style={styles.speedItem}>
                            <Text style={styles.speedValue}>{pace}</Text>
                            <Text style={styles.speedLabel}>Pace (/km)</Text>
                        </View>
                    </View>
                </View>

                {/* Calories */}
                <View style={styles.card}>
                    <View style={styles.caloriesRow}>
                        <MaterialCommunityIcons name="fire" size={22} color="#E8A838" />
                        <Text style={styles.caloriesValue}>480 kcal</Text>
                    </View>
                    <Text style={styles.caloriesLabel}>Calories Burned</Text>
                </View>

                {/* Capture Validated */}
                <View style={styles.validatedRow}>
                    <Ionicons name="checkmark-circle" size={22} color="#2dd06e" />
                    <Text style={styles.validatedText}>Capture Validated</Text>
                </View>

                {/* Buttons */}
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.confirmBtnText}>Confirm Capture</Text>
                </TouchableOpacity>

                <View style={styles.secondaryBtns}>
                    <TouchableOpacity style={styles.secBtn} activeOpacity={0.8}>
                        <Ionicons name="lock-closed-outline" size={16} color="#ccc" />
                        <Text style={styles.secBtnText}>Save Private</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secBtn} activeOpacity={0.8}>
                        <Ionicons name="share-social-outline" size={16} color="#ccc" />
                        <Text style={styles.secBtnText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secBtn} activeOpacity={0.8}>
                        <Ionicons name="flag-outline" size={16} color="#ccc" />
                        <Text style={styles.secBtnText}>Dispute</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 50, paddingHorizontal: 20 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    mapPreview: {
        height: 180, borderRadius: 18, backgroundColor: '#111528',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
    },
    mapPlaceholderText: { color: '#555', fontSize: 13, marginTop: 8 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 18 },
    mainStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    mainStatCard: {
        flex: 1, backgroundColor: '#111528', borderRadius: 16, padding: 18,
        alignItems: 'center', borderWidth: 1,
    },
    mainStatValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 8 },
    mainStatLabel: { fontSize: 12, color: '#888daf', marginTop: 2 },
    card: {
        backgroundColor: '#111528', borderRadius: 16, padding: 18, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 14 },
    speedGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    },
    speedItem: {
        width: '46%', backgroundColor: 'rgba(91,99,211,0.08)', borderRadius: 12,
        padding: 12, alignItems: 'center',
    },
    speedValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
    speedLabel: { fontSize: 11, color: '#888daf', marginTop: 2 },
    caloriesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    caloriesValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
    caloriesLabel: { fontSize: 13, color: '#888daf', marginTop: 4 },
    validatedRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 20,
    },
    validatedText: { fontSize: 16, fontWeight: '700', color: '#2dd06e' },
    confirmBtn: {
        backgroundColor: '#5B63D3', borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', marginBottom: 14,
    },
    confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    secondaryBtns: { flexDirection: 'row', gap: 10 },
    secBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#111528', borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
    },
    secBtnText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
});
