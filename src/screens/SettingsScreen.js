import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const SETTINGS_KEYS = {
    NOTIFICATIONS: 'setting_notifications',
    LOCATION_SHARING: 'setting_location_sharing',
    PUBLIC_PROFILE: 'setting_public_profile',
    DARK_MODE: 'setting_dark_mode',
    METRIC_UNITS: 'setting_metric_units',
    AUTO_PAUSE: 'setting_auto_pause',
    VIBRATION: 'setting_vibration',
    SOUND: 'setting_sound',
    BATTERY_SAVER: 'setting_battery_saver',
};

const SettingRow = ({ icon, iconColor, label, description, onPress, rightComponent, danger }) => (
    <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress && !rightComponent}
    >
        <View style={[styles.settingIconWrap, { backgroundColor: danger ? 'rgba(229,57,53,0.12)' : 'rgba(91,99,211,0.12)' }]}>
            <Ionicons name={icon} size={18} color={iconColor || '#7C83ED'} />
        </View>
        <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, danger && { color: '#E53935' }]}>{label}</Text>
            {description && <Text style={styles.settingDesc}>{description}</Text>}
        </View>
        {rightComponent || (
            onPress ? <Ionicons name="chevron-forward" size={18} color="#444" /> : null
        )}
    </TouchableOpacity>
);

const ToggleRow = ({ icon, iconColor, label, description, value, onValueChange }) => (
    <SettingRow
        icon={icon}
        iconColor={iconColor}
        label={label}
        description={description}
        rightComponent={
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#3a3d50', true: '#5B63D3' }}
                thumbColor="#fff"
            />
        }
    />
);

const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState({
        notifications: true,
        locationSharing: true,
        publicProfile: true,
        darkMode: true,
        metricUnits: true,
        autoPause: true,
        vibration: true,
        sound: true,
        batterySaver: false,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const keys = Object.values(SETTINGS_KEYS);
            const pairs = await AsyncStorage.multiGet(keys);
            const loaded = {};
            pairs.forEach(([key, value]) => {
                if (value !== null) {
                    const shortKey = Object.entries(SETTINGS_KEYS).find(([, v]) => v === key)?.[0];
                    if (shortKey) {
                        loaded[shortKey.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value === 'true';
                    }
                }
            });
            setSettings(prev => ({ ...prev, ...loaded }));
        } catch (e) {
            console.log('Error loading settings:', e);
        }
    };

    const updateSetting = async (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        const storageKey = SETTINGS_KEYS[key.replace(/([A-Z])/g, '_$1').toUpperCase()] || `setting_${key}`;
        try {
            await AsyncStorage.setItem(storageKey, value.toString());
        } catch (e) {
            console.log('Error saving setting:', e);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out', style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action is permanent and cannot be undone. All your data, territories, and captures will be deleted forever.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Account Deletion', 'Please contact support@geoconquest.app to proceed with account deletion.');
                    },
                },
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear cached map tiles and temporary data. Your account data will not be affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    onPress: async () => {
                        try {
                            const keysToKeep = ['token', 'user'];
                            const allKeys = await AsyncStorage.getAllKeys();
                            const toRemove = allKeys.filter(k => !keysToKeep.includes(k) && !k.startsWith('setting_'));
                            await AsyncStorage.multiRemove(toRemove);
                            Alert.alert('Done', 'Cache cleared successfully.');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to clear cache.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.userAvatar}>
                        <Ionicons name="person" size={28} color="#7C83ED" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.username || 'Player'}</Text>
                        <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.editProfileText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Notifications */}
                <SectionHeader title="Notifications" />
                <View style={styles.section}>
                    <ToggleRow
                        icon="notifications-outline" label="Push Notifications"
                        description="Capture alerts, challenges, and updates"
                        value={settings.notifications}
                        onValueChange={(v) => updateSetting('notifications', v)}
                    />
                    <ToggleRow
                        icon="volume-high-outline" label="Sound Effects"
                        description="In-app sounds and alerts"
                        value={settings.sound}
                        onValueChange={(v) => updateSetting('sound', v)}
                    />
                    <ToggleRow
                        icon="phone-portrait-outline" label="Vibration"
                        description="Haptic feedback during captures"
                        value={settings.vibration}
                        onValueChange={(v) => updateSetting('vibration', v)}
                    />
                </View>

                {/* Privacy & Location */}
                <SectionHeader title="Privacy & Location" />
                <View style={styles.section}>
                    <ToggleRow
                        icon="location-outline" iconColor="#2dd06e" label="Location Sharing"
                        description="Share your location with nearby players"
                        value={settings.locationSharing}
                        onValueChange={(v) => updateSetting('locationSharing', v)}
                    />
                    <ToggleRow
                        icon="eye-outline" label="Public Profile"
                        description="Other players can see your stats"
                        value={settings.publicProfile}
                        onValueChange={(v) => updateSetting('publicProfile', v)}
                    />
                </View>

                {/* Activity */}
                <SectionHeader title="Activity" />
                <View style={styles.section}>
                    <ToggleRow
                        icon="pause-circle-outline" iconColor="#E8A838" label="Auto-Pause"
                        description="Pause tracking when you stop moving"
                        value={settings.autoPause}
                        onValueChange={(v) => updateSetting('autoPause', v)}
                    />
                    <ToggleRow
                        icon="speedometer-outline" label="Metric Units"
                        description="Use km/m instead of mi/ft"
                        value={settings.metricUnits}
                        onValueChange={(v) => updateSetting('metricUnits', v)}
                    />
                    <ToggleRow
                        icon="battery-half-outline" iconColor="#E53935" label="Battery Saver"
                        description="Reduce GPS accuracy to save battery"
                        value={settings.batterySaver}
                        onValueChange={(v) => updateSetting('batterySaver', v)}
                    />
                </View>

                {/* Appearance */}
                <SectionHeader title="Appearance" />
                <View style={styles.section}>
                    <ToggleRow
                        icon="moon-outline" iconColor="#B388FF" label="Dark Mode"
                        description="Always on in current version"
                        value={settings.darkMode}
                        onValueChange={(v) => updateSetting('darkMode', v)}
                    />
                </View>

                {/* Support */}
                <SectionHeader title="Support" />
                <View style={styles.section}>
                    <SettingRow
                        icon="help-circle-outline" label="Help & FAQ"
                        description="Common questions and guides"
                        onPress={() => Linking.openURL('https://geoconquest.app/help')}
                    />
                    <SettingRow
                        icon="flag-outline" label="Report a Bug"
                        description="Help us improve GeoConquest"
                        onPress={() => Linking.openURL('mailto:support@geoconquest.app?subject=Bug%20Report')}
                    />
                    <SettingRow
                        icon="document-text-outline" label="Privacy Policy"
                        onPress={() => Linking.openURL('https://geoconquest.app/privacy')}
                    />
                    <SettingRow
                        icon="document-outline" label="Terms of Service"
                        onPress={() => Linking.openURL('https://geoconquest.app/terms')}
                    />
                </View>

                {/* Data */}
                <SectionHeader title="Data" />
                <View style={styles.section}>
                    <SettingRow
                        icon="trash-outline" iconColor="#E8A838" label="Clear Cache"
                        description="Free up storage space"
                        onPress={handleClearCache}
                    />
                </View>

                {/* Account Actions */}
                <SectionHeader title="Account" />
                <View style={styles.section}>
                    <SettingRow
                        icon="log-out-outline" iconColor="#E53935" label="Log Out"
                        onPress={handleLogout} danger
                    />
                    <SettingRow
                        icon="close-circle-outline" iconColor="#E53935" label="Delete Account"
                        description="Permanently delete all your data"
                        onPress={handleDeleteAccount} danger
                    />
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={24} color="rgba(91,99,211,0.4)" />
                    <Text style={styles.appName}>GeoConquest</Text>
                    <Text style={styles.appVersion}>Version 1.0.0 (Build 1)</Text>
                    <Text style={styles.appCopyright}>© 2026 GeoConquest. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 40 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 20,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#111528', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    userCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    userAvatar: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(91,99,211,0.15)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#5B63D3',
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    userEmail: { fontSize: 12, color: '#888daf', marginTop: 2 },
    editProfileBtn: {
        backgroundColor: 'rgba(91,99,211,0.15)', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 6,
    },
    editProfileText: { color: '#7C83ED', fontSize: 13, fontWeight: '600' },
    sectionHeader: {
        fontSize: 13, fontWeight: '700', color: '#666', letterSpacing: 0.5,
        textTransform: 'uppercase', paddingHorizontal: 24, marginBottom: 8, marginTop: 4,
    },
    section: {
        backgroundColor: '#111528', borderRadius: 16, marginHorizontal: 20, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.08)', overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(91,99,211,0.06)',
    },
    settingIconWrap: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 15, fontWeight: '600', color: '#ddd' },
    settingDesc: { fontSize: 11, color: '#777', marginTop: 1 },
    appInfo: {
        alignItems: 'center', paddingVertical: 30, gap: 4,
    },
    appName: { fontSize: 16, fontWeight: '700', color: 'rgba(91,99,211,0.5)', marginTop: 6 },
    appVersion: { fontSize: 12, color: '#555' },
    appCopyright: { fontSize: 10, color: '#444', marginTop: 4 },
});
