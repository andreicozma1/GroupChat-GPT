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

      <!--      <ExploreContainer name="Tab 1 page"/>-->

      <ion-content>
        <ion-list lines="full">
          <ion-item v-for="(item, index) in items" :key="index">
            <!--          A chat style where the user's bubbles are on the right side, and the AI's bubbles are on the left side in a different color -->
            <ion-avatar :slot="item.type === 'user' ? 'end' : 'start'" edge
                        style="margin: 0">
              <img :src="item.avatar" alt="avatar"/>
            </ion-avatar>
            <!--          Set margin to push to left or right -->
            <ion-card
                :color="item.type === 'user' ? 'light' : 'secondary'"
                :style="item.type === 'user' ? {marginLeft: 'auto'} : {marginRight: 'auto'}">

              <ion-card-header>
                <ion-card-subtitle>{{ item.title }} @ {{ item.time }}</ion-card-subtitle>
              </ion-card-header>

              <div style="height: 1px; margin: 0 10px; background-color: #000000"></div>

              <ion-card-content>
                {{ item.message }}
              </ion-card-content>

            </ion-card>
          </ion-item>
        </ion-list>
        <ion-infinite-scroll @ionInfinite="ionInfinite">
          <ion-infinite-scroll-content></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </ion-content>
    </ion-content>


    <ion-card>
      <ion-card-header>
        <ion-card-title>AI Chatbot</ion-card-title>
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
      <ion-button class="ion-margin" fill="outline" @click="sendMessage">Send</ion-button>

    </ion-card>
  </ion-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue"
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue"

const message = ref("Hello, how are you today?")
const items = reactive([])

const users = {
  user: {
    name  : "User",
    avatar: "https://picsum.photos/80/80?random=1"
  },
  bot : {
    name  : "Bot",
    avatar: "https://picsum.photos/80/80?random=2"
  }
}

const generateItems = () => {
  const count = items.length + 1
  for (let i = 0; i < 50; i++) {
    const ci = count + i
    // alternate between user and bot
    const type = i % 2 === 0 ? "user" : "bot"
    const actor = users[type]
    items.push({
      type   : type,
      name   : actor.name,
      avatar : actor.avatar,
      title  : "Title",
      message: "Message " + ci,
      time   : new Date().toLocaleTimeString()
    })
  }
}

const ionInfinite = (ev) => {
  generateItems()
  setTimeout(() => ev.target.complete(), 500)
}

const sendMessage = () => {
  console.log("Hello World")
}

generateItems()
</script>
