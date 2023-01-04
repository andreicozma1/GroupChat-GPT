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
      <q-checkbox v-model="orderedResponses" label="Ordered Responses" left-label/>
      <q-checkbox v-model="hideCoordinator" label="Hide Coordinator" left-label/>
      <q-btn
          color="orange"
          dense
          icon-right="clear"
          label="Clear Thread"
          no-caps
          outline
          rounded
          @click="comp.clearThread"
      />
      <q-btn
          color="red"
          dense
          icon-right="delete_forever"
          label="Clear Cache"
          no-caps
          outline
          rounded
          @click="comp.clearCache"
      />
    </q-card-actions>
  </q-card>
</template>
<script setup lang="ts">


import {useCompStore} from "stores/compStore";
import {computed, onBeforeUnmount, onMounted, ref, Ref, watch} from "vue";
import {QCard, QInput} from "quasar";
import {handleCoordinator} from "src/util/Utils";
import {getRoboHashAvatarUrl} from "src/util/ImageUtils";

const comp = useCompStore();

// const controlsCard: Ref<QCard | null> = ref(null);
const hideCoordinator = ref(true);

const orderedResponses = ref(true);

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

const sendMessage = () => {
  if (!userMsgValid.value) return;
  console.warn("=======================================");
  console.log("Sending message");
  if (userMsgObj.value === null) {
    userMsgObj.value = {
      text: [],
      images: [],
      avatar: getRoboHashAvatarUrl(myName.value),
      name: myName.value,
      dateCreated: new Date(),
    };
    comp.pushMessage(userMsgObj.value);
  }
  userMsgObj.value.text.push(userMsgStr.value);
  userMsgStr.value = "";

  if (responseTimeout.value) clearInterval(responseTimeout.value);
  responseTimeout.value = setInterval(() => {
    if (!isTyping.value) {
      userMsgObj.value = null;
      handleCoordinator(comp, orderedResponses.value);
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
  // ctrl+shift+x clears thread
  if (e.key === "X" && e.ctrlKey && e.shiftKey) {
    e.preventDefault();
    comp.clearThread();
    return;
  }
  // ctrl+shift+r clears cache
  if (e.key === "R" && e.ctrlKey && e.shiftKey) {
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