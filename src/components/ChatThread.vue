<template>
  <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message :label="threadMessages.length.toString() + ' messages'" class="q-pt-md"/>
    <div v-for="msg in threadMessages" :key="msg.dateCreated">
      <q-chat-message size="6"
                      :sent="isSentByMe(msg)"
                      :bg-color="isSentByMe(msg) ? null : getSeededQColor(msg.name, 1, 2)"
                      v-bind="msg">
        <div v-for="text in msg.text" :key="text">
          <div v-for="line in getSplitText(text)" :key="line" @click="copyMessage(text)" v-html="sanitizeLine(line)"/>
          <q-tooltip v-if="msg.dateCreated" :delay="750">
            {{ createContentHoverHint(msg) }}
          </q-tooltip>
        </div>

        <template v-if="msg.loading">
          <q-spinner-dots class="q-ml-md" color="primary" size="2em"/>
        </template>

        <template v-slot:stamp>
          <div class="row items-center">
            <span>
              <q-icon :name="getAssistantIcon(msg.assistantKey)" class="q-mr-sm"/>
                <q-tooltip>
                {{ msg.assistantKey }}
              </q-tooltip>
            </span>
            <span class="text-caption text-italic">
              {{ createStamp(msg) }}
              <q-tooltip>
                {{ createStampHoverHint(msg) }}
              </q-tooltip>
            </span>
            <q-space/>
            <span v-if="msg.cached">
              <q-icon class="q-ml-sm" name="cached"/>
              <q-tooltip v-if="msg.dateCreated">
                This message was retrieved from cache.
              </q-tooltip>
            </span>
            <q-btn dense
                   round
                   flat
                   size="xs"
                   icon="delete_forever"
                   color="black"
                   @click="deleteMessage(msg)"/>
            <q-btn dense
                   round
                   flat
                   size="xs"
                   icon="edit"
                   color="black"
                   @click="editMessage(msg)"/>
            <q-btn dense
                   round
                   flat
                   size="xs"
                   icon="refresh"
                   color="black"
                   v-if="canRegenMessage(msg)"
                   @click="regenMessage(msg)"/>
          </div>
        </template>

        <div v-if="msg.images.length > 0">
          <q-card v-for="image in msg.images" :key="image" :title="image" class="bg-grey-1" flat>
            <q-card-section class="q-pa-none">
              <q-img :src="image" draggable fit="contain" style="max-height: 400px"/>
            </q-card-section>
          </q-card>
        </div>
      </q-chat-message>
    </div>
  </q-scroll-area>
</template>

<script lang="ts" setup>
import {copyToClipboard} from "quasar";
import {getSeededQColor} from "src/util/Colors";
import {convertDate, dateToStr, getAppVersion, getTimeAgo, handleAssistant, smartNotify} from "src/util/Utils";
import {useCompStore} from "stores/compStore";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {AssistantConfigs} from "src/util/assistant/Assistants";
import {ChatMessage, getThreadMessages} from "src/util/ChatUtils";

const props = defineProps({
  myName: {
    type: String,
    required: true,
  },
  scrollAreaStyle: {
    type: Object,
    required: false,
    default: null,
  },
  hideCoordinator: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const comp = useCompStore();

const threadElem: any = ref(null);
const threadMessages: Ref<ChatMessage[]> = ref([]);

const getAssistantIcon = (assistantKey: string) => {
  if (!AssistantConfigs[assistantKey]) return "send";
  if (!AssistantConfigs[assistantKey].icon) return "help";
  return AssistantConfigs[assistantKey].icon;
};

const parseThreadMessages = (): ChatMessage[] => {
  let thrd: ChatMessage[] = getThreadMessages(comp.getThread).map((msg: ChatMessage) => {
    const text = msg.text.length === 0 ? [] : [...msg.text];
    if (!msg.loading && text.length === 0) text.push("[No message]");
    return {
      ...msg,
      text: text,
    };
  });
  // filter out messages from Coordinator messages if hideCoordinator is true
  if (props.hideCoordinator) {
    thrd = thrd.filter((msg: ChatMessage) => {
      if (msg.text.some((line: string) => line.includes("[ERROR]") || line.includes("[WARN]"))) return true;
      return msg.name !== AssistantConfigs.coordinator.name;
    });
  }
  thrd.sort((a, b) => {
    const ad = convertDate(a.dateCreated);
    const bd = convertDate(b.dateCreated);
    return ad.getTime() - bd.getTime();
  });
  // keep loading last
  thrd.sort((a, b) => {
    if (a.loading && !b.loading) return 1;
    if (!a.loading && b.loading) return -1;
    return 0;
  });
  return thrd;
};


const createStamp = (msg: ChatMessage) => {
  const what = isSentByMe(msg) ? "Sent" : "Received";
  const on = getTimeAgo(msg.dateCreated)
  let res = `${what} ${on}`
  if (msg.isRegen) res = `*${res}`;
  return res;
};


const createContentHoverHint = (msg: ChatMessage) => {
  const numTexts = msg.text?.length ?? 0;
  const numImages = msg.images?.length ?? 0;
  const who = isSentByMe(msg) ? "You" : msg.name;
  const what = `${numTexts} text and ${numImages} image${numImages > 1 ? "s" : ""}`;
  const when = dateToStr(msg.dateCreated);
  return `${who} sent ${what} on ${when}`;
};

const createStampHoverHint = (msg: ChatMessage) => {
  const when = dateToStr(msg.dateCreated);
  const what = isSentByMe(msg) ? "Sent" : "Received";
  let res = `${what} on ${when}`;
  const dateGenerated = msg.result?.responseData?.created * 1000;
  if (dateGenerated) {
    res += '\n\n' + ` [Generated on ${dateToStr(dateGenerated)}]`;
  }
  return res;
};


const isSentByMe = (msg: ChatMessage) => {
  return msg.name === props.myName;
};

const getScrollAreaStyle = computed(() => {
  const propStyle = props.scrollAreaStyle ? props.scrollAreaStyle : {};
  const defaults = {
    position: "absolute",
    left: "0px",
    right: "0px",
    top: "50px",
    bottom: "0px",
    paddingLeft: "5vw",
    paddingRight: "5vw",
    paddingBottom: "2vh",
  };
  return {
    ...defaults,
    ...propStyle,
  };
});

const scrollToBottom = (duration?: number) => {
  if (threadElem.value) {
    duration = duration ?? 750;
    // scroll to bottom. The element is q-scroll-area
    const size = threadElem.value.getScroll().verticalSize;
    threadElem.value.setScrollPosition("vertical", size, duration);
  }
};

const getSplitText = (text: string) => {
  const fallback = ["[Error: Text is null]"];
  // split text into lines
  return text?.split("\n") ?? fallback;
};

const sanitizeLine = (line: string) => {
  // remove all html tags except for allowed tags
  const allowed = {
    prompt: "b",
    image: "b",
    code: "b",
  };
  // remove all opening and closing tags except for the keys in allowed
  const regex = /<\/?([a-z]+)[^>]*>/gi;
  const sanitized = line.replace(regex, (match, p1) => {
    if (p1 in allowed) return `<${allowed[p1]}>`;
    return "";
  });
  return sanitized;
};
const copyMessage = (text: string) => {
  copyToClipboard(text).then(() => {
    smartNotify(`Copied message to clipboard`);
  });
};

const editMessage = (msg: ChatMessage) => {
  smartNotify(`Message editing is not yet implemented`);
  console.warn("=> edit:", {...msg});
  // comp.editMessage(msg);
};

const regenMessage = (msg: ChatMessage) => {
  smartNotify('Re-generating message');
  console.warn("=> regenerate:", {...msg});
  console.warn("=> regenerate:", msg.result.messageIds);
  handleAssistant(msg, comp);
};

const canRegenMessage = (msg: ChatMessage) => {
  const msgIds = msg.result?.messageIds
  if (msgIds) return msgIds.length > 0
  return false
};

const deleteMessage = (msg: ChatMessage) => {
  smartNotify(`Message deletion is not yet implemented`);
  console.warn("=> delete:", {...msg});
  // comp.deleteMessage(msg);
};

const loadThread = () => {
  try {
    threadMessages.value = parseThreadMessages();
    scrollToBottom(1000);
  } catch (err: any) {
    console.error("Error loading chat thread", err);
    smartNotify(`Error loading chat thread.`);
    const threadVer = comp.getThread.appVersion;
    let msg = ''
    if (threadVer) {
      msg = `Thread from ${comp.getThread.appVersion} not compatible with ${getAppVersion()}.`
    } else {
      msg = `Thread is not compatible with ${getAppVersion()}.`
    }
    msg += ' '
    msg += 'Please try again with a new thread or clear cache.'
    smartNotify(msg);
  }
}

watch(
    () => props.scrollAreaStyle,
    () => {
      scrollToBottom(1000);
    }
);

watch(comp.getThread, () => loadThread());

watch(
    () => props.hideCoordinator,
    () => loadThread()
);

onMounted(() => {
  loadThread();
});
</script>
