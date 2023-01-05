<template>
  <q-card class="fixed-bottom">
    <q-card-section class="q-px-sm q-pt-sm q-pb-none">
      <q-input
          ref="userMsgEl"
          v-model="userMsgStr"
          autofocus
          autogrow
          clearable
          label="Message"
          maxlength="2000"
          outlined
          type="textarea"
      />
    </q-card-section>
    <q-card-actions>
      <q-btn
          :disable="!userMsgValid"
          color="primary"
          icon="send"
          label="Send"
          padding="5px 20px"
          rounded
          @click="sendMessage"
      />
      <q-space/>
    </q-card-actions>
  </q-card>
</template>
<script setup lang="ts">


import {useCompStore} from "stores/compStore";
import {computed, onBeforeUnmount, onMounted, ref, Ref, watch} from "vue";
import {QCard, QInput} from "quasar";
import {buildMessage} from "src/util/chat/ChatUtils";
import {ChatMessage} from "src/util/chat/ChatModels";
import {ConfigUserBase} from "src/util/chat/ConfigUserBase";
import {handleCoordinator} from "src/util/assistant/AssistantHandlers";

const comp = useCompStore();

const userMsgEl: Ref<QInput | null> = ref(null);
const userMsgStr = ref("");
const userMsgValid = computed(() => {
  return userMsgStr.value.trim().length > 0;
});

const userMsgObj: Ref<ChatMessage | null> = ref(null);

const isTyping = ref(false);
const isTypingTimeout: Ref<any> = ref(null);
const responseTimeout: Ref<any> = ref(null);

const sendMessage = () => {
  if (!userMsgValid.value) return;
  console.warn("=======================================");
  console.log("Sending message");
  if (userMsgObj.value === null) {
    userMsgObj.value = buildMessage(ConfigUserBase, comp)
    comp.pushMessage(userMsgObj.value);
  }
  userMsgObj.value.textSnippets.push(userMsgStr.value);
  userMsgStr.value = "";

  if (responseTimeout.value) clearInterval(responseTimeout.value);
  responseTimeout.value = setInterval(() => {
    if (!isTyping.value) {
      userMsgObj.value = null;
      handleCoordinator(comp, comp.getThread.prefs?.orderedResponses);
      clearInterval(responseTimeout.value);
    }
  }, 500);
};


watch(userMsgStr, () => {
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

const kbShortcuts = (e: KeyboardEvent) => {
  // ctrl/cmd+shift+x clears thread
  if (e.key.toLowerCase() === "x" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
    e.preventDefault();
    comp.clearThread();
    return;
  }
  // ctrl/cmd+shift+r clears cache
  if (e.key.toLowerCase() === "r" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
    e.preventDefault();
    comp.clearCache();
    return;
  }
  // enter sends userMsgStr
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
    return;
  }
  // on escape first clear the input, then unfocus it
  if (e.key === "Escape") {
    if (userMsgEl.value) {
      if (userMsgStr.value) {
        userMsgStr.value = "";
      } else {
        userMsgEl.value.blur();
      }
      return;
    }
  }
  // if any number or letter is pressed, focus the input
  if (userMsgEl.value && e.key.match(/^[a-z0-9]$/i)) {
    console.log("Focusing input");
    userMsgEl.value.focus();
    return;
  }
};

onMounted(() => {
  document.addEventListener("keydown", kbShortcuts);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", kbShortcuts);
});

</script>