import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterGreeting } from '@/components/character-greeting';
import { Colors, Spacing } from '@/constants/theme';
import { useTodoContext } from '@/contexts/todo-context';
import { localDate } from '@/utils/due-date';
import { getStatistics } from '@/utils/todo-statistics';

const colors = Colors.light;
const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;

export default function StatsScreen() {
  const data = useTodoContext();
  // 통계용 상태를 따로 저장하지 않아 완료 취소·삭제·자정 정리가 즉시 같은 원본에 반영됩니다.
  const stats = getStatistics(data, data.today);
  const maxCount = Math.max(1, ...stats.lastSevenDays.map((day) => day.count));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>통계</Text>
        {!data.loaded ? <View style={styles.card}>
          <Text style={styles.note}>{data.hydrationState === 'error' ? data.storageError : '완료 기록을 불러오고 있어요.'}</Text>
          {data.hydrationState === 'error' && <Pressable accessibilityRole="button" style={styles.retry} onPress={data.retryStorage}>
            <Text style={styles.green}>다시 시도</Text>
          </Pressable>}
        </View> : <>
          {stats.total === 0 && <View style={styles.empty}>
            <CharacterGreeting mood="idle" message="하나씩 시작해볼까요?" />
            <Text style={styles.note}>아직 완료 기록이 없어요.</Text>
          </View>}
          {stats.total > 0 && <><View style={styles.summary}>
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.note}>전체 오늘 완료</Text><Text style={styles.number}>{stats.todayCount}<Text style={styles.unit}>개</Text></Text>
            </View>
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.note}>전체 이번 주 완료</Text><Text style={styles.number}>{stats.weekCount}<Text style={styles.unit}>개</Text></Text>
            </View>
          </View>
          <Text style={styles.note}>이번 주 {shortDate(stats.weekStart)} ~ {shortDate(stats.weekEnd)} · 월요일~일요일</Text>
          <View style={styles.card}>
            <Text style={styles.heading}>최근 7일</Text>
            <Text style={styles.note}>일반 할 일과 루틴을 실제 완료한 날짜 기준이에요.</Text>
            <View style={styles.chart}>
              {stats.lastSevenDays.map((day) => {
                const isToday = day.date === data.today;
                return <View key={day.date} style={styles.column} accessible accessibilityLabel={`${day.date}${isToday ? ' 오늘' : ''}, ${day.count}개 완료`}>
                  <Text style={[styles.count, isToday && styles.green]}>{day.count}</Text>
                  <View style={styles.barArea}>
                    <View style={[styles.bar, { height: day.count / maxCount * 92 }, isToday && styles.todayBar]} />
                  </View>
                  <Text style={[styles.day, isToday && styles.green]}>{isToday ? '오늘' : '일월화수목금토'[localDate(day.date).getDay()]}</Text>
                  <Text style={styles.date}>{shortDate(day.date)}</Text>
                </View>;
              })}
            </View>
          </View>
          </>}
          <View style={styles.card}>
            <Text style={styles.heading}>이번 주 루틴</Text>
            {!data.todos.some((todo) => todo.recurrence) && stats.routines.completed === 0 ?
              <Text style={styles.note}>아직 루틴이 없어요. 홈에서 반복할 일을 만들어 보세요.</Text> : <>
            <Text style={styles.note}>이번 주 예정 회차 기준</Text>
            <View style={styles.row}><Text style={styles.value}>완료 {stats.routines.completed} / 예정 {stats.routines.scheduled}회</Text>
              <Text style={styles.rate}>{stats.routines.rate}%</Text></View>
            <View style={styles.dots} accessible accessibilityLabel={`이번 주 루틴 ${stats.routines.completed}회 완료, ${stats.routines.scheduled}회 예정`}>
              {Array.from({ length: stats.routines.scheduled }, (_, index) => <View key={index} style={[styles.dot, index < stats.routines.completed && styles.dotCompleted]} />)}
            </View>
            <Text style={styles.note}>예정 횟수는 현재 반복 규칙을 기준으로 추정해요. 삭제하거나 규칙을 바꾼 루틴도 완료한 회차는 포함해요.</Text>
            </>}
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Todo</Text>
            <Text style={styles.note}>반복하지 않는 할 일 기준이에요.</Text>
            {stats.todos.totalCompleted === 0 && stats.todos.pending === 0 ?
              <Text style={styles.note}>아직 Todo가 없어요. 홈에서 할 일을 추가해 보세요.</Text> : <>
              <View style={[styles.row, styles.primaryRow]}><Text style={styles.value}>오늘 완료</Text><Text style={styles.primaryValue}>{stats.todos.todayCompleted}개</Text></View>
              <View style={styles.row}><Text style={styles.value}>이번 주 완료</Text><Text style={styles.green}>{stats.todos.weekCompleted}개</Text></View>
              <View style={styles.row}><Text style={styles.value}>누적 완료</Text><Text style={styles.value}>{stats.todos.totalCompleted}개</Text></View>
              <View style={[styles.row, styles.primaryRow]}><Text style={styles.value}>남은 할 일</Text><Text style={styles.primaryValue}>{stats.todos.pending}개</Text></View>
              <View style={styles.row}><Text style={styles.value}>기한 지난 할 일</Text><Text style={styles.value}>{stats.todos.overdue}개</Text></View>
              <Text style={styles.note}>기한 지난 할 일은 남은 할 일에 포함돼요.</Text>
            </>}
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.four, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  card: { backgroundColor: colors.backgroundElement, borderRadius: 16, padding: 16, gap: 10 },
  summary: { flexDirection: 'row', gap: 12 }, summaryCard: { flex: 1, minHeight: 108, justifyContent: 'space-between' },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  number: { fontSize: 30, fontWeight: '700', color: colors.primary },
  unit: { fontSize: 15, fontWeight: '500' },
  chart: { flexDirection: 'row', gap: 5, marginTop: 6 },
  column: { flex: 1, alignItems: 'center', gap: 6 },
  count: { color: colors.textSecondary, fontSize: 13 },
  barArea: { height: 94, width: '100%', alignItems: 'center', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected },
  bar: { width: '62%', backgroundColor: '#ACCEBA', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  todayBar: { backgroundColor: colors.primary }, green: { color: colors.primary, fontWeight: '700' },
  day: { fontSize: 12, color: colors.textSecondary }, date: { fontSize: 10, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  primaryRow: { paddingVertical: 3 }, value: { fontSize: 14, color: colors.text }, primaryValue: { fontSize: 20, fontWeight: '700', color: colors.primary }, rate: { fontSize: 24, fontWeight: '700', color: colors.primary },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, minHeight: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.backgroundSelected }, dotCompleted: { backgroundColor: colors.primary },
  empty: { gap: 8 }, retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
