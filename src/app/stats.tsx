import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterGreeting } from '@/components/character-greeting';
import { Colors, Spacing } from '@/constants/theme';
import { useTodoContext } from '@/contexts/todo-context';
import { localDate } from '@/utils/due-date';
import { getStatistics } from '@/utils/todo-statistics';

const colors = Colors.light;
const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;
const descriptions = {
  '최근 7일': '일반 할 일과 루틴을 실제 완료한 날짜 기준으로 집계해요.',
  '이번 주 루틴': '이번 주 예정 회차를 기준으로 계산해요. 예정 횟수는 현재 반복 규칙으로 추정하며, 삭제하거나 규칙을 변경한 루틴도 완료한 회차는 포함해요.',
  Todo: '반복하지 않는 일반 할 일 기준이에요. 기한 지난 할 일은 남은 할 일에도 포함돼요.',
};
type InfoTitle = keyof typeof descriptions;
type Info = {
  title: InfoTitle;
  held: boolean;
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

function CardHeading({ title, open, onOpen, onRelease }: {
  title: InfoTitle;
  open: boolean;
  onOpen: (title: InfoTitle, anchor: View, held: boolean) => void;
  onRelease: () => void;
}) {
  const anchor = useRef<View>(null);
  const held = useRef(false);
  return (
    <View style={styles.headingRow}>
      <Text style={styles.heading}>{title}</Text>
      <View ref={anchor} collapsable={false}>
        <Pressable
          style={styles.infoButton}
          accessibilityRole="button"
          accessibilityLabel={`${title} 집계 설명`}
          accessibilityState={{ expanded: open }}
          onLongPress={() => {
            held.current = true;
            if (anchor.current) onOpen(title, anchor.current, true);
          }}
          onPressOut={() => {
            if (held.current) onRelease();
            held.current = false;
          }}
          onPress={() => { if (anchor.current) onOpen(title, anchor.current, false); }}>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const data = useTodoContext();
  const stats = getStatistics(data, data.today);
  const chartMax = Math.max(5, ...stats.lastSevenDays.map((day) => day.count));
  const [showAll, setShowAll] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);
  const root = useRef<View>(null);
  const viewport = useRef({ width: 0, height: 0 });
  const request = useRef(0);
  const closeInfo = useCallback(() => {
    request.current += 1;
    setInfo(null);
  }, []);

  useFocusEffect(useCallback(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!info) return false;
      closeInfo();
      return true;
    });
    return () => back.remove();
  }, [closeInfo, info]));
  useFocusEffect(useCallback(() => closeInfo, [closeInfo]));

  function openInfo(title: InfoTitle, anchor: View, held: boolean) {
    if (!held && info?.title === title) {
      closeInfo();
      return;
    }
    const parent = root.current;
    if (!parent) return;
    const id = ++request.current;
    parent.measureInWindow((parentX, parentY) => anchor.measureInWindow((screenX, screenY, anchorWidth, anchorHeight) => {
      const x = screenX - parentX;
      const y = screenY - parentY;
      if (id !== request.current) return;
      const { width, height } = viewport.current;
      const margin = 12;
      const popupWidth = Math.min(288, width - margin * 2);
      if (anchorWidth <= 0 || anchorHeight <= 0 || popupWidth <= 0 || height <= margin * 2) return;
      const left = Math.max(margin, Math.min(x + anchorWidth / 2 - 24, width - popupWidth - margin));
      const below = y + anchorHeight;
      const aboveSpace = y - margin;
      const belowSpace = height - below - margin;
      const position = Math.max(aboveSpace, belowSpace) < 132
        ? { top: margin, maxHeight: height - margin * 2 }
        : belowSpace >= 132 || belowSpace >= aboveSpace
          ? { top: below, maxHeight: belowSpace }
          : { bottom: height - y, maxHeight: aboveSpace };
      setInfo({ title, held, left, width: popupWidth, ...position });
    }));
  }

  const routines = showAll ? stats.routines.items : stats.routines.items.slice(0, 3);
  const infoHeading = (title: InfoTitle) => <CardHeading title={title} open={info?.title === title}
    onOpen={openInfo} onRelease={closeInfo} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View ref={root} collapsable={false} style={styles.screen} onLayout={({ nativeEvent }) => {
        viewport.current = nativeEvent.layout;
        closeInfo();
      }}>
        <ScrollView contentContainerStyle={styles.content} onScrollBeginDrag={closeInfo}>
          <Text style={styles.title}>통계</Text>
          {!data.loaded ? <View style={[styles.card, styles.loadingCard]}>
            <Text style={styles.note}>{data.hydrationState === 'error' ? data.storageError : '완료 기록을 불러오고 있어요.'}</Text>
            {data.hydrationState === 'error' && <Pressable accessibilityRole="button" style={styles.action} onPress={data.retryStorage}>
              <Text style={styles.green}>다시 시도</Text>
            </Pressable>}
          </View> : <>
            {stats.total === 0 && <View style={styles.empty}>
              <CharacterGreeting mood="idle" message="하나씩 시작해볼까요?" />
              <Text style={styles.note}>아직 완료 기록이 없어요.</Text>
            </View>}
            <View style={styles.summary}>
              {([
                ['전체 오늘 완료', stats.todayCount],
                ['전체 이번 주 완료', stats.weekCount],
              ] as const).map(([label, count]) => <View key={label} style={[styles.card, styles.summaryCard]}>
                <Text style={styles.value}>{label}</Text>
                <Text style={[styles.value, styles.green]}>{count}개</Text>
              </View>)}
            </View>
            <Text style={styles.note}>이번 주 <Text style={styles.green}>{shortDate(stats.weekStart)} ~ {shortDate(stats.weekEnd)}</Text> · 월요일~일요일</Text>
            <View style={styles.card}>
              {infoHeading('최근 7일')}
              <View style={styles.chart}>
                {stats.lastSevenDays.map((day) => {
                  const isToday = day.date === data.today;
                  return <View key={day.date} style={styles.column} accessible accessibilityLabel={`${day.date}${isToday ? ' 오늘' : ''}, ${day.count}개 완료`}>
                    <Text style={[styles.chartLabel, styles.green]}>{day.count}</Text>
                    <View style={styles.barArea}>
                      {day.count > 0 && <View style={[styles.bar, { height: day.count / chartMax * 92 }, isToday && styles.todayBar]} />}
                    </View>
                    <Text style={[styles.chartLabel, isToday && styles.green]}>{isToday ? '오늘' : '일월화수목금토'[localDate(day.date).getDay()]}</Text>
                    <Text style={[styles.chartLabel, styles.green]}>{shortDate(day.date)}</Text>
                  </View>;
                })}
              </View>
            </View>
            <View style={styles.card}>
              {infoHeading('이번 주 루틴')}
              <View style={styles.row}>
                <Text style={styles.value}>완료 <Text style={styles.green}>{stats.routines.completed}</Text> / 예정 <Text style={styles.green}>{stats.routines.scheduled}회</Text></Text>
                <Text style={[styles.value, styles.green]}>{stats.routines.rate}%</Text>
              </View>
              {routines.length === 0 && <Text style={styles.note}>아직 루틴이 없어요. 홈에서 반복할 일을 만들어 보세요.</Text>}
              {routines.map((routine) => {
                const rate = routine.scheduled ? Math.round(routine.completed / routine.scheduled * 100) : 0;
                return <View key={routine.todoId} style={styles.routine}>
                  <View style={styles.row}>
                    <Text style={[styles.value, styles.routineName]}>{routine.title}{routine.archived ? ' (완료 이력)' : ''}</Text>
                    <Text style={[styles.value, styles.green]}>{routine.completed}/{routine.scheduled}회 · {rate}%</Text>
                  </View>
                  <View style={styles.dots} accessible accessibilityLabel={`${routine.title}, ${routine.occurrences.map(({ date, completed }) => `${shortDate(date)} ${completed ? '완료' : date < data.today ? '미완료' : '예정'}`).join(', ')}`}>
                    {routine.occurrences.map((occurrence) => <View key={occurrence.date} style={[styles.dot, occurrence.date < data.today && !occurrence.completed && styles.dotMissed, occurrence.completed && styles.dotCompleted]} />)}
                  </View>
                </View>;
              })}
              {stats.routines.items.length > 3 && <Pressable accessibilityRole="button"
                accessibilityState={{ expanded: showAll }} style={styles.action}
                onPress={() => setShowAll((expanded) => !expanded)}>
                <Text style={[styles.value, styles.green]}>{showAll ? '접기' : '더보기'}</Text>
              </Pressable>}
            </View>
            <View style={styles.card}>
              {infoHeading('Todo')}
              {([
                ['오늘 완료', stats.todos.todayCompleted],
                ['이번 주 완료', stats.todos.weekCompleted],
                ['누적 완료', stats.todos.totalCompleted],
                ['남은 할 일', stats.todos.pending],
                ['기한 지난 할 일', stats.todos.overdue],
              ] as const).map(([label, count]) => <View key={label} style={styles.row}>
                <Text style={[styles.value, styles.routineName]}>{label}</Text>
                <Text style={[styles.value, styles.green]}>{count}개</Text>
              </View>)}
            </View>
          </>}
        </ScrollView>
        {info && <View style={StyleSheet.absoluteFill} pointerEvents={info.held ? 'none' : 'box-none'}>
          {!info.held && <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={closeInfo} />}
          <View style={[styles.popover, { left: info.left, width: info.width, top: info.top, bottom: info.bottom, maxHeight: info.maxHeight }]}>
            <ScrollView bounces={false} style={styles.infoScroll}>
              <Text style={styles.infoText} accessibilityLiveRegion="polite">{descriptions[info.title]}</Text>
            </ScrollView>
          </View>
        </View>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.three, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  card: { backgroundColor: colors.backgroundElement, borderRadius: 16, paddingHorizontal: 14, paddingBottom: 14, gap: 7 },
  loadingCard: { paddingTop: 14 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flexGrow: 1, flexBasis: 124, gap: 4, paddingVertical: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center' },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  infoButton: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  infoIcon: { color: colors.primary, fontSize: 18 },
  popover: { position: 'absolute', borderRadius: 12, backgroundColor: colors.backgroundSelected,
    borderWidth: 1, borderColor: colors.primary, overflow: 'hidden' },
  infoScroll: { flexGrow: 0 },
  infoText: { padding: 12, fontSize: 14, color: colors.text },
  note: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  chart: { flexDirection: 'row', gap: 3 },
  column: { flex: 1, alignItems: 'center', gap: 4 },
  chartLabel: { fontSize: 12, textAlign: 'center', color: colors.textSecondary },
  barArea: { height: 93, width: '100%', alignItems: 'center', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected },
  bar: { width: '62%', backgroundColor: '#ACCEBA', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  todayBar: { backgroundColor: colors.primary },
  green: { color: colors.primary, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 8, rowGap: 3 },
  value: { fontSize: 14, color: colors.text },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  routine: { gap: 6, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.backgroundSelected },
  routineName: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.backgroundSelected },
  dotMissed: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.textSecondary },
  dotCompleted: { backgroundColor: colors.primary },
  empty: { gap: 6 },
  action: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8 },
});
