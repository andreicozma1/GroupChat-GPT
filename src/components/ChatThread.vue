<template>
  <q-scroll-area class="q-px-xl" ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message
      class="q-pt-md"
      :label="threadMessages.length.toString() + ' messages'"
    />
    <div v-for="message in threadMessages" :key="message.date">
      <q-chat-message
        v-bind="message"
        size="6"
        :bg-color="message.sent ? null : getSeededQColor(message.name, 1, 2)"
      >
        <div v-for="text in message.text" :key="text">
          <span>{{ text }}</span>
        </div>

        <div v-if="message.images.length > 0">
          <q-card
            v-for="image in message.images"
            class="bg-grey-1"
            :key="image"
            :title="image"
            flat
          >
            <q-card-section class="q-pa-none">
              <q-img
                draggable
                :src="image"
                fit="contain"
                style="max-height: 400px"
              />
            </q-card-section>
          </q-card>
        </div>
      </q-chat-message>
    </div>
  </q-scroll-area>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { getSeededQColor } from "src/util/ColorUtils";
import { TextMessage, useCompStore } from "stores/compStore";
import { dateToStr, getTimeAgo } from "src/util/Util";

const threadElem: any = ref(null);
const comp = useCompStore();

const props = defineProps({
  myName: {
    type: String,
    required: false,
    default: "You",
  },
  scrollAreaStyle: {
    type: Object,
    required: false,
    default: null,
  },
});

const threadMessages = computed(() => {
  const thrd = comp.getThread.messages.map((message: TextMessage) => {
    const text = message.text.length === 0 ? [] : [...message.text];
    if (text.length === 0) text.push("[No message]");
    return {
      ...message,
      text: text,
      stamp: createStamp(message),
      sent: isSentByMe(message),
      title: createHoverHint(message),
    };
  });
  // sort by date
  thrd.sort((a, b) => {
    const ad = new Date(a.date);
    const bd = new Date(b.date);
    return ad.getTime() - bd.getTime();
  });
  return thrd;
});

const createStamp = (message: TextMessage) => {
  const timeAgo = getTimeAgo(message.date);
  const sentByMe = isSentByMe(message);
  let res = sentByMe ? `Sent ${timeAgo}` : `Received ${timeAgo}`;
  if (message.cached) {
    if (message.dateCreated) {
      res += ` (cached ${getTimeAgo(message.dateCreated)})`;
    } else {
      res += " (cached)";
    }
  }
  return res;
};

const createHoverHint = (message: TextMessage) => {
  const numText = message.text?.length ?? 0;
  const numImage = message.images?.length ?? 0;
  const numTotal = numText + numImage;
  const who = isSentByMe(message) ? "You" : message.name;
  const what = `${numTotal} message${
    numTotal > 1 ? "s" : ""
  } (${numText} text, ${numImage} image${numImage > 1 ? "s" : ""})`;
  const when = dateToStr(message.date);
  return `${who} sent ${what} on ${when}`;
};

const isSentByMe = (message: TextMessage) => {
  return message.name === props.myName;
};

const getScrollAreaStyle = computed(() => {
  return {
    position: "absolute",
    left: "0px",
    right: "0px",
    top: "50px",
    bottom: "0px",
    ...props.scrollAreaStyle,
  };
});

const scrollToBottom = (duration?: number) => {
  if (threadElem.value) {
    duration = duration ?? 750;
    // scroll to bottom. The element is q-scroll-area
    threadElem.value.setScrollPercentage("vertical", 1.0, duration);
  }
};

watch(threadMessages, () => {
  scrollToBottom();
});

watch(
  () => props.scrollAreaStyle,
  () => {
    setTimeout(() => {
      scrollToBottom(100);
    }, 0);
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>
