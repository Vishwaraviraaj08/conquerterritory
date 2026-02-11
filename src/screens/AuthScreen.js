import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function AuthScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeLocation, setAgreeLocation] = useState(false);
    const [selectedTeamAction, setSelectedTeamAction] = useState(null);

    const handleSignUp = () => {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    };

    const handleSkip = () => {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoBox}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={36} color="#fff" />
                    </View>
                </View>

                <Text style={styles.title}>Join the GeoConquest</Text>
                <Text style={styles.subtitle}>
                    Unleash your inner explorer. Track,{'\n'}claim, and dominate territories{'\n'}worldwide.
                </Text>

                {/* Social Login Buttons */}
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#5B63D3' }]} activeOpacity={0.85}>
                    <FontAwesome name="google" size={18} color="#fff" />
                    <Text style={styles.socialBtnText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#2a2d3e', borderWidth: 1, borderColor: '#3a3d50' }]} activeOpacity={0.85}>
                    <Ionicons name="logo-apple" size={20} color="#fff" />
                    <Text style={styles.socialBtnText}>Continue with Apple</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#5B63D3' }]} activeOpacity={0.85}>
                    <FontAwesome name="facebook" size={20} color="#fff" />
                    <Text style={styles.socialBtnText}>Continue with Facebook</Text>
                </TouchableOpacity>

                {/* OR Divider */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Email Field */}
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={18} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="your@example.com"
                        placeholderTextColor="#555"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Password Field */}
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#555"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* Username Field */}
                <Text style={styles.fieldLabel}>Username</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Choose your adventurer name"
                        placeholderTextColor="#555"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                {/* Avatar */}
                <Text style={styles.avatarLabel}>Choose Your Avatar</Text>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={40} color="#7C83ED" />
                    </View>
                </View>

                {/* Team Selection */}
                <Text style={styles.teamLabel}>Team Selection</Text>
                <TouchableOpacity
                    style={[styles.teamBtn, selectedTeamAction === 'join' && styles.teamBtnActive]}
                    onPress={() => setSelectedTeamAction('join')}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.teamBtnText, selectedTeamAction === 'join' && styles.teamBtnTextActive]}>
                        Join an Existing Team
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.teamBtn, selectedTeamAction === 'create' && styles.teamBtnActive]}
                    onPress={() => setSelectedTeamAction('create')}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.teamBtnText, selectedTeamAction === 'create' && styles.teamBtnTextActive]}>
                        Create a New Team
                    </Text>
                </TouchableOpacity>

                {/* Sign Up / Log In */}
                <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} activeOpacity={0.85}>
                    <Text style={styles.signUpButtonText}>Sign Up / Log In</Text>
                </TouchableOpacity>

                {/* Skip */}
                <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
                    <Text style={styles.skipText}>Skip to Limited Demo</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.sectionDivider} />

                {/* Permissions */}
                <Text style={styles.permissionsTitle}>Permissions & Consent</Text>

                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAgreePrivacy(!agreePrivacy)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, agreePrivacy && styles.checkboxChecked]}>
                        {agreePrivacy && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxText}>
                        I agree to the GeoConquest Privacy Policy and Terms of Service. My data may be used to improve the game experience.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAgreeLocation(!agreeLocation)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, agreeLocation && styles.checkboxChecked]}>
                        {agreeLocation && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxText}>
                        I grant GeoConquest access to my device's precise location and motion data for core gameplay functionality and territory claiming.
                    </Text>
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
        paddingTop: 60,
        paddingBottom: 50,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(124, 131, 237, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(124, 131, 237, 0.3)',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#888daf',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 10,
        alignSelf: 'stretch',
        gap: 10,
    },
    socialBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#2a2d3e',
    },
    dividerText: {
        color: '#666',
        fontSize: 13,
        marginHorizontal: 14,
        fontWeight: '500',
    },
    fieldLabel: {
        color: '#ccc',
        fontSize: 13,
        fontWeight: '600',
        alignSelf: 'flex-start',
        marginBottom: 6,
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1e2e',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 12,
        alignSelf: 'stretch',
        gap: 10,
        borderWidth: 1,
        borderColor: '#2a2e40',
    },
    input: {
        flex: 1,
        color: '#ccc',
        fontSize: 14,
    },
    avatarLabel: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(124, 131, 237, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(124, 131, 237, 0.4)',
    },
    teamLabel: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    teamBtn: {
        borderRadius: 12,
        paddingVertical: 14,
        alignSelf: 'stretch',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#1a1e2e',
        borderWidth: 1,
        borderColor: '#5B63D3',
    },
    teamBtnActive: {
        backgroundColor: '#5B63D3',
    },
    teamBtnText: {
        color: '#ccc',
        fontSize: 15,
        fontWeight: '600',
    },
    teamBtnTextActive: {
        color: '#fff',
    },
    signUpButton: {
        backgroundColor: '#5B63D3',
        borderRadius: 14,
        paddingVertical: 16,
        alignSelf: 'stretch',
        alignItems: 'center',
        marginTop: 14,
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    skipText: {
        color: '#7C83ED',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 14,
        marginBottom: 6,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#2a2d3e',
        alignSelf: 'stretch',
        marginVertical: 20,
    },
    permissionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        marginBottom: 14,
        gap: 12,
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#4a4e68',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#5B63D3',
        borderColor: '#5B63D3',
    },
    checkboxText: {
        flex: 1,
        color: '#9094b8',
        fontSize: 13,
        lineHeight: 18,
    },
});
