<template>
  <div class="full-width">
    <ChatThread :scroll-area-style="scrollAreaStyle"/>
    <ControlsBox ref="controlsCard"/>
  </div>
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue";
import {QCard} from "quasar";
import {computed, onMounted, Ref, ref, watch} from "vue";
import ControlsBox from "pages/ControlsBox.vue";

const controlsCard: Ref<QCard | null> = ref(null);
const scrollAreaStyle = ref({});

const userMsgStr = ref("");
const userMsgValid = computed(() => {
  return userMsgStr.value.trim().length > 0;
});

const isTyping = ref(false);
const isTypingTimeout: Ref<any> = ref(null);

const updateIC = () => {
  setTimeout(() => {
    let controlsHeight = 0;
    if (controlsCard.value) controlsHeight = controlsCard.value.$el.clientHeight;
    const newStyle = {bottom: controlsHeight + "px"};
    if (newStyle.bottom !== scrollAreaStyle.value.bottom) {
      scrollAreaStyle.value = newStyle;
    }
  }, 100);
};

watch(userMsgStr, () => {
  updateIC();
  // introduce a delay to detect if the user is typing.
  // The coordinator will not be called until the user stops typing for a while.
  isTyping.value = true;
  if (isTypingTimeout.value) clearTimeout(isTypingTimeout.value);
  isTypingTimeout.value = setTimeout(
      () => isTyping.value = false,
      userMsgValid.value ? 1000 : 250
  );
});

onMounted(() => {
  updateIC();
});
</script>
