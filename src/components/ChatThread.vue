<template>
  <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message :label="threadMessages.length.toString() + ' messages'" class="q-pt-md"/>
    <div v-for="msg in threadMessages" :key="msg.dateCreated">
      <q-chat-message size="6"
                      :sent="isSentByMe(msg)"
                      :bg-color="isSentByMe(msg) ? null : getSeededQColor(msg.userName, 1, 2)"
                      v-bind="msg">
        <div v-for="text in msg.textSnippets" :key="text">
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
              <q-icon :name="getAssistantIcon(msg.userId)" class="q-mr-sm"/>
                <q-tooltip>
                {{ msg.userId }}
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

        <div v-if="msg.imageUrls.length > 0">
          <q-card v-for="image in msg.imageUrls" :key="image" :title="image" class="bg-grey-1" flat>
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
import {handleAssistant} from "src/util/Utils";
import {useCompStore} from "stores/compStore";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {AiAssistantConfigs} from "src/util/assistant/AiAssistantConfigs";
import {ChatMessage, ChatThread, getThreadMessages} from "src/util/ChatUtils";
import {smartNotify} from "src/util/SmartNotify";
import {dateToLocaleStr, dateToTimeAgo, parseDate} from "src/util/DateUtils";

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
});

const comp = useCompStore();

const threadElem: any = ref(null);
const threadMessages: Ref<ChatMessage[]> = ref([]);

const getAssistantIcon = (assistantKey: string) => {
  if (!AiAssistantConfigs[assistantKey]) return "send";
  if (!AiAssistantConfigs[assistantKey].icon) return "help";
  return AiAssistantConfigs[assistantKey].icon;
};

function hasKeepKeywords(msg: ChatMessage) {
  const keywords = ["[ERROR]", "[WARNING]", "[INFO]"];
  return msg.textSnippets.some((line: string) => {
    return keywords.some((keyword: string) => line.includes(keyword))
  });
}

function hasRemoveKeywords(msg: ChatMessage) {
  const keywords = ["[DEBUG]"];
  return msg.textSnippets.some((line: string) => {
    return keywords.some((keyword: string) => line.includes(keyword))
  });
}

const parseThreadMessages = (): ChatMessage[] => {
  const thread: ChatThread = comp.getThread
  let messages: ChatMessage[] = getThreadMessages(thread)
  /************************************************************************
   ** FILTERING
   ************************************************************************/
  messages = messages.filter((msg: ChatMessage) => {
    // always keep messages with certain keywords
    if (hasKeepKeywords(msg)) return true;
    // always remove messages with certain keywords
    if (hasRemoveKeywords(msg)) return false;
    // remove messages from users that are hidden in thread settings
    if (thread.hiddenUserIds?.includes(msg.userId)) return false;
    return true;
  });
  /************************************************************************
   ** MAPPING
   ************************************************************************/
  messages = messages.map((msg: ChatMessage) => {
    const text = msg.textSnippets.length === 0 ? [] : [...msg.textSnippets];
    if (!msg.loading && text.length === 0) text.push("[No message]");
    return {
      ...msg,
      textSnippets: text,
    };
  });
  /************************************************************************
   ** SORTING
   ************************************************************************/
  // sort by dateCreated
  messages.sort((a, b) => {
    const ad = parseDate(a.dateCreated);
    const bd = parseDate(b.dateCreated);
    return ad.getTime() - bd.getTime();
  });
  // sort to keep loading messages at the bottom
  messages.sort((a, b) => {
    if (a.loading && !b.loading) return 1;
    if (!a.loading && b.loading) return -1;
    return 0;
  });
  return messages;
};


const createStamp = (msg: ChatMessage) => {
  const what = isSentByMe(msg) ? "Sent" : "Received";
  const on = dateToTimeAgo(msg.dateCreated)
  let res = `${what} ${on}`
  if (msg.isCompRegen) res = `*${res}`;
  return res;
};


const createContentHoverHint = (msg: ChatMessage) => {
  const numTexts = msg.textSnippets?.length ?? 0;
  const numImages = msg.imageUrls?.length ?? 0;
  const who = isSentByMe(msg) ? "You" : msg.userName;
  const what = `${numTexts} text and ${numImages} image${numImages === 1 ? "" : "s"}`;
  const when = dateToLocaleStr(msg.dateCreated);
  return `${who} sent ${what} on ${when}`;
};

const createStampHoverHint = (msg: ChatMessage) => {
  const when = dateToLocaleStr(msg.dateCreated);
  const what = isSentByMe(msg) ? "Sent" : "Received";
  let res = `${what} on ${when}`;
  const dateGenerated = msg.result?.responseData?.created * 1000;
  if (dateGenerated) {
    res += '\n\n' + ` [Generated on ${dateToLocaleStr(dateGenerated)}]`;
  }
  return res;
};


const isSentByMe = (msg: ChatMessage) => {
  return msg.userName === props.myName;
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
  const tagsReplMap: { [key: string]: string } = {
    prompt: "b",
    image: "b",
    code: "b",
  };
  // replace special tags with valid html tags to distinguish them
  const regex = /<\/?([a-z]+)[^>]*>/gi;
  return line.replace(regex, (match, oldTag: string) => {
    // replace tag with replacement if it exists
    if (oldTag in tagsReplMap) return `<${tagsReplMap[oldTag]}>`;
    // remove all other tags
    return "";
  });
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
  console.warn("=> regenerate:", msg.result?.messageIds);
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
    const threadVer = comp.getThread.appVersion;
    let caption: string;
    if (threadVer) {
      caption = `Saved content from version ${threadVer} is not compatible with the current version of the app.`
    } else {
      caption = `Saved content is not compatible with the current version of the app.`
    }
    caption += 'Please try again with a new thread or clear the cache.'
    smartNotify(`Warning: Conversation data structures have changed.`, caption);
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
    () => comp.getThread.hiddenUserIds,
    () => loadThread()
);

onMounted(() => {
  loadThread();
});
</script>
