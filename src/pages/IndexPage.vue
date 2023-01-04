<template>
  <div class="full-width">
    <ChatThread :my-name="myName" :scroll-area-style="scrollAreaStyle"/>
    <ControlsBox/>
  </div>
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue";
import {QCard, QInput} from "quasar";
import {useCompStore} from "stores/compStore";
import {computed, Ref, ref, watch} from "vue";
import ControlsBox from "pages/ControlsBox.vue";

const comp = useCompStore();

const controlsCard: Ref<QCard | null> = ref(null);
const scrollAreaStyle = ref({});


const myName = computed(() => comp.userName);

const userMsgEl: Ref<QInput | null> = ref(null);
const userMsgStr = ref("");
const userMsgValid = computed(() => {
  return userMsgStr.value.trim().length > 0;
});
const userMsgObj: Ref<any> = ref(null);

const isTyping = ref(false);
const isTypingTimeout: Ref<any> = ref(null);
const responseTimeout: Ref<any> = ref(null);


const updateIC = () => {
  setTimeout(() => {
    const ic = controlsCard.value;
    let bottom = 0;
    if (ic) bottom = ic.$el.clientHeight;
    const newStyle = {bottom: bottom + "px"};
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
      () => {
        isTyping.value = false;
      },
      userMsgValid.value ? 1000 : 250
  );
});
</script>
