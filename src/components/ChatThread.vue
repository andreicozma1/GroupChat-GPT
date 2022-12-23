<template>
  <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message
        class="q-pt-md"
        :label="threadMessages.length.toString() + ' messages'"
    />
    <div v-for="msg in threadMessages" :key="msg.date">
      <q-chat-message
          v-bind="msg"
          size="6"
          :bg-color="msg.sent ? null : getSeededQColor(msg.name, 1, 2)"
      >
        <div v-for="text in msg.text" :key="text">
          <div v-for="line in getSplitText(text)" :key="line" @click="copyMessage(text)">
            {{ line }}
            <br/>
          </div>
          <q-tooltip v-if="msg.dateCreated" :delay="750">
            {{ createHoverHint(msg) }}
          </q-tooltip>
        </div>

        <template v-if="msg.loading">
          <q-spinner-dots class="q-ml-md" color="primary" size="1.5em"/>
        </template>

        <template v-slot:stamp>
          <div class="row items-center">
            <span>
              <q-icon
                  :name="getObjectiveIcon(msg.objective)"
                  class="q-mr-sm"
              />
              <q-tooltip v-if="actors[msg.objective]?.config">
                Objective: {{ msg.objective }}
              </q-tooltip>
            </span>
            <span class="text-caption text-italic">
              {{ createStamp(msg) }}
              <q-tooltip>
                {{ dateToStr(msg.date) }}
              </q-tooltip>
            </span>
            <q-space/>
            <span v-if="msg.cached">
              <q-icon name="cached" class="q-ml-sm"/>
              <q-tooltip v-if="msg.dateCreated">
                Generated
                {{ getTimeAgo(msg.dateCreated) }}
                ({{ dateToStr(msg.dateCreated) }})
              </q-tooltip>
            </span>
          </div>
        </template>

        <div v-if="msg.images.length > 0">
          <q-card
              v-for="image in msg.images"
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
import { copyToClipboard } from "quasar"
import { getSeededQColor } from "src/util/ColorUtils"
import { TextMessage } from "src/util/Models"
import { dateToStr, getTimeAgo, smartNotify } from "src/util/Util"
import { actors, useCompStore } from "stores/compStore"
import { computed, onMounted, ref, watch } from "vue"

const threadElem: any = ref(null)
const comp = useCompStore()

const props = defineProps({
  myName         : {
    type    : String,
    required: false,
    default : "Human"
  },
  scrollAreaStyle: {
    type    : Object,
    required: false,
    default : null
  }
})

const getObjectiveIcon = (objective: string) => {
  if (!actors[objective]) return "send"
  if (!actors[objective].icon) return "help"
  return actors[objective].icon
}

const threadMessages = computed(() => {
  const thrd = comp.getThread.messages.map((msg: TextMessage) => {
    const text = msg.text.length === 0 ? [] : [ ...msg.text ]
    if (!msg.loading && text.length === 0) text.push("[No message]")
    return {
      ...msg,
      text : text,
      stamp: createStamp(msg),
      sent : isSentByMe(msg)
    }
  })
  thrd.sort((a, b) => {
    const ad = new Date(a.date)
    const bd = new Date(b.date)
    return ad.getTime() - bd.getTime()
  })
  return thrd
})

const createStamp = (msg: TextMessage) => {
  const timeAgo = getTimeAgo(msg.date)
  const sentByMe = isSentByMe(msg)
  return sentByMe ? `Sent ${timeAgo}` : `Received ${timeAgo}`
}

const createHoverHint = (msg: TextMessage) => {
  const numText = msg.text?.length ?? 0
  const numImage = msg.images?.length ?? 0
  const numTotal = numText + numImage
  const who = isSentByMe(msg) ? "You" : msg.name
  const what = `${numTotal} msg${numTotal > 1 ? "s" : ""} (${numText} text, ${numImage} image${numImage > 1 ? "s"
      : ""})`
  const when = dateToStr(msg.date)
  return `${who} sent ${what} on ${when}`
}

const isSentByMe = (msg: TextMessage) => {
  return msg.name === props.myName
}

const getScrollAreaStyle = computed(() => {
  const propStyle = props.scrollAreaStyle ? props.scrollAreaStyle : {}
  const defaults = {
    position    : "absolute",
    left        : "0px",
    right       : "0px",
    top         : "50px",
    bottom      : "0px",
    paddingLeft : "5vw",
    paddingRight: "5vw"
  }
  return {
    ...defaults, ...propStyle
  }
})

const scrollToBottom = (duration?: number) => {
  if (threadElem.value) {
    duration = duration ?? 750
    // scroll to bottom. The element is q-scroll-area
    const size = threadElem.value.getScroll().verticalSize
    threadElem.value.setScrollPosition("vertical", size, duration)
  }
}

const getSplitText = (text: string) => {
  const fallback = [ "[Error: Text is null]" ]
  // split text into lines
  const lines = text?.split("\n") ?? fallback
  return lines
}

const copyMessage = (text: string) => {
  copyToClipboard(text).then(() => {
    smartNotify(`Copied message to clipboard`)
  })
}

watch(() => props.scrollAreaStyle, () => {
  scrollToBottom(1000)
})

// scroll to bottom if the thread changes
watch(threadMessages, () => {
  scrollToBottom(1000)
})

onMounted(() => {
  scrollToBottom(1000)
})
</script>
