import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recurrence } from '@/types/todo';
import { Colors } from '@/constants/theme';
import { localDate } from '@/utils/due-date';

export function RecurrencePicker({ value, startDate, onChange }: {
  value?: Recurrence; startDate: string; onChange: (value?: Recurrence) => void;
}) {
  const options = [['none', '없음'], ['daily', '매일'], ['weekly', '매주'], ['monthly', '매월']] as const;
  // 반복 기준일과 규칙을 함께 보관해 미래 시작일도 표현합니다. 월말 보정은 표시할 회차 계산에서만 합니다.
  function choose(type: typeof options[number][0]) {
    if (type === 'none') onChange(undefined);
    else if (type === 'weekly') onChange({ type, startDate, weekdays: [localDate(startDate).getDay()] });
    else if (type === 'monthly') onChange({ type, startDate, day: localDate(startDate).getDate() });
    else onChange({ type, startDate });
  }
  return <View style={styles.form}>
    <View style={styles.wrap}>{options.map(([type, label]) => <Pressable key={type} accessibilityRole="radio"
      accessibilityState={{ checked: (value?.type ?? 'none') === type }} onPress={() => choose(type)}
      style={[styles.choice, (value?.type ?? 'none') === type && styles.selected]}><Text style={styles.text}>{label}</Text></Pressable>)}</View>
    {value?.type === 'weekly' && <>
      <Text style={styles.hint}>반복 요일 (하나 이상 선택)</Text>
      <View style={styles.wrap}>{[0, 1, 2, 3, 4, 5, 6].map((day) => <Pressable key={day} accessibilityRole="checkbox"
        accessibilityLabel={`${'일월화수목금토'[day]}요일`} accessibilityState={{ checked: value.weekdays.includes(day) }}
        style={[styles.day, value.weekdays.includes(day) && styles.selected]} onPress={() => {
          const weekdays = value.weekdays.includes(day) ? value.weekdays.filter((d) => d !== day) : [...value.weekdays, day];
          if (weekdays.length) onChange({ ...value, weekdays: weekdays.sort() });
        }}><Text style={styles.text}>{'일월화수목금토'[day]}</Text></Pressable>)}</View>
    </>}
    {value?.type === 'monthly' && <>
      <Text style={styles.hint}>매월 {value.day}일 · 없는 날짜는 그달 마지막 날</Text>
      <View style={styles.wrap}>{Array.from({ length: 31 }, (_, i) => i + 1).map((day) => <Pressable key={day}
        accessibilityRole="radio" accessibilityLabel={`매월 ${day}일`} accessibilityState={{ checked: value.day === day }}
        onPress={() => onChange({ ...value, day })} style={[styles.day, value.day === day && styles.selected]}><Text style={styles.text}>{day}</Text></Pressable>)}</View>
    </>}
    {value && <Text style={styles.hint}>체크하면 이번 회차만 완료돼요. 다음 반복일에는 새 회차가 나타나요.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  form: { gap: 6 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  choice: { minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 10, backgroundColor: '#F3F5F3' },
  day: { width: '13%', minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F3F5F3' },
  selected: { backgroundColor: Colors.light.backgroundSelected, borderWidth: 1, borderColor: Colors.light.primary },
  text: { color: Colors.light.text, fontSize: 13 }, hint: { color: Colors.light.textSecondary, fontSize: 12, lineHeight: 18 },
});
