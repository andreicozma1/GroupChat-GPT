<template>
  <div class="full-width">
    <ChatThread :hideCoordinator="hideCoordinator" :my-name="myName" :scroll-area-style="scrollAreaStyle"/>
    <q-card ref="controlsCard" class="fixed-bottom">
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
  </div>
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue";
import {QCard, QInput} from "quasar";
import {getRoboHashAvatarUrl, handleAssistant} from "src/util/Utils";
import {useCompStore} from "stores/compStore";
import {computed, onBeforeUnmount, onMounted, Ref, ref, watch} from "vue";
import {AssistantConfigs} from "src/util/assistant/Assistants";
import {ChatMessage, createMessageFromConfig} from "src/util/Chat";
import {AssistantConfig} from "src/util/assistant/AssistantUtils";

const comp = useCompStore();

const controlsCard: Ref<QCard | null> = ref(null);
const scrollAreaStyle = ref({});
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

const handleCoordinator = async () => {
  const coordConf: AssistantConfig = AssistantConfigs.coordinator;
  const coordMsg: ChatMessage = createMessageFromConfig(coordConf, comp);

  const res = await comp.generate(coordConf);

  console.log(res);
  coordMsg.cached = res.cached;
  coordMsg.result = res.result;
  coordMsg.loading = false;
  if (res.errorMsg) {
    coordMsg.text.push("[ERROR]\n" + res.errorMsg);
    comp.pushMessage(coordMsg);
    return;
  }
  if (!res.text) {
    coordMsg.text.push("Error: No text in result]");
    comp.pushMessage(coordMsg);
    return;
  }
  coordMsg.text = res.text ? [...res.text] : ["An error occurred"];
  comp.pushMessage(coordMsg);
  const nextActors = res.text
      .flatMap((t) => t.toLowerCase().split("\n"))
      .filter((t: string) => t.includes("respond"))
      .flatMap((t: string) => t.split(":")[1].split(","))
      .map((a: string) => a.trim().toLowerCase());

  // for each actor, call the appropriate handler
  console.log("Next Actors: ", nextActors);
  for (let nextKey of nextActors) {
    nextKey = nextKey.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const nextCfg: AssistantConfig = AssistantConfigs[nextKey];
    const nextMsg = createMessageFromConfig(nextCfg, comp);
    if (!nextCfg) {
      nextMsg.text.push(`[Error: Unknown assistant key: ${nextKey}]`);
      nextMsg.loading = false;
      comp.pushMessage(nextMsg);
      return;
    }
    if (orderedResponses.value) {
      await handleAssistant(nextMsg, comp);
    } else {
      handleAssistant(nextMsg, comp);
    }
  }
};

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
      date: new Date(),
    };
    comp.pushMessage(userMsgObj.value);
  }
  userMsgObj.value.text.push(userMsgStr.value);
  userMsgStr.value = "";

  if (responseTimeout.value) clearInterval(responseTimeout.value);
  responseTimeout.value = setInterval(() => {
    if (!isTyping.value) {
      userMsgObj.value = null;
      handleCoordinator();
      clearInterval(responseTimeout.value);
    }
  }, 500);
};

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
      updateIC();
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
  updateIC();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", kbShortcuts);
});
</script>
