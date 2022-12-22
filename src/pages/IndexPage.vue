<template>
  <!--  <q-page class="row items-center justify-evenly">-->
  <div class="full-width">
    <ChatThread :my-name="myName" :scroll-area-style="scStyle" />
    <q-card class="fixed-bottom q-pa-md" ref="inputCard">
      <q-card-section>
        <q-input
          filled
          clearable
          autofocus
          autogrow
          v-model="message"
          label="Message"
        />
      </q-card-section>
      <q-card-actions>
        <q-btn label="Send" color="primary" @click="sendMessage" />
        <q-btn label="Clear Thread" color="primary" @click="comp.clearThread" />
        <q-btn label="Clear Cache" color="primary" @click="comp.clearCache" />
      </q-card-actions>
    </q-card>
  </div>
  <!--  </q-page>-->
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  GenConfig,
  promptTypes,
  TextMessage,
  useCompStore,
} from "stores/compStore";
import { getSeededAvatarURL } from "src/util/Util";

const comp = useCompStore();

const inputCard = ref(null);
const scStyle = ref({});

const myName = ref("Andrei Cozma");
const message = ref("");
const isMessageValid = computed(() => {
  return message.value.trim().length > 0;
});

const createAIMsgTemplate = (cfg: GenConfig): TextMessage => {
  const currDate = new Date();
  // if config.promptType.config has "model", use that, otherwise use "AI"
  const name = cfg.promptType.config?.model || "AI";
  return {
    text: [],
    images: [],
    avatar: getSeededAvatarURL(name),
    name: name,
    date: currDate,
    dateCreated: currDate.getTime(),
  };
};

function genFollowUp(followUpPromptType, msg: TextMessage) {
  const cfgFollowup: GenConfig = {
    promptType: followUpPromptType,
    ignoreCache: false,
  };
  comp.genTextCompletion(cfgFollowup).then((res2) => {
    console.log(res2);
    if (res2?.errorMsg) {
      console.error(res2.errorMsg);
      msg.text.push(res2.errorMsg);
      comp.pushMessage(msg);
      return;
    }
    if (res2?.text) {
      msg.text.push(...res2.text);
    }
    if (res2?.images) {
      msg.images.push(...res2.images);
    }
    msg.dateCreated = res2?.result?.created * 1000;
    msg.cached = res2?.cached;
    msg.loading = false;
    comp.pushMessage(msg);
  });
}

const getAIResponse = () => {
  const cfg: GenConfig = {
    promptType: promptTypes.chat,
    maxHistoryLen: 10,
    ignoreCache: false,
  };
  // push the initial message and then get the response to update it

  let msg: TextMessage = createAIMsgTemplate(cfg);
  msg.loading = true;
  msg = comp.pushMessage(msg);
  comp.genTextCompletion(cfg).then((res) => {
    console.log(res);
    if (!res?.result && res?.errorMsg) {
      console.error(res.errorMsg);
      msg.text = [res.errorMsg];
      msg.loading = false;
      comp.pushMessage(msg);
      return;
    }
    msg.text = res?.text ? res?.text : ["An error occurred"];
    msg.dateCreated = res?.result?.created * 1000;
    msg.cached = res?.cached;
    msg.loading = false;
    comp.pushMessage(msg);

    const cfgClassifyReq: GenConfig = {
      promptType: promptTypes.classify_req,
      ignoreCache: false,
    };
    comp.genTextCompletion(cfgClassifyReq).then((res1) => {
      console.log(res1);
      if (res1?.errorMsg) {
        console.error(res1.errorMsg);
        return;
      }
      let followUpPromptType = res1?.text[0].trim();
      if (followUpPromptType === "none") return;
      msg.loading = true;
      msg.objective = followUpPromptType;
      comp.pushMessage(msg);

      followUpPromptType = promptTypes[followUpPromptType];
      if (!followUpPromptType) {
        console.error(`Unknown follow-up prompt type: ${followUpPromptType}`);
        msg.text.push(
          `An error occurred requesting a follow-up prompt (${res1?.text})`
        );
        comp.pushMessage(msg);
        return;
      }
      genFollowUp(followUpPromptType, msg);
    });
  });
};

const sendMessage = () => {
  if (!isMessageValid.value) return;
  const currDate = new Date();
  const usrMsg: TextMessage = {
    text: [message.value],
    images: [],
    avatar: getSeededAvatarURL(myName.value),
    name: myName.value,
    date: currDate,
  };
  comp.pushMessage(usrMsg);
  message.value = "";
  getAIResponse();
};

const kbShortcuts = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

watch(message, () => {
  const ic: any = inputCard.value;
  if (ic) scStyle.value = { bottom: ic.$el.clientHeight + "px" };
});

onMounted(() => {
  document.addEventListener("keydown", kbShortcuts);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", kbShortcuts);
});
</script>
