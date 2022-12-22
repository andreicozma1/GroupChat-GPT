<template>
  <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
    <q-chat-message
        class="q-pt-md"
        :label="threadMessages.length.toString() + ' messages'"
    />
    <div v-for="message in threadMessages" :key="message.date">
      <q-chat-message
          v-bind="message"
          size="6"
          :bg-color="message.sent ? null : getSeededQColor(message.name, 1, 2)"
          @click="copyMessage(message)"
      >
        <div v-for="text in message.text" :key="text">
          <div v-for="line in getSplitText(text)" :key="line">
            {{ line }}
            <br/>
          </div>
          <q-tooltip v-if="message.dateCreated" :delay="750">
            {{ createHoverHint(message) }}
          </q-tooltip>
        </div>

        <template v-if="message.loading">
          <q-spinner-dots class="q-ml-md" color="primary" size="1.5em"/>
        </template>

        <template v-slot:stamp>
          <div class="row items-center">
            <span>
              <q-icon
                  :name="getObjectiveIcon(message.objective)"
                  class="q-mr-sm"
              />
              <q-tooltip v-if="actors[message.objective]?.config">
                Objective: {{ message.objective }}
              </q-tooltip>
            </span>
            <span class="text-caption text-italic">
              {{ createStamp(message) }}
              <q-tooltip>
                {{ dateToStr(message.date) }}
              </q-tooltip>
            </span>
            <q-space/>
            <span v-if="message.cached">
              <q-icon name="cached" class="q-ml-sm"/>
              <q-tooltip v-if="message.dateCreated">
                Generated
                {{ getTimeAgo(message.dateCreated) }}
                ({{ dateToStr(message.dateCreated) }})
              </q-tooltip>
            </span>
          </div>
        </template>

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
import { copyToClipboard } from "quasar"
import { getSeededQColor } from "src/util/ColorUtils"
import { TextMessage } from "src/util/Models"
import { dateToStr, getTimeAgo, smartNotify } from "src/util/Util"
import { actors, useCompStore } from "stores/compStore"
import { computed, ref, watch } from "vue"

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
  const thrd = comp.getThread.messages.map((message: TextMessage) => {
    const text = message.text.length === 0 ? [] : [ ...message.text ]
    if (!message.loading && text.length === 0) text.push("[No message]")
    return {
      ...message,
      text : text,
      stamp: createStamp(message),
      sent : isSentByMe(message)
    }
  })
  thrd.sort((a, b) => {
    const ad = new Date(a.date)
    const bd = new Date(b.date)
    return ad.getTime() - bd.getTime()
  })
  return thrd
})

const createStamp = (message: TextMessage) => {
  const timeAgo = getTimeAgo(message.date)
  const sentByMe = isSentByMe(message)
  return sentByMe ? `Sent ${timeAgo}` : `Received ${timeAgo}`
}

const createHoverHint = (message: TextMessage) => {
  const numText = message.text?.length ?? 0
  const numImage = message.images?.length ?? 0
  const numTotal = numText + numImage
  const who = isSentByMe(message) ? "You" : message.name
  const what = `${numTotal} message${numTotal > 1 ? "s" : ""} (${numText} text, ${numImage} image${numImage > 1 ? "s"
      : ""})`
  const when = dateToStr(message.date)
  return `${who} sent ${what} on ${when}`
}

const isSentByMe = (message: TextMessage) => {
  return message.name === props.myName
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
  return text?.split("\n") ?? [ "[ERR: Text is null]" ]
}

const copyMessage = (message: TextMessage) => {
  const text = message.text.join("\n")
  copyToClipboard(text).then(() => {
    smartNotify(`Copied message to clipboard`)
  })
}

watch(() => props.scrollAreaStyle, () => {
  scrollToBottom(1000)
})
</script>
