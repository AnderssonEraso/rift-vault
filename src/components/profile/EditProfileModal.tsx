import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile, AVAILABLE_AVATARS } from '@/context/ProfileContext';
import { TCG_THEME } from '@/constants/tcgTheme';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { profile, updateProfile } = useProfile();
  const [username, setUsername] = useState(profile.username);
  const [tagline, setTagline] = useState(profile.tagline);
  const [bio, setBio] = useState(profile.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarUrl);

  const handleSave = () => {
    if (!username.trim()) return;
    updateProfile({
      username: username.trim(),
      tagline: tagline.trim(),
      bio: bio.trim(),
      avatarUrl: selectedAvatar,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E9AA8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Avatar Selector */}
            <Text style={styles.sectionTitle}>Seleccionar Avatar de Campeón</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
              {AVAILABLE_AVATARS.map(avatar => {
                const isSelected = selectedAvatar === avatar.image;
                return (
                  <TouchableOpacity
                    key={avatar.id}
                    onPress={() => setSelectedAvatar(avatar.image)}
                    style={[
                      styles.avatarOption,
                      isSelected && { borderColor: avatar.color, borderWidth: 3 },
                    ]}
                  >
                    <Image source={{ uri: avatar.image }} style={styles.avatarImg} />
                    <Text style={styles.avatarName}>{avatar.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de usuario</Text>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Ej. Zed_Master"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título de Invocador</Text>
              <TextInput
                style={styles.textInput}
                value={tagline}
                onChangeText={setTagline}
                placeholder="Ej. Coleccionista de Jonia"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Biografía</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Escribe algo sobre tu estilo de juego o cartas favoritas..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Guardar botón */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F1522',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarOption: {
    alignItems: 'center',
    marginRight: 14,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
  },
  avatarName: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#161F30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26334D',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
