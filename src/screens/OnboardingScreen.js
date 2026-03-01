import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function OnboardingScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.sectionTitle}>Geo Conquest</Text>
                </View>

                {/* Tagline */}
                <Text style={styles.tagline}>
                    Transform real-world movement{'\n'}into a competitive territory{'\n'}capture game.
                </Text>

                {/* Core Principles */}
                <Text style={styles.sectionTitle}>Core Principles</Text>

                <View style={styles.principleRow}>
                    <MaterialCommunityIcons name="sword-cross" size={24} color="#7C83ED" />
                    <Text style={styles.principleText}>Territories are temporary</Text>
                </View>

                <View style={styles.principleRow}>
                    <Ionicons name="locate-outline" size={24} color="#7C83ED" />
                    <Text style={styles.principleText}>Physical effort unlocks power</Text>
                </View>

                <View style={styles.principleRow}>
                    <MaterialCommunityIcons name="vector-polygon" size={24} color="#7C83ED" />
                    <Text style={styles.principleText}>Close the loop to capture</Text>
                </View>

                {/* Get Started */}
                <Text style={styles.getStartedTitle}>Get Started</Text>
                <Text style={styles.getStartedSub}>GeoConquest requires access to:</Text>

                {/* Permission Cards */}
                <View style={styles.permissionCard}>
                    <Ionicons name="location" size={22} color="#7C83ED" />
                    <View style={styles.permissionTextBlock}>
                        <Text style={styles.permissionTitle}>Location Services</Text>
                        <Text style={styles.permissionDesc}>
                            Enable GPS to track your real-world movement and define territories on the map.
                        </Text>
                    </View>
                </View>

                <View style={styles.permissionCard}>
                    <MaterialCommunityIcons name="motion-sensor" size={22} color="#7C83ED" />
                    <View style={styles.permissionTextBlock}>
                        <Text style={styles.permissionTitle}>Motion Sensors</Text>
                        <Text style={styles.permissionDesc}>
                            Allows the app to accurately track your physical activity and ensure fair gameplay.
                        </Text>
                    </View>
                </View>



                {/* Sign Up Button */}
                <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={() => navigation.navigate('Auth')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.signUpButtonText}>Sign Up / Log In</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0e1a',
    },
    scrollContent: {
        paddingTop: 70,
        paddingBottom: 50,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 10,
    },
    logoBox: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: 'rgba(124, 131, 237, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(124, 131, 237, 0.3)',
    },
    tagline: {
        fontSize: 18,
        color: '#8B92D6',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 30,
        fontWeight: '400',
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 28,
    },
    principleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
        alignSelf: 'flex-start',
        paddingLeft: 8,
    },
    principleText: {
        fontSize: 17,
        color: '#d0d3e8',
        fontWeight: '500',
    },
    getStartedTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 6,
    },
    getStartedSub: {
        fontSize: 14,
        color: '#888daf',
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 35, 60, 0.8)',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        alignSelf: 'stretch',
        alignItems: 'flex-start',
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(124, 131, 237, 0.15)',
    },
    permissionTextBlock: {
        flex: 1,
    },
    permissionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    permissionDesc: {
        fontSize: 13,
        color: '#9094b8',
        lineHeight: 18,
    },
    signUpButton: {
        backgroundColor: '#5B63D3',
        borderRadius: 14,
        paddingVertical: 16,
        alignSelf: 'stretch',
        alignItems: 'center',
        marginTop: 24,
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
