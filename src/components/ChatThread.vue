<template>
  <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message :label="threadMessages.length.toString() + ' messages'" class="q-pt-md"/>
    <div v-for="msg in threadMessages" :key="msg.dateCreated">
      <q-chat-message :bg-color="msg.sent ? null : getSeededQColor(msg.name, 1, 2)" size="6" v-bind="msg">
        <div v-for="text in msg.text" :key="text">
          <div v-for="line in getSplitText(text)" :key="line" @click="copyMessage(text)" v-html="sanitizeLine(line)"/>
          <q-tooltip v-if="msg.dateCreated" :delay="750">
            {{ createHoverHint(msg) }}
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
                Received: {{ dateToStr(msg.dateCreated) }}
              </q-tooltip>
            </span>
            <q-space/>
            <span v-if="msg.cached">
              <q-icon class="q-ml-sm" name="cached"/>
              <q-tooltip v-if="msg.dateCreated">
                Generated
                {{ getTimeAgo(msg.dateCreated) }}
                ({{ dateToStr(msg.dateCreated) }})
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
import {convertDate, dateToStr, getTimeAgo, handleAssistant, smartNotify} from "src/util/Utils";
import {useCompStore} from "stores/compStore";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {AssistantConfigs} from "src/util/assistant/Assistants";
import {ChatMessage, getThreadMessages} from "src/util/Chat";

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
      stamp: createStamp(msg),
      sent: isSentByMe(msg),
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

let lastTime = new Date()
const shuffleStampTimeout = 2500;

const createStamp = (msg: ChatMessage) => {
  const timeAgoCreated = getTimeAgo(msg.dateCreated);
  // get the current time
  const currTime = new Date();
  // only show every 5 seconds
  if (msg.dateGenerated && currTime.getTime() - lastTime.getTime() > shuffleStampTimeout) {
    setTimeout(() => {
      lastTime = new Date();
    }, shuffleStampTimeout);
    const timeAgoUpdated = getTimeAgo(msg.dateGenerated);
    return `Generated ${timeAgoUpdated}`;
  }
  const sentByMe = isSentByMe(msg);
  return sentByMe ? `Sent ${timeAgoCreated}` : `Received ${timeAgoCreated}`;
};

const createHoverHint = (msg: ChatMessage) => {
  const numText = msg.text?.length ?? 0;
  const numImage = msg.images?.length ?? 0;
  const numTotal = numText + numImage;
  const who = isSentByMe(msg) ? "You" : msg.name;
  const what = `${numTotal} msg${numTotal > 1 ? "s" : ""} (${numText} text, ${numImage} image${
      numImage > 1 ? "s" : ""
  })`;
  const when = dateToStr(msg.dateCreated);
  return `${who} sent ${what} on ${when}`;
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
  return msg.result?.messageIds?.length > 0;
};

const deleteMessage = (msg: ChatMessage) => {
  smartNotify(`Message deletion is not yet implemented`);
  console.warn("=> delete:", {...msg});
  // comp.deleteMessage(msg);
};

watch(
    () => props.scrollAreaStyle,
    () => {
      scrollToBottom(1000);
    }
);

watch(comp.getThread, () => {
  threadMessages.value = parseThreadMessages();
  scrollToBottom(1000);
});

watch(
    () => props.hideCoordinator,
    () => {
      threadMessages.value = parseThreadMessages();
      scrollToBottom(1000);
    }
);

onMounted(() => {
  scrollToBottom(1000);
  threadMessages.value = parseThreadMessages();
});
</script>
