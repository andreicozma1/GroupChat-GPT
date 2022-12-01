<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 1</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 1</ion-title>
        </ion-toolbar>
      </ion-header>


      <ion-content>
        <ion-list lines="full">
          <ion-item v-for="(item, index) in conv.history" :key="index">
            <ion-avatar :slot="item.who === 'self' ? 'end' : 'start'" edge
                        style="margin: 0">
              <img :src="item.user.avatar" alt="avatar"/>
            </ion-avatar>
            <ion-card
                :color="item.who === 'self' ? 'light' : 'secondary'"
                :style="item.who === 'self' ? {marginLeft: 'auto'} : {marginRight: 'auto'}">

              <ion-card-header>
                <ion-card-subtitle>{{ item.type.toUpperCase() }} @ {{ item.time }}</ion-card-subtitle>
              </ion-card-header>

              <div style="height: 1px; margin: 0 10px; background-color: #000000"></div>

              <ion-card-content>
                {{ item.message }}

                <ion-grid v-if="item.images.length > 0">
                  <ion-row v-for="(row, rowIndex) in getGrid(item.images)" :key="rowIndex">
                    <ion-col v-for="(image, colIndex) in row" :key="colIndex">
                      <ion-thumbnail @click="showSlideshow(item.images, rowIndex, colIndex)">
                        <img :src="image" alt="image"/>
                      </ion-thumbnail>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </ion-card-content>

            </ion-card>
          </ion-item>
        </ion-list>
        <ion-infinite-scroll @ionInfinite="fetchMoreConversations">
          <ion-infinite-scroll-content></ion-infinite-scroll-content>
        </ion-infinite-scroll>


      </ion-content>
    </ion-content>

    <ion-modal :is-open="modalImages.showModal" @ionModalDidDismiss="modalImages.showModal = false">

      <ion-content>
        <ion-slides :options="modalImages.slideOpts" pager style="height: 100%">
          <ion-slide v-for="(image, index) in modalImages.images" :key="index">
            <img :src="image" alt="image" style="width: 100%; height: auto;"/>
          </ion-slide>
        </ion-slides>
        <div class="swiper-button-prev" @click="prevSlide"></div>
        <div class="swiper-button-next" @click="nextSlide"></div>
      </ion-content>

    </ion-modal>


    <ion-card>
      <ion-card-header>
        <ion-card-title>AI Chat-bot</ion-card-title>
        <!--            <ion-card-subtitle>Card Subtitle</ion-card-subtitle>-->
      </ion-card-header>

      <ion-card-content>
        <ion-textarea
            :value="message"
            auto-grow
            autofocus
            clear-input
            enterkeyhint="send"
            inputmode="text"
            minlength="1"
            placeholder="Type to chat with the AI"
            required
            spellcheck
            style="border: 1px solid lightblue; border-radius: 5px; padding: 5px;"
            type="text"
        />
      </ion-card-content>

      <ion-card-content>
        <ion-button fill="outline" @click="sendMessage">Send</ion-button>
        <ion-button fill="outline" @click="clearConversation">Clear</ion-button>
        <ion-button fill="outline" @click="refreshConversation">Refresh</ion-button>
      </ion-card-content>
    </ion-card>
  </ion-page>
</template>


<script lang="ts" setup>
import { onMounted, ref } from "vue"
import {
  IonButton, IonContent, IonHeader, IonItem, IonModal, IonPage, IonSlide, IonSlides, IonTitle, IonToolbar
} from "@ionic/vue"
import { getAvatar, getPicsum } from "@/util/Util"
import { Message } from "@/util/Models"
import { getCache, updateCache } from "@/util/Cache"

const users = {
  self : {
    name  : "User",
    avatar: getAvatar("user")
  },
  other: {
    name  : "Bot",
    avatar: getAvatar("bot")
  }
}

const conv = ref({
  message: "Hello, how are you today?",
  history: [] as Message[]
})

const imageCols = 3

const modalImages = ref({
  showModal: false,
  images   : [] as string[],
  slideOpts: {
    initialSlide : 1,
    speed        : 400,
    loop         : true,
    slidesPerView: 1
  }
})

const generateItems = () => {
  const newItems = []
  const count = conv.value.history.length + 1
  for (let i = 0; i < 50; i++) {
    const ci = count + i

    const who = i % 2 === 0 ? "self" : "other"
    const user = users[who]

    const images = []
    const numImages = Math.floor(Math.random() * 5)
    for (let j = 0; j < numImages; j++) {
      images.push(getPicsum(`${who}-${ci}-${j}`, 500, 300))
    }

    const message: Message = {
      who    : who,
      user   : user,
      type   : "text",
      time   : new Date().toLocaleTimeString(),
      title  : "Message Title",
      message: `Message ${ci}`,
      images : images
    }

    newItems.push(message)
  }
  return newItems
}

const fetchMoreConversations = (ev) => {
  // generateItems()
  setTimeout(() => ev.target.complete(), 500)
}

const sendMessage = () => {
  console.log("Hello World")
}

const getGrid = (images: string[]) => {
  const grid = []
  let row = []
  for (let i = 0; i < images.length; i++) {
    row.push(images[i])
    if (row.length === imageCols) {
      grid.push(row)
      row = []
    }
  }
  if (row.length > 0) {
    grid.push(row)
  }
  return grid
}

const showSlideshow = (images: string[], rowIndex: number, colIndex: number) => {
  console.log("showSlideshow", images, rowIndex, colIndex)
  modalImages.value.images = [ ...images ]
  modalImages.value.slideOpts.initialSlide = rowIndex * imageCols + colIndex
  modalImages.value.showModal = true
}

const prevSlide = () => {
  console.log("prevSlide")
  const el = document.querySelector("ion-slides")
  el?.slidePrev()
}

const nextSlide = () => {
  console.log("nextSlide")
  const el = document.querySelector("ion-slides")
  el?.slideNext()
}

const clearConversation = () => {
  console.log("Clearing conv.value.conversation")
  conv.value.history.splice(0, conv.value.history.length)
  updateCache(conv.value.history)
}

const refreshConversation = () => {
  console.log("Generating new conv.value.conversation")
  clearConversation()
  conv.value.history.push(...generateItems())
  updateCache(conv.value.history)
}

// on mounted
onMounted(() => {
  const existingConversation = getCache()
  if (existingConversation) {
    conv.value.history.push(...getCache())
  } else {
    conv.value.history.push(...generateItems())
    updateCache(conv.value.history)
  }
})


</script>
