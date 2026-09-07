import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { calendarCells, dateKey, fullDate } from '@/utils/due-date';
import { Colors } from '@/constants/theme';

const green = Colors.light.primary;
export function TodoCalendar({ value, onConfirm, onCancel }: {
  value?: string; onConfirm: (value?: string) => void; onCancel: () => void;
}) {
  // 달력 선택은 임시 상태입니다. 확인 전에는 수정 화면의 기한도 바꾸지 않아 취소할 수 있습니다.
  const [selected, setSelected] = useState(value);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    const [y, m] = value ? value.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1];
    return new Date(y, m - 1, 1);
  });
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const today = dateKey(new Date());
  function move(offset: number) {
    // Date가 12월 다음을 다음 해 1월로 처리하므로 연도 이동을 따로 구현하지 않습니다.
    const next = new Date(year, monthIndex + offset, 1);
    if (next.getFullYear() >= 1000 && next.getFullYear() <= 9999) setMonth(next);
  }
  return (
    <View>
      <View style={styles.heading}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => move(-1)} style={styles.button}><Text style={styles.nav}>‹</Text></Pressable>
        <Text style={styles.title}>{year}년 {monthIndex + 1}월</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => move(1)} style={styles.button}><Text style={styles.nav}>›</Text></Pressable>
      </View>
      <View style={styles.grid}>{['일', '월', '화', '수', '목', '금', '토'].map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
      <View style={styles.grid}>
        {calendarCells(year, monthIndex).map((day, index) => {
          const key = day === null ? '' : dateKey(new Date(year, monthIndex, day));
          return <View key={index} style={styles.cell}>{day !== null && (
            <Pressable accessibilityRole="button" accessibilityLabel={`${fullDate(key)}${key === today ? ', 오늘' : ''}`}
              accessibilityState={{ selected: selected === key }} onPress={() => setSelected(key)}
              style={[styles.day, key === today && styles.today, key === selected && styles.selected]}>
              <Text style={[styles.dayText, key === selected && styles.white]}>{day}</Text>
            </Pressable>
          )}</View>;
        })}
      </View>
      <Text style={styles.hint}>테두리: 오늘 · 초록 배경: 선택한 날짜</Text>
      <Text style={styles.hint}>{selected ? fullDate(selected) : '기한 없음'}</Text>
      <View style={styles.heading}>
        <Pressable accessibilityRole="button" onPress={() => setSelected(undefined)} style={styles.button}><Text style={styles.action}>기한 없음</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.button}><Text>취소</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => onConfirm(selected)} style={styles.button}><Text style={styles.action}>확인</Text></Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  button: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  nav: { fontSize: 28, color: green },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.285714%', textAlign: 'center', paddingVertical: 8, color: '#68756D' },
  cell: { width: '14.285714%', alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  day: { width: '100%', minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  today: { borderColor: green }, selected: { backgroundColor: green },
  dayText: { color: Colors.light.text, fontSize: 15 }, white: { color: '#FFFFFF' },
  action: { color: green, fontWeight: '600' }, hint: { fontSize: 12, color: '#68756D', textAlign: 'center', marginTop: 8 },
});
