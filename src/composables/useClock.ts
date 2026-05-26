import { onMounted, onUnmounted, ref } from 'vue';

export function useClock() {
  const time = ref('00:00:00');
  const date = ref('----/--/--');
  let timer: number | undefined;

  function updateClock(): void {
    const now = new Date();
    time.value = now.toTimeString().slice(0, 8);
    date.value = now.toISOString().slice(0, 10).replace(/-/g, '/');
  }

  onMounted(() => {
    updateClock();
    timer = window.setInterval(updateClock, 1000);
  });

  onUnmounted(() => {
    if (timer) window.clearInterval(timer);
  });

  return { time, date };
}
