import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { characterImages } from '@/constants/character';
import { ListManager } from '@/components/todo-views';
import { useTodoContext } from '@/contexts/todo-context';
import { getCompletionRecords } from '@/utils/todo-statistics';
import { prioritySymbols } from '@/utils/todo-state';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

const avatars = ['idle', 'welcome', 'completed', 'cheer'] as const;
const FEEDBACK_FORM_URL = 'https://forms.gle/8WgBa7U6EETHXhs18';
type Avatar = typeof avatars[number];
const avatarLabels = { idle: '기본', welcome: '인사', completed: '기쁨', cheer: '응원' };
const priorityLabels = { veryHigh: '매우 높음', high: '높음', medium: '보통', none: '없음' };

export default function MyScreen() {
  const layout = useResponsiveLayout();
  const data = useTodoContext();
  const { profile, settings, lists, addList, renameList, deleteList, updateProfile, updateSettings, resetAllData, storageError, retryStorage } = data;
  const name = typeof profile.displayName === 'string' ? profile.displayName : '사용자';
  const avatar = avatars.find((item) => item === profile.avatar) ?? 'idle';
  const [panel, setPanel] = useState<'profile' | 'lists' | 'history' | 'reset' | null>(null);
  // 편집 초안을 분리해서 취소했을 때 공유 프로필이 바뀌지 않게 합니다.
  const [draftName, setDraftName] = useState('');
  const [draftAvatar, setDraftAvatar] = useState<Avatar>('idle');
  const [resetStep, setResetStep] = useState(1);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const resetInFlight = useRef(false);
  const records = panel === 'history' ? getCompletionRecords(data) : [];
  function closePanel() { if (!resetInFlight.current) setPanel(null); }
  async function confirmReset() {
    // state 갱신 전 연속 탭도 차단하고 실제 저장 성공 뒤에만 완료를 안내합니다.
    if (resetInFlight.current) return;
    resetInFlight.current = true;
    setResetting(true); setResetError(null);
    try {
      if (await resetAllData()) { setPanel(null); setNotice('전체 데이터를 삭제했어요. 새롭게 시작해요.'); }
      else setResetError('삭제하지 못했어요. 다시 시도해 주세요.');
    } catch { setResetError('삭제하지 못했어요. 다시 시도해 주세요.'); }
    finally { resetInFlight.current = false; setResetting(false); }
  }
  async function openFeedbackForm() {
    try {
      await Linking.openURL(FEEDBACK_FORM_URL);
    } catch {
      setNotice('의견 보내기 화면을 열지 못했어요. 다시 시도해 주세요.');
    }
  }
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: layout.contentMaxWidth, paddingHorizontal: layout.horizontalPadding }]}>
        <Text style={styles.title}>마이</Text>
        <View style={styles.row}>
          <Image source={characterImages[avatar]} style={styles.avatar} resizeMode="contain" accessibilityLabel={`${avatarLabels[avatar]} 프로필 이미지`} />
          <View style={styles.grow}><Text style={styles.heading}>{name}</Text><Text style={styles.muted}>로컬 프로필 · 이 기기에 저장돼요</Text></View>
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => { setDraftName(name); setDraftAvatar(avatar); setPanel('profile'); }}><Text style={styles.green}>편집</Text></Pressable>
        </View>
        {notice && <Text accessibilityLiveRegion="polite" style={styles.green}>{notice}</Text>}
        {storageError && <View style={styles.section}><Text accessibilityLiveRegion="polite" style={styles.danger}>{storageError}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={retryStorage}><Text style={styles.green}>저장 다시 시도</Text></Pressable></View>}
        <View style={styles.section}><Text style={styles.heading}>내 기록</Text>
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => setPanel('lists')}><Text style={styles.text}>리스트 관리</Text><Text style={styles.muted}>{lists.length}개 ›</Text></Pressable>
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => setPanel('history')}><Text style={styles.text}>완료 기록</Text><Text style={styles.muted}>보기 ›</Text></Pressable>
        </View>
        <View style={styles.section}><Text style={styles.heading}>설정</Text>
          <View style={styles.row}><View style={styles.grow}><Text style={styles.text}>캐릭터 반응</Text><Text style={styles.muted}>할 일을 완료하면 반응해요</Text></View><Switch accessibilityLabel="캐릭터 반응" value={settings.characterReactions !== false} onValueChange={(value) => updateSettings({ characterReactions: value })} trackColor={{ true: '#B9DCC7' }} thumbColor={settings.characterReactions !== false ? Colors.light.primary : '#F4F4F4'} /></View>
          <View style={styles.row}><View style={styles.grow}><Text style={styles.text}>환영 메시지</Text><Text style={styles.muted}>시작할 때 반갑게 인사해요</Text></View><Switch accessibilityLabel="환영 메시지" value={settings.welcomeMessages !== false} onValueChange={(value) => updateSettings({ welcomeMessages: value })} trackColor={{ true: '#B9DCC7' }} thumbColor={settings.welcomeMessages !== false ? Colors.light.primary : '#F4F4F4'} /></View>
        </View>
        <View style={styles.section}><Text style={styles.heading}>도움말</Text>
          <Pressable accessibilityRole="link" style={styles.row} onPress={() => { void openFeedbackForm(); }}><View style={styles.grow}><Text style={styles.text}>의견 보내기</Text><Text style={styles.muted}>불편한 점이나 개선할 점을 알려 주세요</Text></View><Text style={styles.muted}>열기 ›</Text></Pressable>
        </View>
        <View style={styles.section}><Text style={styles.heading}>데이터</Text><Pressable accessibilityRole="button" style={styles.row} onPress={() => { setResetStep(1); setResetError(null); setPanel('reset'); }}><Text style={styles.danger}>전체 데이터 삭제</Text><Text style={styles.muted}>›</Text></Pressable></View>
        <Text style={styles.version}>easy-do · 버전 {Constants.expoConfig?.version ?? '정보 없음'}</Text>
      </ScrollView>
      {panel === 'lists' && <ListManager lists={lists} onAdd={addList} onRename={renameList} onDelete={deleteList} onClose={closePanel} />}
      {panel !== null && panel !== 'lists' && <Modal transparent animationType="fade" onRequestClose={closePanel}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={[styles.modal, { maxWidth: layout.modalMaxWidth }]} accessibilityViewIsModal>
            <View style={styles.row}><Text style={styles.heading}>{panel === 'profile' ? '프로필 편집' : panel === 'history' ? '완료 기록' : '전체 데이터 삭제'}</Text><Pressable accessibilityRole="button" disabled={resetting} style={styles.button} onPress={closePanel}><Text style={styles.green}>닫기</Text></Pressable></View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
              {panel === 'profile' && <>
                <Text style={styles.text}>닉네임</Text><TextInput style={styles.input} accessibilityLabel="닉네임" value={draftName} onChangeText={setDraftName} maxLength={30} placeholder="닉네임을 입력해 주세요" /><Text style={styles.muted}>최대 30자</Text>
                <Text style={styles.text}>프로필 이미지</Text><View style={styles.choices}>{avatars.map((choice) => <Pressable key={choice} accessibilityRole="radio" accessibilityLabel={`${avatarLabels[choice]} 이미지`} accessibilityState={{ checked: draftAvatar === choice }} style={[styles.choice, draftAvatar === choice && styles.selected]} onPress={() => setDraftAvatar(choice)}><Image source={characterImages[choice]} style={styles.choiceImage} resizeMode="contain" /><Text style={styles.muted}>{avatarLabels[choice]}</Text></Pressable>)}</View>
                <Pressable accessibilityRole="button" disabled={!draftName.trim()} style={[styles.primaryButton, !draftName.trim() && styles.disabled]} onPress={() => { updateProfile(draftName.trim(), draftAvatar); setPanel(null); }}><Text style={styles.primaryText}>저장</Text></Pressable>
              </>}
              {panel === 'history' && <><Text style={styles.muted}>최근 완료한 순서예요.</Text>{records.length === 0 ? <Text style={styles.empty}>아직 완료 기록이 없어요.</Text> : records.map((record) => <View key={record.key} style={styles.record}><Text style={styles.text}>{record.title}</Text><Text style={styles.muted}>{record.kind === 'routine' ? '루틴' : '할 일'} · 우선순위 {prioritySymbols[record.priority] ? `${prioritySymbols[record.priority]} ` : ''}{priorityLabels[record.priority]}</Text><Text style={styles.muted}>{new Date(record.completedAt).toLocaleString('ko-KR')}</Text></View>)}</>}
              {panel === 'reset' && <>
                <Text style={styles.heading}>{resetStep === 1 ? '삭제할 데이터를 확인해 주세요' : '정말 모두 삭제할까요?'}</Text><Text style={styles.text}>할 일, 리스트, 완료 기록, 루틴 완료 기록, 프로필, 설정이 모두 삭제돼요.</Text><Text style={styles.danger}>삭제한 데이터는 되돌릴 수 없어요.</Text>
                {resetError && <Text accessibilityLiveRegion="assertive" style={styles.danger}>{resetError}</Text>}
                {resetting && <View style={styles.row}><ActivityIndicator color={Colors.light.primary} /><Text style={styles.muted}>데이터 삭제 중…</Text></View>}
                <Pressable accessibilityRole="button" disabled={resetting} style={[styles.primaryButton, styles.dangerButton, resetting && styles.disabled]} onPress={resetStep === 1 ? () => setResetStep(2) : () => { void confirmReset(); }}><Text style={styles.primaryText}>{resetStep === 1 ? '계속' : '전체 데이터 삭제하기'}</Text></Pressable><Pressable accessibilityRole="button" disabled={resetting} style={styles.button} onPress={closePanel}><Text style={styles.green}>취소</Text></Pressable>
              </>}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingVertical: 20, gap: 20, paddingBottom: 32, width: '100%', alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
  heading: { fontSize: 17, fontWeight: '700', color: Colors.light.text, flexShrink: 1 },
  text: { fontSize: 15, color: Colors.light.text, flexShrink: 1 },
  muted: { fontSize: 13, color: Colors.light.textSecondary },
  green: { color: Colors.light.primary, fontWeight: '600' },
  danger: { color: '#B52F3B', fontSize: 14, flexShrink: 1 },
  avatar: { width: 64, height: 64 }, grow: { flex: 1, gap: 4 },
  section: { gap: 8, borderTopWidth: 1, borderTopColor: '#E9EEE9', paddingTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, paddingVertical: 8 },
  button: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  version: { textAlign: 'center', color: Colors.light.textSecondary, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', padding: 20, justifyContent: 'center', alignItems: 'center' },
  modal: { width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 },
  form: { gap: 14, paddingBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#D9E3DC', borderRadius: 10, padding: 12, fontSize: 16, color: Colors.light.text },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { alignItems: 'center', padding: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 12 },
  selected: { borderColor: Colors.light.primary, backgroundColor: Colors.light.backgroundSelected },
  choiceImage: { width: 56, height: 56 },
  primaryButton: { backgroundColor: Colors.light.primary, borderRadius: 12, minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 12 },
  dangerButton: { backgroundColor: '#B52F3B' }, primaryText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }, disabled: { opacity: 0.45 },
  record: { gap: 5, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9EEE9' },
  empty: { color: Colors.light.textSecondary, textAlign: 'center', paddingVertical: 28 },
});
