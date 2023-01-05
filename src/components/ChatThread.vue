<template>
  <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message :label="threadMessages.length.toString() + ' messages'" class="q-pt-md"/>
    <div v-for="msg in threadMessages" :key="msg.dateCreated" :style="getMsgStyle(msg)">
      <q-chat-message
          v-bind="msg"
          size="6"
          :sent="isSentByMe(msg)"
          :bg-color="getBgColor(msg)"
          :name="msg.userName"
          :avatar="msg.userAvatarUrl"
      >
        <div v-for="text in parseTexts(msg)" :key="text">
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

            <span v-if="msg.isDeleted" class="text-bold">
            Delete?
            </span>
            <q-btn dense
                   round
                   flat
                   size="xs"
                   :icon="msg.isDeleted ? 'delete_forever' : 'delete'"
                   :color="msg.isDeleted ? 'red' : 'black'"
                   @click="deleteMessage(msg)"/>
            <!--            Restore -->
            <q-btn dense
                   round
                   flat
                   size="xs"
                   icon="restore"
                   v-if="msg.isDeleted"
                   color="green-11"
                   @click="restoreMessage(msg)"/>
            <q-btn dense
                   round
                   flat
                   size="xs"
                   v-if="!msg.isDeleted"
                   :icon="msg.isIgnored ? 'visibility' : 'visibility_off'"
                   color="black"
                   @click="ignoreMessage(msg)"/>
            <q-btn dense
                   round
                   flat
                   size="xs"
                   v-if="!msg.isDeleted"
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
import {getAppVersion} from "src/util/Utils";
import {useCompStore} from "stores/compStore";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getThreadMessages} from "src/util/chat/ChatUtils";
import {smartNotify} from "src/util/SmartNotify";
import {dateToLocaleStr, dateToTimeAgo, parseDate} from "src/util/DateUtils";
import {ChatMessage, ChatThread} from "src/util/chat/ChatModels";
import {ConfigUserBase} from "src/util/chat/ConfigUserBase";
import {handleAssistant} from "src/util/assistant/AssistantHandlers";

const props = defineProps({
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
  if (!AssistantConfigs[assistantKey]) return "send";
  if (!AssistantConfigs[assistantKey].icon) return "help";
  return AssistantConfigs[assistantKey].icon;
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
    if (!comp.getThread.prefs.showIgnoredMessages && msg.isIgnored) return false;
    // always keep messages with certain keywords
    if (hasKeepKeywords(msg)) return true;
    // always remove messages with certain keywords
    if (hasRemoveKeywords(msg)) return false;
    // remove messages from users that are hidden in thread settings
    if (thread.prefs?.shownUsers) {
      return thread.prefs.shownUsers[msg.userId] ?? true;
    }
    return true;
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
  messages.sort((a, b) => {
    // if isCompRegen is true, keep the same order
    if (a.isCompRegen || b.isCompRegen) return 0;
    // otherwise, keep loading messages at the bottom
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

const parseTexts = (msg: ChatMessage) => {
  const texts = msg.textSnippets;
  if ((!texts || texts.length === 0) && !msg.loading) return [""];
  return texts
}

const isSentByMe = (msg: ChatMessage) => {
  return msg.userName === ConfigUserBase.name;
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
  return text.split("\n");
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
  console.warn("=> regen:", {...msg});
  console.warn("msg:", {...msg});
  console.warn("ctxIds:", msg.result?.contextIds);
  handleAssistant(msg, comp);
};

const canRegenMessage = (msg: ChatMessage) => {
  if (msg.isDeleted) return false;
  const msgIds = msg.result?.contextIds
  if (msgIds) return msgIds.length > 0
  return false
};

const deleteMessage = (msg: ChatMessage) => {
  console.warn("=> delete:", {...msg});
  // 2nd click - confirmation and delete
  if (msg.isDeleted) {
    comp.deleteMessage(msg.id);
    return
  }
  // 1st click - will need 2nd click to confirm
  msg.isDeleted = true;
  msg.isIgnored = true;
};

const ignoreMessage = (msg: ChatMessage) => {
  console.warn("=> ignore:", {...msg});
  msg.isIgnored = msg.isIgnored === undefined ? true : !msg.isIgnored;
};

const restoreMessage = (msg: ChatMessage) => {
  console.warn("=> restore:", {...msg});
  msg.isDeleted = false;
  msg.isIgnored = false;
};

const getMsgStyle = (msg: ChatMessage) => {
  if (msg.isIgnored) return {opacity: 0.8};
};

const getBgColor = (msg: ChatMessage) => {
  if (msg.isDeleted) return null;
  return isSentByMe(msg) ? null : getSeededQColor(msg.userName, 1, 2)
}

const loadThread = () => {
  try {
    threadMessages.value = parseThreadMessages();
    scrollToBottom(1000);
  } catch (err: any) {
    console.error("Error loading chat thread", err);
    const threadVer = comp.getThread?.appVersion?.trim() ?? "unknown";
    const appVer = getAppVersion()
    console.log("Thread version:", threadVer);
    console.log("App version:", appVer);
    console.log(threadVer === appVer);
    let caption: string;
    if (threadVer !== appVer) {
      caption = `Saved content from version ${threadVer}`
    } else {
      caption = `Saved content`
    }
    caption += ` may not be compatible with version ${getAppVersion()} of the app.`
    caption += "\n"
    caption += 'Please try again with a new thread or clear the cache.'
    smartNotify(`An error occurred while loading saved chat thread`, caption);
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
    () => comp.getThread.prefs?.shownUsers,
    () => loadThread()
);

onMounted(() => {
  loadThread();
});
</script>
