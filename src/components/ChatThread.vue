<template>
  <q-scroll-area
      class="q-px-xl"
      ref="threadElem"
      style="position: absolute; left: 0; right: 0; top: 50px; bottom: 0"
  >
    <q-chat-message
        class="q-pt-md"
        :label="thread.messages.length.toString() + ' messages'"
    />
    <div v-for="message in parsedMessages" :key="message.date">
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
import { computed, onMounted, Ref, ref } from "vue"
import { getSeededAvatarURL } from "src/util/Util"
import { getSeededQColor } from "src/util/ColorUtils"
import { useCompStore } from "stores/compStore"

const threadElem: any = ref(null)
const comp = useCompStore()

const myName = "Andrei Cozma"

interface MessageThread {
  messages: TextMessage[];
}

interface TextMessage {
  text: string[];
  images?: string[];
  avatar: string;
  name: string;
  date: string | number;
}

const thread: Ref<MessageThread> = ref({
  messages: [] // messages: generateThreadMessages([ myName, "John Doe", "Jane Doe" ])
})

const getTimeAgo = (date: string | number) => {
  const then = new Date(date)
  const now = new Date()
  const diff = now.getTime() - then.getTime()
  const diffSeconds = Math.floor(diff / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  const timeAgo = {
    seconds: diffSeconds,
    minutes: diffMinutes,
    hours  : diffHours,
    days   : diffDays,
    weeks  : diffWeeks,
    months : diffMonths,
    years  : diffYears
  }

  // should use plural?
  const shouldUsePlural = (value: number) => value > 1

  // get time ago
  const getTimeAgo = (value: number, unit: string) => {
    return `${value} ${unit}${shouldUsePlural(value) ? "s" : ""} ago`
  }

  // get time ago
  if (timeAgo.years > 0) {
    return getTimeAgo(timeAgo.years, "year")
  } else if (timeAgo.months > 0) {
    return getTimeAgo(timeAgo.months, "month")
  } else if (timeAgo.weeks > 0) {
    return getTimeAgo(timeAgo.weeks, "week")
  } else if (timeAgo.days > 0) {
    return getTimeAgo(timeAgo.days, "day")
  } else if (timeAgo.hours > 0) {
    return getTimeAgo(timeAgo.hours, "hour")
  } else if (timeAgo.minutes > 0) {
    return getTimeAgo(timeAgo.minutes, "minute")
  } else if (timeAgo.seconds > 0) {
    return getTimeAgo(timeAgo.seconds, "second")
  } else {
    return "just now"
  }
}

const isSentByMe = (message: TextMessage) => {
  return message.name === myName
}

const createStamp = (message: TextMessage) => {
  const timeAgo = getTimeAgo(message.date)
  const sentByMe = isSentByMe(message)
  return sentByMe ? `Sent ${timeAgo}` : `Received ${timeAgo}`
}

const parseDateToStr = (message: TextMessage) => {
  const date = new Date(message.date)
  const options = {
    weekday: "short",
    year   : "numeric",
    month  : "short",
    day    : "numeric",
    hour   : "numeric",
    minute : "numeric",
    hour12 : true
  }
  return date.toLocaleDateString("en-US", options)
}

const parseHoverHint = (message: TextMessage) => {
  const numText = message.text?.length ?? 0
  const numImage = message.images?.length ?? 0
  const numTotal = numText + numImage
  const who = isSentByMe(message) ? "You" : message.name
  const what = `${numTotal} message${numTotal > 1 ? "s" : ""} (${numText} text, ${numImage} image${numImage > 1 ? "s"
      : ""})`
  const when = parseDateToStr(message)
  return `${who} sent ${what} on ${when}`
}

const parsedMessages = computed(() => {
  const thrd = thread.value.messages.map((message: TextMessage) => {
    const text = message.text.length === 0 ? [] : [ ...message.text ]
    if (text.length === 0) text.push("[No message]")
    return {
      ...message,
      text : text,
      stamp: createStamp(message),
      sent : isSentByMe(message),
      title: parseHoverHint(message)
    }
  })
  console.log("thrd", thrd)
  // sort by date
  thrd.sort((a, b) => {
    const ad = new Date(a.date)
    const bd = new Date(b.date)
    return ad.getTime() - bd.getTime()
  })
  console.log("thrd", thrd)
  return thrd
})

const getAIResponse = async () => {
  const prompt = {
    prompt     : "Hello, how are you?",
    ignoreCache: false
  }
  comp.genTextCompletion(prompt).then((res) => {
    const result = res?.result
    console.log("result", result)
    const created = result?.created * 1000
    const text = result?.choices[0]?.text
    const model = result?.model
    const object = result?.object
    const id = result?.id
    thread.value.messages.push({
      text  : [ text ],
      images: [],
      avatar: getSeededAvatarURL(model),
      name  : model,
      date  : created
    })
  })
}

onMounted(() => {
  if (threadElem.value) {
    // scroll to bottom. The element is q-scroll-area
    threadElem.value.setScrollPercentage("vertical", 1.0, 500)
  }

  getAIResponse()
})
</script>
