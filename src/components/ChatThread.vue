<template>
  <div class="q-pa-xl row justify-center" style="width: 100%;">
    <div>
      <q-chat-message
          :label="thread.messages.length.toString() + ' messages'"
      />

      <div v-for="message in parseThread" :key="message.date">
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
                flat>
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
    </div>
  </div>
</template>

<script lang="ts" setup>

import { computed } from "vue"

const myName = "Andrei Cozma"

interface TextMessage {
  text: string[];
  images?: string[];
  avatar: string;
  name: string;
  date: string;
}

const randomMinMax = (min: number, max: number) => Math.random() * (max - min) + min

const getSeededAvatarURL = (seed: string) => {
  return `https://robohash.org/${seed}`
}

interface ImageOptions {
  width?: number;
  height?: number;
}

const getSeededImageURL = (seed: string, options?: ImageOptions) => {
  const w = options?.width || Math.round(randomMinMax(100, 800))
  const h = options?.height || Math.round(randomMinMax(100, 800))
  seed = seed.replace(/ /g, "_")
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

const getRandomTextStr = () => {
  const chunks = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  ]
  return chunks[Math.floor(Math.random() * chunks.length)]
}

interface ColorConfig {
  minLightness?: number;
  maxLightness?: number;
  minSaturation?: number;
  maxSaturation?: number;
  minHue?: number;
  maxHue?: number;
  minAlpha?: number;
  maxAlpha?: number;
}

const getSeededColorHex = (seed: string, config: ColorConfig) => {
  const hue = randomMinMax(config.minHue ?? 0, config.maxHue ?? 360)
  const saturation = randomMinMax(config.minSaturation ?? 0, config.maxSaturation ?? 100)
  const lightness = randomMinMax(config.minLightness ?? 0, config.maxLightness ?? 100)
  const alpha = randomMinMax(config.minAlpha ?? 0, config.maxAlpha ?? 1)

  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

const baseQuasarColors = [
  "red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan", "teal", "green", "light-green",
  "lime", "yellow", "amber", "orange", "deep-orange", "brown", "grey", "blue-grey"
]

// for each number 1 through 14 inclusive
const allQuasarColors = Array.from(Array(15).keys()).map(i => {
  // add the number to the baseQuasarColors array
  if (i === 0) return baseQuasarColors
  return baseQuasarColors.map(c => c + "-" + i)
})

const getSeededQColor = (seed: string | number, minNum?: number, maxNum?: number) => {
  // based on the seed pick a color from the list of all quasar colors
  // do not use random here, because we want the same seed to always return the same color
  minNum = minNum ?? 0
  maxNum = maxNum ?? allQuasarColors.length - 1
  // create a flat list of all colors between minNum and maxNum inclusive
  // now interleave the colors
  const interleavedColors = allQuasarColors.slice(minNum, maxNum + 1).reduce((acc, val) => {
    val.forEach((v, i) => {
      if (!acc[i]) acc[i] = []
      acc[i].push(v)
    })
    return acc
  }, [] as string[][])
  // now flatten the array
  const flattenedColors = interleavedColors.flat()
  console.log(flattenedColors)
  if (typeof seed === "string") {
    seed = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }

  return flattenedColors[seed % flattenedColors.length]
}

const generateMessage = (seed: string) => {
  const config = {
    numTextMin : 1,
    numTextMax : 3,
    numImageMin: 0,
    numImageMax: 3
  }

  const text = []
  const numText = Math.floor(Math.random() * (config.numTextMax - config.numTextMin + 1)) + config.numTextMin
  for (let i = 0; i < numText; i++) {
    const txt = getRandomTextStr()
    text.push(txt)
  }

  const images = []
  const numImage = Math.floor(Math.random() * (config.numImageMax - config.numImageMin + 1)) + config.numImageMin
  for (let i = 0; i < numImage; i++) {
    const txtSeed = getRandomTextStr()
    const img = getSeededImageURL(txtSeed)
    images.push(img)
  }

  const avatar = getSeededAvatarURL(seed)
  const stampDate = new Date()
  // use general time that can later be converted to local time
  // set days
  stampDate.setDate(stampDate.getDate() - Math.floor(Math.random() * 30))
  stampDate.setHours(Math.floor(Math.random() * 24))
  stampDate.setMinutes(Math.floor(Math.random() * 60))
  stampDate.setSeconds(Math.floor(Math.random() * 60))
  const stamp = stampDate.toISOString()

  return {
    text  : text,
    images: images,
    avatar: avatar,
    name  : seed,
    date  : stamp
  } as TextMessage
}

interface MessageThread {
  messages: TextMessage[];
}

const generateThread = (names: Array<string>) => {
  const config = {
    numMessageMin: 20,
    numMessageMax: 100
  }

  const messages = []
  const numMessage = Math.floor(
      Math.random() * (config.numMessageMax - config.numMessageMin + 1)) + config.numMessageMin
  for (let i = 0; i < numMessage; i++) {
    // pick randomly between names
    const seed = names[Math.floor(Math.random() * names.length)]
    messages.push(generateMessage(seed))
  }

  return {
    messages: messages
  } as MessageThread
}

const thread: MessageThread = generateThread([ myName, "John Doe", "Jane Doe" ])

const getTimeAgo = (stamp: string) => {
  const date = new Date(stamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
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

const parseStamp = (message: TextMessage) => {
  const timeAgo = getTimeAgo(message.date)
  const isSent = isSentByMe(message)
  return isSent ? `Sent ${timeAgo}` : `Received ${timeAgo}`
}

const parseDate = (message: TextMessage) => {
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
  const youSent = `${numTotal} message${numTotal > 1 ? "s" : ""} (${numText} text, ${numImage} image${numImage > 1 ? "s"
      : ""})`
  const onDate = parseDate(message)
  return `${who} sent ${youSent} on ${onDate}`
}

const parseThread = computed(() => {

  const thrd = thread.messages.map((message: TextMessage) => {
    const text = message.text.length === 0 ? [] : [ ...message.text ]
    if (text.length === 0) text.push("[No message]")
    return {
      ...message,
      text : text,
      stamp: parseStamp(message),
      sent : isSentByMe(message),
      title: parseHoverHint(message)
    }
  })
  // sort by date
  thrd.sort((a, b) => {
    const ad = new Date(a.date)
    const bd = new Date(b.date)
    return ad.getTime() - bd.getTime()
  })
  return thrd
})


</script>


