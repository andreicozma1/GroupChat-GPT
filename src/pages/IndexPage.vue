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
import {getRoboHashAvatarUrl} from "src/util/Utils";
import {GenerationResult, useCompStore} from "stores/compStore";
import {computed, onBeforeUnmount, onMounted, Ref, ref, watch} from "vue";
import {AssistantConfigs} from "src/util/assistant/Assistants";
import {ChatMessage} from "src/util/Chat";
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

const createAIMessage = (cfg: AssistantConfig): ChatMessage => {
  const name: string = cfg?.name || "Anonymous AI";
  const objective: string = cfg?.key || "unknown";
  let msg: ChatMessage = {
    text: [],
    images: [],
    avatar: getRoboHashAvatarUrl(name),
    name: name,
    date: new Date(),
    dateCreated: undefined,
    objective: objective,
    loading: true,
  };
  msg = comp.pushMessage(msg);
  return msg;
};

const handleCoordinator = () => {
  const ai: AssistantConfig = AssistantConfigs.coordinator;
  const msg: ChatMessage = createAIMessage(ai);

  comp.generate(ai).then(async (res: GenerationResult) => {
    console.log(res);
    msg.loading = false;
    msg.cached = res.cached;
    if (res.errorMsg) {
      msg.text.push("[ERROR]\n" + res.errorMsg);
      comp.pushMessage(msg);
      return;
    }
    if (!res.text) {
      msg.text.push("Error: No text in result]");
      comp.pushMessage(msg);
      return;
    }
    msg.dateCreated = res.result.responseData.created * 1000;
    msg.text = res.text ? [...res.text] : ["An error occurred"];
    comp.pushMessage(msg);
    const nextActors = res.text
        .flatMap((t) => t.toLowerCase().split("\n"))
        .filter((t: string) => t.includes("respond"))
        .flatMap((t: string) => t.split(":")[1].split(","))
        .map((a: string) => a.trim().toLowerCase());

    // for each actor, call the appropriate handler
    console.log("Next Actors: ", nextActors);
    for (let actor of nextActors) {
      actor = actor.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      if (orderedResponses.value) {
        await handleNext(actor);
      } else {
        handleNext(actor);
      }
    }
  });
};

const handleNext = async (actorKey: string, msg?: ChatMessage) => {
  // await sleep(Math.random() * 2500)

  actorKey = actorKey?.trim();
  const cfgFollowup: AssistantConfig = AssistantConfigs[actorKey];
  msg = msg || createAIMessage(cfgFollowup);
  if (!cfgFollowup) {
    msg.text.push(`[Error: Unknown actor type: ${actorKey}]`);
    msg.loading = false;
    comp.pushMessage(msg);
    return;
  }

  const res = await comp.generate(cfgFollowup);

  console.log(res);
  msg.loading = false;
  msg.cached = res?.cached;
  msg.date = new Date();
  if (res.errorMsg) {
    msg.text.push("[ERROR]\n" + res.errorMsg);
    comp.pushMessage(msg);
    return;
  }

  msg.dateCreated = res?.result?.responseData.created * 1000;
  if (res?.images) msg.images.push(...res.images);
  if (res?.text) msg.text.push(...res.text);

  // const totalLength = msg.text.reduce((a, b) => a + b.length, 0) + msg.images.reduce((a, b) => a + b.length, 0)
  // const sleepTime = totalLength * 25
  // console.log(`sleepTime: ${sleepTime}`)
  // await sleep(sleepTime)

  comp.pushMessage(msg);

  let createGen = cfgFollowup?.followUps;
  // if null or undefined, exit
  if (!createGen) return;
  // if string, make it an array
  if (typeof createGen === "string") createGen = [createGen];
  // for each
  for (const nextActor of createGen) {
    // filter out texts that contain <prompt> tags
    let prompts = msg.text
        .filter((t: string) => t.includes("<prompt>"))
        .map((t: string) => t.split("<prompt>")[1].trim().split("</prompt>")[0].trim());

    msg.text = msg.text.map((t: string) => {
      if (t.includes("<prompt>")) {
        const parts = t.split("<prompt>");
        const end = parts[1].split("</prompt>");
        return parts[0] + end[1];
      }
      return t.trim();
    });
    msg.text = msg.text.filter((t: string) => t.length > 0);
    // msg.text = msg.text.map((t: string) => t.replace("<prompt>", "").replace("</prompt>", ""))
    comp.pushMessage(msg);

    prompts = prompts.filter((t: string) => t.split(" ").length > 3);
    if (prompts.length > 0) {
      console.log("promptText", prompts);
      const nextActor = `${actorKey}_gen`;
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const nextMsg = createAIMessage(cfgFollowup);
        if (!prompt) {
          nextMsg.text.push(`[Error: Prompt text is empty]`);
          nextMsg.loading = false;
          comp.pushMessage(nextMsg);
          continue;
        }
        // nextMsg.text.push(`[${prompt}]`)
        nextMsg.text.push(`<prompt>${prompt}</prompt>`);
        await handleNext(nextActor, nextMsg);
      }
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
